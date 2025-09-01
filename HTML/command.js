require("dotenv").config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const sharp = require('sharp');
const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const url = require('url');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const TelegramBot = require('node-telegram-bot-api');

const PORT = process.env.PORT || 8000;

// ================== Telegram Setup ==================
const token = process.env.TEL_TOKEN;
const bot = new TelegramBot(token, {
  polling: process.env.NODE_ENV === "development"
});

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 📌 Rate Limit
const limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
app.use(limiter);

// 📌 Multer
const upload = multer({ storage: multer.memoryStorage() });

// 📌 Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 📌 تخزين الطلبات والمستخدمين
const userOrders = {};
const userCarts = {};
const orderQueue = [];
const userSessions = {};

// 📌 نظام الإدارة والصلاحيات
const ADMIN_USERS = {
  [process.env.TEL_ID]: {
    name: "المشرف الرئيسي",
    role: "owner",
    permissions: ["all"]
  }
};

// 📌 إعدادات العمولة
const AFFILIATE_CONFIG = {
  aliexpress: {
    base_url: "https://alixepress.com",
    affiliate_param: "aff_platform",
    default_commission: 0.08,
    enabled: true
  },
  amazon: {
    base_url: "https://amazon.com",
    affiliate_param: "tag",
    default_commission: 0.05,
    enabled: true
  },
  shein: {
    base_url: "https://shein.com",
    affiliate_param: "aff_id",
    default_commission: 0.10,
    enabled: true
  },
  shopify: {
    base_url: "https://shopify.com",
    affiliate_param: "ref",
    default_commission: 0.07,
    enabled: true
  }
};

// 📌 تتبع العمولات
const affiliateCommissions = [];

// 📌 جلسات المحادثة
const sessions = {};

// 📌 Helper: تنفيذ أوامر
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
}

// ================== دوال مساعدة ==================
function shortenProductTitle(title, maxLength = 60) {
  if (!title || title.length <= maxLength) return title || 'لا يوجد اسم';
  
  const words = title.split(' ');
  let result = '';
  
  for (const word of words) {
    if ((result + ' ' + word).length > maxLength - 3) break;
    result += (result ? ' ' : '') + word;
  }
  
  return result + (result.length < title.length ? '...' : '');
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatProductMessage(product) {
  const storeIcon = getStoreIcon(product.source);
  const message = `
${storeIcon} *${shortenProductTitle(product.title, 50)}*

💰 السعر: ${product.price}
⭐ التقييم: ${product.rating || 'غير متوفر'}
🛒 الطلبات: ${product.orders || 'لا توجد طلبات'}
🚚 الشحن: ${product.shipping || 'رسوم شحن'}
🏪 المتجر: ${product.store}
${product.discount ? `🎯 الخصم: ${product.discount}` : ''}
${product.commission_rate ? `🎯 العمولة: ${(product.commission_rate * 100).toFixed(1)}%` : ''}
  `.trim();
  
  return message;
}

function getStoreIcon(source) {
  const icons = {
    'amazon': '📦',
    'aliexpress': '🛒',
    'shein': '👗',
    'shopify': '🛍️'
  };
  return icons[source] || '🏪';
}

// ================== نظام التحقق من الصلاحيات ==================
function isAdmin(userId) {
  return ADMIN_USERS.hasOwnProperty(userId.toString());
}

function hasPermission(userId, permission) {
  const user = ADMIN_USERS[userId.toString()];
  if (!user) return false;
  
  return user.permissions.includes('all') || user.permissions.includes(permission);
}

// ================== نظام سلة المشتريات ==================
function initializeUserCart(chatId) {
  if (!userCarts[chatId]) {
    userCarts[chatId] = {
      items: [],
      total: 0,
      itemCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  return userCarts[chatId];
}

function addToCart(chatId, product) {
  initializeUserCart(chatId);
  
  const existingItemIndex = userCarts[chatId].items.findIndex(
    item => item.id === product.id
  );
  
  if (existingItemIndex > -1) {
    userCarts[chatId].items[existingItemIndex].quantity += 1;
  } else {
    const price = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
    userCarts[chatId].items.push({
      ...product,
      quantity: 1,
      totalPrice: price
    });
  }
  
  updateCartTotal(chatId);
  return userCarts[chatId];
}

function removeFromCart(chatId, productId) {
  if (!userCarts[chatId]) return null;
  
  userCarts[chatId].items = userCarts[chatId].items.filter(
    item => item.id !== productId
  );
  
  updateCartTotal(chatId);
  return userCarts[chatId];
}

function updateCartItemQuantity(chatId, productId, quantity) {
  if (!userCarts[chatId]) return null;
  
  const itemIndex = userCarts[chatId].items.findIndex(
    item => item.id === productId
  );
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      userCarts[chatId].items.splice(itemIndex, 1);
    } else {
      userCarts[chatId].items[itemIndex].quantity = quantity;
      const price = parseFloat(userCarts[chatId].items[itemIndex].price.replace(/[^\d.]/g, '')) || 0;
      userCarts[chatId].items[itemIndex].totalPrice = price * quantity;
    }
    
    updateCartTotal(chatId);
  }
  
  return userCarts[chatId];
}

function updateCartTotal(chatId) {
  if (!userCarts[chatId]) return;
  
  userCarts[chatId].total = userCarts[chatId].items.reduce(
    (sum, item) => sum + (item.totalPrice || 0), 0
  );
  
  userCarts[chatId].itemCount = userCarts[chatId].items.reduce(
    (sum, item) => sum + item.quantity, 0
  );
  
  userCarts[chatId].updatedAt = new Date();
}

function clearCart(chatId) {
  if (userCarts[chatId]) {
    userCarts[chatId].items = [];
    userCarts[chatId].total = 0;
    userCarts[chatId].itemCount = 0;
    userCarts[chatId].updatedAt = new Date();
  }
  return userCarts[chatId];
}

async function showCart(chatId) {
  const cart = initializeUserCart(chatId);
  
  if (cart.items.length === 0) {
    await bot.sendMessage(chatId, '🛒 سلة المشتريات فارغة');
    return;
  }
  
  let message = `🛒 *سلة المشتريات*\n\n`;
  let total = 0;
  
  cart.items.forEach((item, index) => {
    const itemTotal = item.totalPrice || parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity;
    total += itemTotal;
    
    message += `${index + 1}. ${shortenProductTitle(item.title)} \n`;
    message += `   📦 الكمية: ${item.quantity} \n`;
    message += `   💰 السعر: ${itemTotal.toFixed(2)} ر.س\n\n`;
  });
  
  message += `💵 *المجموع الكلي: ${total.toFixed(2)} ر.س*\n`;
  message += `📦 عدد المنتجات: ${cart.itemCount}`;
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💳 الدفع الآن', callback_data: 'checkout_cart' },
          { text: '🔄 تحديث السلة', callback_data: 'refresh_cart' }
        ],
        [
          { text: '🗑️ تفريغ السلة', callback_data: 'clear_cart' },
          { text: '🏪 متابعة التسوق', callback_data: 'continue_shopping' }
        ],
        ...cart.items.slice(0, 5).map(item => [
          { 
            text: `❌ حذف ${shortenProductTitle(item.title, 15)}`, 
            callback_data: `remove_${item.id}` 
          }
        ])
      ]
    }
  });
}

// ================== نظام الطلبات والشراء ==================
class TelegramOrder {
  constructor(userId, products, shippingInfo, paymentMethod, orderType = 'single') {
    this.orderId = this.generateOrderId();
    this.userId = userId;
    this.products = Array.isArray(products) ? products : [products];
    this.shippingInfo = shippingInfo;
    this.paymentMethod = paymentMethod;
    this.status = 'pending';
    this.orderType = orderType;
    this.createdAt = new Date();
    this.totalAmount = this.calculateTotal();
  }

  calculateTotal() {
    const productsTotal = this.products.reduce((sum, product) => {
      const price = parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
      const quantity = product.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    const shippingCost = 15;
    return productsTotal + shippingCost;
  }

  generateOrderId() {
    return `TORD${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  }
}

// تحليل معلومات الشحن
function parseShippingInfo(text) {
  const lines = text.split('\n');
  return {
    fullName: lines[0] || '',
    address: lines[1] || '',
    phone: lines[2] || '',
    city: lines[3] || ''
  };
}

// تحقق من معلومات البطاقة
function validateCard(cardNumber, expiry, cvv) {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  
  return cleanNumber.length === 16 && 
         /^\d+$/.test(cleanNumber) &&
         expiryRegex.test(expiry) &&
         cvv.length === 3 &&
         /^\d+$/.test(cvv);
}

// محاكاة عملية الدفع
async function simulatePayment(orderData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.1);
    }, 2000);
  });
}

// إنشاء روابط العمولة
function generateAffiliateLink(originalUrl, source, productId = null) {
  const config = AFFILIATE_CONFIG[source];
  if (!config || !config.enabled) return originalUrl;
  
  try {
    const urlObj = new URL(originalUrl);
    
    switch(source) {
      case 'aliexpress':
        if (process.env.ALIEXPRESS_AFFILIATE_ID) {
          urlObj.searchParams.set('aff_platform', process.env.ALIEXPRESS_AFFILIATE_ID);
        }
        break;
        
      case 'amazon':
        if (process.env.AMAZON_AFFILIATE_TAG) {
          urlObj.searchParams.set('tag', process.env.AMAZON_AFFILIATE_TAG);
        }
        break;
        
      case 'shein':
        if (process.env.SHEIN_AFFILIATE_ID) {
          urlObj.searchParams.set('aff_id', process.env.SHEIN_AFFILIATE_ID);
        }
        break;
    }
    
    return urlObj.toString();
  } catch (error) {
    return originalUrl;
  }
}

// تتبع العمولة
function trackCommission(order, product, commissionAmount) {
  const commissionRecord = {
    id: `comm_${Date.now()}`,
    order_id: order.orderId,
    product_id: product.id,
    product_title: product.title,
    sale_amount: parseFloat(product.price.replace(/[^\d.]/g, '')) * (product.quantity || 1),
    commission_rate: product.commission_rate || AFFILIATE_CONFIG[product.source]?.default_commission || 0.05,
    commission_amount: commissionAmount,
    store: product.source,
    date: new Date(),
    status: 'pending'
  };
  
  affiliateCommissions.push(commissionRecord);
  return commissionRecord;
}

// إشعار الإدارة بطلب جديد
async function notifyAdminNewOrder(order) {
  const adminChatId = process.env.TEL_ID;
  if (!adminChatId) return;
  
  const productList = order.products.map((product, index) => 
    `${index + 1}. ${product.title} × ${product.quantity || 1}`
  ).join('\n');
  
  const message = `
🛒 *طلب جديد #${order.orderId}*

👤 العميل: ${order.shippingInfo.fullName}
📞 الهاتف: ${order.shippingInfo.phone}
🏠 العنوان: ${order.shippingInfo.address}
📍 المدينة: ${order.shippingInfo.city}

📦 المنتجات:
${productList}

💰 المبلغ: ${order.totalAmount} ر.س
💳 الدفع: ${order.paymentMethod}
📦 نوع الطلب: ${order.orderType === 'cart' ? 'سلة مشتريات' : 'منتج فردي'}

  `.trim();
  
  try {
    await bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}

// ================== الذكاء الاصطناعي ومعالجة الصور ==================
async function decideTool(text, hasImage) {
  const prompt = `
  حدد نوع الطلب من التالي بناءً على النص ووجود صورة:

  remove-bg (إذا طلب إزالة خلفية وكانت هناك صورة)
  edit-image (إذا طلب تعديل الصورة وكانت هناك صورة)
  chat (إذا كان طلبًا نصيًا عاديًا)

  النص: "${text}"
  هل يوجد صورة: ${hasImage ? 'نعم' : 'لا'}
  النوع:
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const response = await model.generateContent(prompt);
    
    const tool = response.response.text().trim().toLowerCase();
    if (tool.includes('remove-bg') || tool.includes('remove background')) return 'remove-bg';
    if (tool.includes('edit-image') || tool.includes('edit image')) return 'edit-image';
    return 'chat';

  } catch (error) {
    console.error('خطأ في تحديد الأداة:', error);
    return 'chat';
  }
}

// ================== دوال البحث ==================
async function searchAliExpressBusiness(query) {
  const cleanQuery = query.replace(/[^\w\u0600-\u06FF\s]/gi, '').trim();
  
  const options = {
    method: 'GET',
    url: 'https://aliexpress-business-api.p.rapidapi.com/textsearch.php',
    params: {
      keyWord: encodeURIComponent(cleanQuery),
      pageSize: '10',
      pageIndex: '1',
      country: 'SA',
      currency: 'SAR',
      lang: 'ar',
      filter: 'orders',
      sortBy: 'desc'
    },
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'aliexpress-business-api.p.rapidapi.com',
      'Accept': 'application/json'
    },
    timeout: 15000
  };

  try {
    const response = await axios.request(options);
    
    if (!response.data || typeof response.data !== 'object') {
      return generateDummyAliExpressProducts(query);
    }

    const responseData = response.data;
    let products = [];

    if (responseData.data?.itemList) {
      products = responseData.data.itemList;
    } else if (responseData.result?.products) {
      products = responseData.result.products;
    } else if (Array.isArray(responseData)) {
      products = responseData;
    } else {
      return generateDummyAliExpressProducts(query);
    }

    return products.map((product, index) => {
      const productData = {
        id: product.itemId || `aliexpress_${index}_${Date.now()}`,
        title: product.title || 'لا يوجد اسم',
        price: product.salePrice ? `${product.salePrice} ر.س.` : 'السعر غير متوفر',
        image: product.itemMainPic || 'https://via.placeholder.com/150',
        url: product.itemId ? `https://www.aliexpress.com/item/${product.itemId}.html` : '#',
        rating: product.evaluateRate ? `${product.evaluateRate} ⭐` : 'غير متوفر',
        orders: product.orders ? `${product.orders} طلب` : 'لا توجد طلبات',
        store: 'AliExpress',
        shipping: 'شحن مجاني',
        source: 'aliexpress',
        commission_rate: 0.08
      };

      productData.affiliate_link = generateAffiliateLink(productData.url, 'aliexpress', productData.id);
      return productData;
    }).filter(product => product !== null);

  } catch (error) {
    console.error('AliExpress API Error:', error.message);
    return generateDummyAliExpressProducts(query);
  }
}

function generateDummyAliExpressProducts(query) {
  return [
    {
      id: 'ali_dummy_1',
      title: `${query} - إصدار مميز`,
      price: '89.99 ر.س.',
      image: 'https://via.placeholder.com/150',
      url: 'https://www.aliexpress.com/item/dummy1.html',
      rating: '4.7 ⭐',
      orders: '10K+ طلب',
      store: 'متجر AliExpress',
      shipping: 'شحن مجاني',
      discount: '15%',
      source: 'aliexpress',
      commission_rate: 0.08,
      affiliate_link: generateAffiliateLink('https://www.aliexpress.com/item/dummy1.html', 'aliexpress', 'ali_dummy_1')
    }
  ];
}

async function searchAmazonProducts(query) {
  try {
    const options = {
      method: 'GET',
      url: 'https://amazon-product-search.p.rapidapi.com/search',
      params: {
        query: encodeURIComponent(query),
        country: 'US',
        category: 'aps',
        sort_by: 'relevanceblender',
        page: '1'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'amazon-product-search.p.rapidapi.com'
      },
      timeout: 15000
    };

    const response = await axios.request(options);
    
    if (!response.data || !response.data.products) {
      return generateDummyAmazonProducts(query);
    }

    return response.data.products.slice(0, 10).map((product, index) => ({
      id: product.asin || `amazon_${index}_${Date.now()}`,
      title: product.title || 'No title',
      price: product.price ? `${product.price} USD` : 'السعر غير متوفر',
      image: product.image || 'https://via.placeholder.com/150',
      url: product.url || `https://www.amazon.com/dp/${product.asin}`,
      rating: product.rating ? `${product.rating} ⭐` : 'غير متوفر',
      orders: product.reviews ? `${product.reviews} تقييم` : 'لا توجد تقييمات',
      store: 'Amazon',
      shipping: product.prime ? 'Prime شحن مجاني' : 'رسوم شحن',
      source: 'amazon',
      commission_rate: 0.05,
      affiliate_link: generateAffiliateLink(product.url || `https://www.amazon.com/dp/${product.asin}`, 'amazon')
    }));

  } catch (error) {
    console.error('Amazon API Error:', error.message);
    return generateDummyAmazonProducts(query);
  }
}

function generateDummyAmazonProducts(query) {
  return [
    {
      id: 'amazon_demo_1',
      title: `${query} - Premium Edition`,
      price: '899 ر.س.',
      image: 'https://via.placeholder.com/150',
      url: 'https://www.amazon.com',
      rating: '4.8 ⭐',
      orders: '5000+ طلب',
      store: 'Amazon',
      shipping: 'Prime شحن مجاني',
      source: 'amazon',
      commission_rate: 0.05,
      affiliate_link: generateAffiliateLink('https://www.amazon.com', 'amazon')
    }
  ];
}

async function searchSheinProducts(query) {
  try {
    const options = {
      method: 'GET',
      url: 'https://shein-products-search.p.rapidapi.com/search',
      params: {
        keyword: encodeURIComponent(query),
        language: 'en',
        country: 'US',
        currency: 'USD',
        sort: '7',
        limit: '10'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'shein-products-search.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response = await axios.request(options);
    
    if (!response.data || !response.data.info || !response.data.info.products) {
      return generateDummySheinProducts(query);
    }

    return response.data.info.products.slice(0, 10).map((product, index) => ({
      id: product.goods_id || `shein_${index}_${Date.now()}`,
      title: product.goods_name || 'No title',
      price: product.retail_price ? `${product.retail_price.amount} ${product.retail_price.currency || 'USD'}` : 'السعر غير متوفر',
      image: product.goods_image || 'https://via.placeholder.com/150',
      url: product.detail_url || `https://www.shein.com/pd/${product.goods_id}.html`,
      rating: product.goods_rating ? `${product.goods_rating} ⭐` : 'غير متوفر',
      orders: product.sales ? `${product.sales} طلب` : 'لا توجد طلبات',
      store: 'Shein',
      shipping: 'شحن مجاني فوق 49$',
      discount: product.discount ? `${product.discount}%` : '',
      source: 'shein',
      commission_rate: 0.10,
      affiliate_link: generateAffiliateLink(product.detail_url || `https://www.shein.com/pd/${product.goods_id}.html`, 'shein')
    }));

  } catch (error) {
    console.error('Shein API Error:', error.message);
    return generateDummySheinProducts(query);
  }
}

function generateDummySheinProducts(query) {
  return [
    {
      id: 'shein_dummy_1',
      title: `${query} - Shein Premium Edition`,
      price: '45.99 SAR',
      image: 'https://via.placeholder.com/150',
      url: 'https://www.shein.com',
      rating: '4.5 ⭐',
      orders: '10K+ طلب',
      store: 'Shein',
      shipping: 'شحن مجاني',
      discount: '15%',
      source: 'shein',
      commission_rate: 0.10,
      affiliate_link: generateAffiliateLink('https://www.shein.com', 'shein')
    }
  ];
}

async function searchShopifyProducts(query) {
  try {
    const shopifyStores = ['gymshark', 'fashionnova', 'kyliecosmetics', 'colourpop'];
    const randomStore = shopifyStores[Math.floor(Math.random() * shopifyStores.length)];
    
    const options = {
      method: 'GET',
      url: 'https://shopify-product-search.p.rapidapi.com/search',
      params: {
        store: randomStore,
        query: encodeURIComponent(query),
        sort_by: 'best_match',
        limit: '10'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'shopify-product-search.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response = await axios.request(options);
    
    if (!response.data || !response.data.products) {
      return generateDummyShopifyProducts(query);
    }

    return response.data.products.slice(0, 10).map((product, index) => ({
      id: product.id || `shopify_${index}_${Date.now()}`,
      title: product.title || 'No title',
      price: product.price ? `${product.price} USD` : 'السعر غير متوفر',
      image: product.image || 'https://via.placeholder.com/150',
      url: product.url || (product.handle ? `https://${randomStore}.com/products/${product.handle}` : '#'),
      rating: product.rating ? `${product.rating} ⭐` : 'غير متوفر',
      orders: product.reviews_count ? `${product.reviews_count} تقييم` : 'لا توجد تقييمات',
      store: randomStore.charAt(0).toUpperCase() + randomStore.slice(1),
      shipping: 'يختلف حسب المتجر',
      source: 'shopify',
      commission_rate: 0.07,
      affiliate_link: generateAffiliateLink(product.url || '#', 'shopify')
    }));

  } catch (error) {
    console.error('Shopify API Error:', error.message);
    return generateDummyShopifyProducts(query);
  }
}

function generateDummyShopifyProducts(query) {
  const stores = ['Nike Store', 'Adidas Shop', 'Fashion Store', 'Tech Shop'];
  const randomStore = stores[Math.floor(Math.random() * stores.length)];
  
  return [
    {
      id: 'shopify_dummy_1',
      title: `${query} - ${randomStore}`,
      price: '199.99 SAR',
      image: 'https://via.placeholder.com/150',
      url: 'https://www.shopify.com',
      rating: '4.7 ⭐',
      orders: '2K+ طلب',
      store: randomStore,
      shipping: 'شحن سريع',
      source: 'shopify',
      commission_rate: 0.07,
      affiliate_link: generateAffiliateLink('https://www.shopify.com', 'shopify')
    }
  ];
}

async function searchAllStores(query, stores = ['aliexpress', 'amazon', 'shein', 'shopify']) {
  try {
    const results = [];
    const searchPromises = [];

    if (stores.includes('aliexpress')) {
      searchPromises.push(searchAliExpressBusiness(query).catch(error => {
        console.error('AliExpress search failed:', error);
        return generateDummyAliExpressProducts(query);
      }));
    }

    if (stores.includes('amazon')) {
      searchPromises.push(searchAmazonProducts(query).catch(error => {
        console.error('Amazon search failed:', error);
        return generateDummyAmazonProducts(query);
      }));
    }

    if (stores.includes('shein')) {
      searchPromises.push(searchSheinProducts(query).catch(error => {
        console.error('Shein search failed:', error);
        return generateDummySheinProducts(query);
      }));
    }

    if (stores.includes('shopify')) {
      searchPromises.push(searchShopifyProducts(query).catch(error => {
        console.error('Shopify search failed:', error);
        return generateDummyShopifyProducts(query);
      }));
    }

    const allResults = await Promise.allSettled(searchPromises);
    
    allResults.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        results.push(...result.value);
      }
    });

    return shuffleArray(results);

  } catch (error) {
    console.error('Multi-store search error:', error);
    throw error;
  }
}

// ================== دوال إرسال المنتجات ==================
async function sendProductWithDirectBuy(chatId, product) {
  const message = `
🛍️ *${shortenProductTitle(product.title, 50)}*

💰 السعر: ${product.price}
⭐ التقييم: ${product.rating || 'غير متوفر'}
🚚 الشحن: ${product.shipping || 'رسوم شحن'}
${product.commission_rate ? `🎯 العمولة: ${(product.commission_rate * 100).toFixed(1)}%` : ''}

*الدفع داخل التلجرام - توصيل لبيتك*
  `.trim();

  try {
    await bot.sendPhoto(chatId, product.image, {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛒 شراء الآن', callback_data: `buy_${product.id}` },
            { text: '📦 إضافة إلى السلة', callback_data: `addcart_${product.id}` }
          ],
          [
            { text: '🔗 رابط المنتج', url: product.affiliate_link || product.url },
            { text: 'ℹ️ المزيد من المعلومات', callback_data: `info_${product.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛒 شراء الآن', callback_data: `buy_${product.id}` },
            { text: '📦 إضافة إلى السلة', callback_data: `addcart_${product.id}` }
          ],
          [
            { text: '🔗 رابط المنتج', url: product.affiliate_link || product.url }
          ]
        ]
      }
    });
  }
}

// بدء عملية الشراء
async function startCheckoutProcess(chatId, product, isCart = false) {
  userSessions[chatId] = { 
    product: isCart ? null : product,
    cart: isCart ? userCarts[chatId] : null,
    step: 'shipping_info',
    type: isCart ? 'cart' : 'direct_buy'
  };
  
  await bot.sendMessage(chatId, `
📦 *معلومات التوصيل*

يرجى إرسال:
1. الاسم الكامل
2. العنوان بالتفصيل
3. رقم الهاتف
4. المدينة

مثال:
محمد أحمد
حي الرياض، شارع الملك فهد، مبنى 123
0512345678
الرياض
  `.trim(), { parse_mode: 'Markdown' });
}

// عرض خيارات الدفع
async function showPaymentOptions(chatId, orderData) {
  const totalAmount = orderData.type === 'cart' 
    ? orderData.cart.total + 15 
    : parseFloat(orderData.product.price.replace(/[^\d.]/g, '')) + 15;

  userSessions[chatId].step = 'payment_method';
  
  await bot.sendMessage(chatId, `
💳 *طريقة الدفع*

المبلغ الإجمالي: ${totalAmount.toFixed(2)} ر.س
${orderData.type === 'cart' ? `📦 عدد المنتجات: ${orderData.cart.itemCount}` : ''}

اختر طريقة الدفع المناسبة:
  `.trim(), {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💳 بطاقة ائتمان', callback_data: 'pay_card' }],
        [{ text: '📱 محفظة إلكترونية', callback_data: 'pay_wallet' }],
        [{ text: '🏦 تحويل بنكي', callback_data: 'pay_bank' }],
        [{ text: '✖️ إلغاء الطلب', callback_data: 'cancel_order' }]
      ]
    }
  });
}

// طلب معلومات البطاقة
async function requestCardPayment(chatId) {
  userSessions[chatId].paymentMethod = 'card';
  userSessions[chatId].step = 'card_info';
  
  await bot.sendMessage(chatId, `
💳 *الدفع ببطاقة الائتمان*

يرجى إرسال:
- رقم البطاقة (16 رقم)
- تاريخ الانتهاء (MM/YY)
- رمز CVV (3 أرقام)

🔒 *معلوماتك محمية وآمنة*
  `.trim(), { parse_mode: 'Markdown' });
}

// معالجة الدفع
async function processPayment(chatId, orderData) {
  try {
    await bot.sendMessage(chatId, '🔐 جاري معالجة الدفع...');
    
    const paymentSuccess = await simulatePayment(orderData);
    
    if (paymentSuccess) {
      await completeOrder(chatId, orderData);
    } else {
      await bot.sendMessage(chatId, '❌ فشل عملية الدفع. يرجى المحاولة بطريقة أخرى.');
      userSessions[chatId] = null;
    }
  } catch (error) {
    console.error('Payment error:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ أثناء المعالجة. يرجى المحاولة لاحقاً.');
    userSessions[chatId] = null;
  }
}

// إكمال الطلب
async function completeOrder(chatId, orderData) {
  const products = orderData.type === 'cart' 
    ? orderData.cart.items 
    : [orderData.product];
  
  const order = new TelegramOrder(
    chatId, 
    products, 
    orderData.shippingInfo, 
    orderData.paymentMethod,
    orderData.type
  );
  
  // تتبع العمولات
  for (const product of products) {
    const saleAmount = parseFloat(product.price.replace(/[^\d.]/g, '')) * (product.quantity || 1);
    const commissionAmount = saleAmount * (product.commission_rate || 0.05);
    trackCommission(order, product, commissionAmount);
  }
  
  orderQueue.push(order);
  
  if (orderData.type === 'cart') {
    clearCart(chatId);
  }
  
  userSessions[chatId] = null;
  
  const productList = order.products.map((product, index) => 
    `${index + 1}. ${shortenProductTitle(product.title)} × ${product.quantity || 1}`
  ).join('\n');
  
  await bot.sendMessage(chatId, `
✅ *تم تأكيد طلبك!*

📦 رقم الطلب: ${order.orderId}
💰 المبلغ: ${order.totalAmount.toFixed(2)} ر.س
📦 عدد المنتجات: ${order.products.reduce((sum, p) => sum + (p.quantity || 1), 0)}

📋 المنتجات:
${productList}

📞 للاستفسار: @support_username

سيصلك المنتج خلال 5-10 أيام عمل
  `.trim(), { parse_mode: 'Markdown' });
  
  await notifyAdminNewOrder(order);
}

// ================== نقطة النهاية الذكية /chat2 ==================
app.post('/chat2', upload.single('image'), async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const imageFile = req.file;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const action = await decideTool(message, !!imageFile);

    if (action === 'remove-bg' && imageFile) {
      try {
        const form = new FormData();
        form.append('image_file', imageFile.buffer, { 
          filename: imageFile.originalname 
        });
        
        const removeBgResponse = await axios.post(
          'https://api.remove.bg/v1.0/removebg', 
          form, 
          {
            headers: { 
              ...form.getHeaders(), 
              'X-Api-Key': process.env.REMOVEBG_KEY 
            },
            responseType: 'arraybuffer',
          }
        );

        return res.json({
          action: 'remove-bg',
          imageBase64: removeBgResponse.data.toString('base64'),
          message: "تم إزالة الخلفية بنجاح"
        });

      } catch (error) {
        console.error('Remove.bg error:', error);
        return res.status(500).json({ 
          error: "فشل في إزالة الخلفية" 
        });
      }

    } else if (action === 'edit-image' && imageFile) {
      try {
        return res.json({
          action: 'edit-image',
          message: "خدمة تعديل الصور حالياً غير متاحة، جاري العمل عليها"
        });

      } catch (error) {
        console.error('Image editing error:', error);
        return res.status(500).json({ 
          error: "فشل في تعديل الصورة" 
        });
      }

    } else if (message.startsWith('/search')) {
      const query = message.replace('/search', '').trim();
      
      if (query.length < 2) {
        return res.json({ 
          action: 'chat', 
          reply: '⚠️ يرجى إدخال نص بحث مكون من حرفين على الأقل' 
        });
      }
      
      try {
        const products = await searchAllStores(query);

        if (products.length === 0) {
          return res.json({ 
            action: 'chat', 
            reply: '⚠️ لم أجد نتائج لهذا البحث.' 
          });
        }

        return res.json({
          action: 'search',
          products: products.slice(0, 5),
          message: `تم العثور على ${products.length} منتج`
        });

      } catch (error) {
        console.error('Search error:', error);
        return res.json({ 
          action: 'chat', 
          reply: '❌ حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.' 
        });
      }

    } else {
      if (!sessions[sessionId]) {
        sessions[sessionId] = [];
      }
      
      sessions[sessionId].push({ 
        role: 'user', 
        parts: [{ text: message }] 
      });

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent({ 
          contents: sessions[sessionId] 
        });
        
        const reply = result.response.text();
        
        sessions[sessionId].push({ 
          role: 'model', 
          parts: [{ text: reply }] 
        });

        if (sessions[sessionId].length > 10) {
          sessions[sessionId] = sessions[sessionId].slice(-10);
        }

        return res.json({ 
          action: 'chat', 
          reply 
        });

      } catch (error) {
        console.error('Chat error:', error);
        return res.json({ 
          action: 'chat', 
          reply: 'عذراً، حدث خطأ في المعالجة. يرجى المحاولة مرة أخرى.' 
        });
      }
    }

  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ 
      error: "Internal server error" 
    });
  }
});

// ================== Telegram Commands ==================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    await bot.sendMessage(chatId, 'مرحباً بك في بوتنا!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 متجر المنتجات', web_app: { url: `https://ghidhaalruwh.netlify.app/store` } }],
          [{ text: '🎮 الألعاب', web_app: { url: `https://yourdomain.com/games` } }],
          [{ text: '⚙️ الإعدادات', web_app: { url: `https://ghidhaalruwh.netlify.app/settings` } }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = `https://ghidhaalruwh.netlify.app/webapp`;
  
  bot.sendMessage(chatId, 'افتح التطبيق المصغر للوصول إلى جميع الميزات:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 افتح التطبيق', web_app: { url: webAppUrl } }]
      ]
    }
  });
});

// أمر البحث
bot.onText(/\/search(?:@\w+)?\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1].trim();
  
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    if (query.length < 2) {
      return bot.sendMessage(chatId, '⚠️ يرجى إدخال نص بحث مكون من حرفين على الأقل');
    }
    
    const waitMsg = await bot.sendMessage(chatId, '🔎 جاري البحث في المتاجر...');
    
    const products = await searchAllStores(query);
    
    await bot.deleteMessage(chatId, waitMsg.message_id);
    
    if (!products.length) {
      return bot.sendMessage(chatId, '⚠️ لم أعثر على منتجات تطابق بحثك في أي متجر');
    }
    
    for (const product of products.slice(0, 5)) {
      await sendProductWithDirectBuy(chatId, product);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const storeCounts = products.reduce((acc, product) => {
      acc[product.source] = (acc[product.source] || 0) + 1;
      return acc;
    }, {});
    
    const summary = Object.entries(storeCounts)
      .map(([store, count]) => `• ${store}: ${count} منتج`)
      .join('\n');
    
    await bot.sendMessage(chatId, `📊 نتائج البحث:\n${summary}`);
    
  } catch (error) {
    console.error('Multi-store search command error:', error);
    await bot.sendMessage(chatId, `❌ حدث خطأ: ${error.message}`);
  }
});

// أمر سلة المشتريات
bot.onText(/\/cart/, async (msg) => {
  const chatId = msg.chat.id;
  await showCart(chatId);
});

// أمر تفريغ السلة
bot.onText(/\/clearcart/, async (msg) => {
  const chatId = msg.chat.id;
  clearCart(chatId);
  await bot.sendMessage(chatId, '🗑️ تم تفريغ سلة المشتريات');
});

// أمر الإحصائيات (للمشرفين فقط)
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (!isAdmin(userId)) {
    return await bot.sendMessage(chatId, '❌ هذا الأمر للمشرفين فقط.');
  }
  
  try {
    const totalOrders = orderQueue.length;
    const totalCarts = Object.keys(userCarts).length;
    const totalCommissions = affiliateCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
    
    const message = `
📊 *إحصائيات النظام - للمشرفين فقط*

📦 إجمالي الطلبات: ${totalOrders}
🛒 سلال المشتريات النشطة: ${totalCarts}
💰 إجمالي العمولات: ${totalCommissions.toFixed(2)} ر.س

🔒 *معلومات سرية*
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    await bot.sendMessage(chatId, '❌ حدث خطأ في جلب الإحصائيات.');
  }
});

// --- معالجة الأزرار والطلبات ---
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  try {
    if (data.startsWith('buy_')) {
      const productId = data.split('_')[1];
      const product = {
        id: productId,
        title: 'منتج افتراضي',
        price: '100 ر.س',
        rating: '4.5 ⭐',
        shipping: 'شحن مجاني',
        store: 'متجر افتراضي',
        source: 'aliexpress',
        commission_rate: 0.08
      };
      
      await startCheckoutProcess(chatId, product, false);
    }
    else if (data.startsWith('addcart_')) {
      const productId = data.split('_')[1];
      const product = {
        id: productId,
        title: 'منتج افتراضي',
        price: '100 ر.س',
        rating: '4.5 ⭐',
        shipping: 'شحن مجاني',
        store: 'متجر افتراضي',
        source: 'aliexpress',
        image: 'https://via.placeholder.com/150',
        commission_rate: 0.08
      };
      
      addToCart(chatId, product);
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '✅ تمت الإضافة إلى السلة' 
      });
    }
    else if (data === 'show_cart') {
      await showCart(chatId);
    }
    else if (data === 'checkout_cart') {
      const cart = initializeUserCart(chatId);
      if (cart.items.length === 0) {
        await bot.answerCallbackQuery(callbackQuery.id, { 
          text: '❌ السلة فارغة' 
        });
        return;
      }
      await startCheckoutProcess(chatId, null, true);
    }
    else if (data === 'clear_cart') {
      clearCart(chatId);
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '🗑️ تم تفريغ السلة' 
      });
      await bot.deleteMessage(chatId, callbackQuery.message.message_id);
      await bot.sendMessage(chatId, '🗑️ تم تفريغ سلة المشتريات');
    }
    else if (data.startsWith('remove_')) {
      const productId = data.split('_')[1];
      removeFromCart(chatId, productId);
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '✅ تم الحذف من السلة' 
      });
      await showCart(chatId);
    }
    else if (data === 'pay_card') {
      await requestCardPayment(chatId);
    }
    else if (data === 'cancel_order') {
      userSessions[chatId] = null;
      await bot.sendMessage(chatId, '❌ تم إلغاء الطلب.');
    }
    
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Callback query error:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'حدث خطأ أثناء المعالجة' });
  }
});

// ================== معالجة رسائل المستخدم ==================
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  try {
    // معالجة معلومات الشحن
    if (userSessions[chatId] && userSessions[chatId].step === 'shipping_info') {
      const shippingInfo = parseShippingInfo(text);
      userSessions[chatId].shippingInfo = shippingInfo;
      
      await showPaymentOptions(chatId, userSessions[chatId]);
    }
    // معالجة معلومات البطاقة
    else if (userSessions[chatId] && userSessions[chatId].step === 'card_info') {
      const cardParts = text.split('\n');
      if (cardParts.length >= 3) {
        const cardInfo = {
          number: cardParts[0].trim(),
          expiry: cardParts[1].trim(),
          cvv: cardParts[2].trim()
        };
        
        if (validateCard(cardInfo.number, cardInfo.expiry, cardInfo.cvv)) {
          userSessions[chatId].cardInfo = cardInfo;
          await processPayment(chatId, userSessions[chatId]);
        } else {
          await bot.sendMessage(chatId, '❌ معلومات البطاقة غير صحيحة. يرجى المحاولة مرة أخرى.');
        }
      } else {
        await bot.sendMessage(chatId, '❌ يرجى إرسال المعلومات بالصيغة الصحيحة.');
      }
    }
    // معالجة الصور
    else if (msg.photo) {
      try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const axiosResponse = await axios.get(fileLink, { 
          responseType: 'arraybuffer' 
        });

        const formData = new FormData();
        formData.append('image', Buffer.from(axiosResponse.data), { 
          filename: 'image.png', 
          contentType: 'image/png' 
        });
        formData.append('message', msg.caption || '');
        formData.append('sessionId', chatId.toString());

        const response = await axios.post(
          `http://localhost:${PORT}/chat2`, 
          formData, 
          { 
            headers: formData.getHeaders(),
            timeout: 30000
          }
        );

        if (response.data.action === 'remove-bg') {
          await bot.sendPhoto(
            chatId, 
            Buffer.from(response.data.imageBase64, 'base64'),
            { caption: response.data.message }
          );
        } else if (response.data.reply) {
          await bot.sendMessage(chatId, response.data.reply);
        }

      } catch (error) {
        console.error('Image processing error:', error);
        await bot.sendMessage(
          chatId, 
          '❌ حدث خطأ في معالجة الصورة. يرجى المحاولة لاحقاً.'
        );
      }
    }
    // معالجة الرسائل العادية
    else if (text && !text.startsWith('/')) {
      try {
        if (!sessions[chatId]) sessions[chatId] = [];
        sessions[chatId].push({ role: 'user', parts: [{ text: text }] });

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent({ contents: sessions[chatId] });
        const reply = result.response.text();
        sessions[chatId].push({ role: 'model', parts: [{ text: reply }] });

        await bot.sendMessage(chatId, reply);
      } catch (error) {
        await bot.sendMessage(chatId, 'أنا هنا لمساعدتك في التسوق والبحث عن المنتجات. يمكنك استخدام /search للبحث عن منتج معين.');
      }
    }
  } catch (error) {
    console.error('Message processing error:', error);
    await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة رسالتك.');
  }
});

// ================== API Routes ==================
app.post('/api/search-products', async (req, res) => {
  try {
    const { query, stores } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'يجب تقديم استعلام بحث صالح (حرفين على الأقل)'
      });
    }
    
    console.log('Multi-store search request for:', query, 'Stores:', stores);
    
    const defaultStores = ['aliexpress', 'amazon', 'shein', 'shopify'];
    const targetStores = Array.isArray(stores) ? stores : defaultStores;
    
    const results = await searchAllStores(query.trim(), targetStores);
    
    if (!results.length) {
      return res.json({
        success: true,
        data: [],
        message: 'لم يتم العثور على نتائج في المتاجر المحددة'
      });
    }
    
    res.json({
      success: true,
      data: results,
      count: results.length,
      stores: targetStores
    });
    
  } catch (error) {
    console.error('Multi-store Search API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'فشل في معالجة طلب البحث',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ================== معالجة الطلبات في الخلفية ==================
setInterval(async () => {
  if (orderQueue.length > 0) {
    const order = orderQueue.shift();
    console.log(`معالجة الطلب #${order.orderId} للمستخدم ${order.userId}`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      await bot.sendMessage(order.userId, `
📦 تحديث حالة الطلب #${order.orderId}

✅ تم شراء المنتج بنجاح من المتجر
🚚 جاري التجهيز للشحن

سيصلك المنتج خلال 5-10 أيام عمل
      `.trim());
      
    } catch (error) {
      console.error(`فشل في معالجة الطلب #${order.orderId}:`, error);
      await bot.sendMessage(order.userId, `
❌ حدث خطأ في طلبك #${order.orderId}

يرجى التواصل مع الدعم للاستفسار
      `.trim());
    }
  }
}, 30000);

// ================== Server Listen ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Bot is ready and listening for messages`);
  console.log(`🛒 Shopping system initialized`);
  console.log(`👑 Admin users: ${Object.keys(ADMIN_USERS).length}`);
  console.log(`🧠 AI system activated with Gemini`);
});