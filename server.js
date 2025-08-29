

  const express = require('express');
  const axios = require('axios');
  const TelegramBot = require('node-telegram-bot-api');
  const cors = require('cors');
  const mongoose = require('mongoose');
  const fs = require('fs');
  require('dotenv').config();

  const path = require('path');
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const app = express();
  const PORT = process.env.PORT || 3000;

  // middleware
  app.use(cors());
  app.use(express.json());

  // ========== إعدادات قاعدة البيانات ==========
  let dbConnected = false;
  let User, Commission, Order;

  // إنشاء مجلد للتخزين المحلي إذا لم يكن موجوداً
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // دالة لتحميل البيانات من الملفات المحلية
  function loadLocalData(filename) {
    try {
      const filePath = path.join(dataDir, filename);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return {};
    }
  }

  // دالة لحفظ البيانات في الملفات المحلية
  function saveLocalData(filename, data) {
    try {
      const filePath = path.join(dataDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
      return false;
    }
  }

  // تخزين محلي للبيانات
  const localUsers = loadLocalData('users.json');
  const localCommissions = loadLocalData('commissions.json');
  const localOrders = loadLocalData('orders.json');
  // ========== إعدادات العرض ==========
  const DISPLAY_OPTIONS = {
    MIXED: 'mixed',
    BY_PRICE: 'by_price',
    BY_RATING: 'by_rating',
    BY_ORDERS: 'by_orders',
    BY_STORE: 'by_store'
  };

  let currentDisplayOption = DISPLAY_OPTIONS.MIXED;

  // ========== الدوال المساعدة ==========
  async function translateToEnglish(text) {
    console.log("ترجمة النص:", text);
    return text;
  }

  // ========== دوال الترتيب ==========
  function sortProducts(products, option) {
    const sorted = [...products];
    
    switch (option) {
      case DISPLAY_OPTIONS.BY_PRICE:
        return sorted.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
          return priceA - priceB;
        });

      case DISPLAY_OPTIONS.BY_RATING:
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(a.rating) || 0;
          const ratingB = parseFloat(b.rating) || 0;
          return ratingB - ratingA;
        });

      case DISPLAY_OPTIONS.BY_ORDERS:
        return sorted.sort((a, b) => {
          const ordersA = parseFloat(a.orders.replace(/[^\d.]/g, '')) || 0;
          const ordersB = parseFloat(b.orders.replace(/[^\d.]/g, '')) || 0;
          return ordersB - ordersA;
        });

      case DISPLAY_OPTIONS.BY_STORE:
        return sorted.sort((a, b) => {
          if (a.store === 'Amazon' && b.store !== 'Amazon') return -1;
          if (a.store !== 'Amazon' && b.store === 'Amazon') return 1;
          return 0;
        });

      case DISPLAY_OPTIONS.MIXED:
      default:
        return sorted.sort(() => Math.random() - 0.5);
    }
  }

  // ========== AMAZON FUNCTIONS ==========
  function generateAmazonAffiliateLink(productUrl, affiliateTag) {
    try {
      const url = new URL(productUrl);
      url.searchParams.set('tag', affiliateTag);
      url.searchParams.set('linkCode', 'as2');
      
      const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch && asinMatch[1]) {
        url.searchParams.set('creativeASIN', asinMatch[1]);
      }
      
      return url.toString();
    } catch (error) {
      console.error('Error generating Amazon affiliate link:', error);
      return productUrl;
    }
  }

  async function searchAmazonProducts(query) {
    if (!query || query.trim().length === 0) {
      console.error('استعلام البحث فارغ');
      return [];
    }

    const cleanQuery = query.replace(/[^\w\u0600-\u06FF\s]/gi, '').trim();
    let translatedQuery = cleanQuery;
    
    try {
      if (/^[\u0600-\u06FF]/.test(cleanQuery)) {
        translatedQuery = await translateToEnglish(cleanQuery);
      }
    } catch (translationError) {
      console.error('خطأ في الترجمة:', translationError.message);
      translatedQuery = cleanQuery;
    }

    const options = {
      method: 'GET',
      url: 'https://real-time-amazon-data.p.rapidapi.com/search',
      params: {
        query: translatedQuery,
        page: '1',
        country: 'US',
        sort_by: 'RELEVANCE',
        product_condition: 'ALL'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
      },
      timeout: 10000
    };

    try {
      const response = await axios.request(options);
      const products = response.data?.data?.products || [];

      const validProducts = products
        .map((product, index) => {
          const priceValue = parseFloat(product.product_price?.replace('$', '') || '0');
          
          const productData = {
            id: product.asin || `amazon_${index}_${Date.now()}`,
            title: product.product_title || 'No title',
            price: product.product_price ? `${product.product_price} USD` : 'السعر غير متوفر',
            priceValue: priceValue,
            image: product.product_photo || '',
            url: product.product_url || `https://www.amazon.com/dp/${product.asin}`,
            rating: product.product_star_rating || '',
            orders: product.is_best_seller ? 'الأكثر مبيعاً' : '',
            store: 'Amazon',
            shipping: product.is_prime ? 'Prime شحن مجاني' : 'رسوم شحن',
            source: 'amazon',
            commission_rate: 0.05,
            original_price: product.product_original_price || '',
            discount: product.product_discount || ''
          };

          let affiliateLink = productData.url;
          if (process.env.AMAZON_AFFILIATE_TAG) {
            affiliateLink = generateAmazonAffiliateLink(productData.url, process.env.AMAZON_AFFILIATE_TAG);
          }

          const isValid = productData.title !== 'No title' && productData.price !== 'السعر غير متوفر';
          return isValid ? { ...productData, affiliate_link: affiliateLink } : null;
        })
        .filter(Boolean);

      return validProducts;

    } catch (error) {
      console.error('Amazon API Error:', error.message);
      return [];
    }
  }

  // ========== ALIEXPRESS FUNCTIONS ==========
  function generateAliExpressAffiliateLink(productUrl, affiliateId) {
    try {
      let url = productUrl;
      
      if (!url.includes('aliexpress.com/item/')) {
        const itemIdMatch = url.match(/(\d+)\.html/);
        if (itemIdMatch && itemIdMatch[1]) {
          url = `https://www.aliexpress.com/item/${itemIdMatch[1]}.html`;
        }
      }
      
      return `https://www.aliexpress.com/item/${getItemIdFromUrl(url)}.html?aff_platform=${affiliateId}`;
      
    } catch (error) {
      console.error('Error generating AliExpress affiliate link:', error);
      return productUrl;
    }
  }

  function getItemIdFromUrl(url) {
    try {
      const patterns = [
        /aliexpress\.com\/item\/(\d+)\.html/,
        /\/item\/(\d+)\.html/,
        /(\d+)\.html$/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return url.split('/').pop().replace('.html', '');
    } catch (error) {
      return '100000000';
    }
  }

  async function searchAliExpressProducts(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.replace(/[^\w\u0600-\u06FF\s]/gi, '').trim();
    let translatedQuery = cleanQuery;
    
    try {
      if (/^[\u0600-\u06FF]/.test(cleanQuery)) {
        translatedQuery = await translateToEnglish(cleanQuery);
      }
    } catch (translationError) {
      translatedQuery = cleanQuery;
    }

    const options = {
      method: 'GET',
      url: 'https://aliexpress-business-api.p.rapidapi.com/textsearch.php',
      params: {
        keyWord: translatedQuery,
        pageSize: '10',
        pageIndex: '1',
        country: 'US',
        currency: 'USD',
        lang: 'en',
        filter: 'orders',
        sortBy: 'desc'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'aliexpress-business-api.p.rapidapi.com'
      },
      timeout: 10000
    };

    try {
      const response = await axios.request(options);
      console.log('AliExpress API Response received successfully');
      
      const products = response.data?.data?.itemList || [];
      console.log(`Raw AliExpress products count: ${products.length}`);
      
      const validProducts = products
        .map((product) => {
          try {
            let price = product.salePriceFormat || `$${product.targetSalePrice}`;
            let priceValue = parseFloat(product.targetSalePrice || '0');
            let originalPrice = product.targetOriginalPrice ? `$${product.targetOriginalPrice}` : '';
            
            if (product.originMinPrice && typeof product.originMinPrice === 'string') {
              try {
                const priceData = JSON.parse(product.originMinPrice);
                price = priceData.formatPrice || price;
                priceValue = parseFloat(priceData.minPrice || '0');
              } catch (e) {
                console.log('Cannot parse originMinPrice, using fallback');
              }
            }
            
            let rating = '';
            if (product.evaluateRate) {
              const ratingPercent = parseFloat(product.evaluateRate);
              rating = (ratingPercent / 20).toFixed(1);
            } else if (product.score) {
              rating = product.score;
            }
            
            const productData = {
              id: product.itemId || `aliexpress_${Date.now()}`,
              title: product.title || 'No title',
              price: price,
              priceValue: priceValue,
              image: product.itemMainPic || '',
              url: `https://www.aliexpress.com/item/${product.itemId}.html`,
              rating: rating,
              orders: product.orders || '0',
              store: 'AliExpress',
              shipping: 'شحن مجاني',
              source: 'aliexpress',
              commission_rate: 0.08,
              original_price: originalPrice,
              discount: product.discount || ''
            };

            let affiliateLink = productData.url;
            if (process.env.ALIEXPRESS_AFFILIATE_ID) {
              affiliateLink = generateAliExpressAffiliateLink(productData.url, process.env.ALIEXPRESS_AFFILIATE_ID);
            }

            const isValid = productData.title !== 'No title' && productData.price !== '$0';
            return isValid ? { ...productData, affiliate_link: affiliateLink } : null;
          } catch (productError) {
            console.error('Error processing AliExpress product:', productError);
            return null;
          }
        })
        .filter(Boolean);

      console.log(`Found ${validProducts.length} valid AliExpress products`);
      return validProducts;

    } catch (error) {
      console.error('AliExpress API Error:', error.response?.data || error.message);
      return [];
    }
  }

  // ========== دوال إدارة سلة المشتريات (مع دعم التخزين المحلي) ==========
  async function addToCart(telegramId, product) {
    try {
      if (dbConnected) {
        let user = await User.findOne({ telegramId });
        
        if (!user) {
          user = new User({ 
            telegramId, 
            cart: [] 
          });
        }
        
        const existingItemIndex = user.cart.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex > -1) {
          user.cart[existingItemIndex].quantity += 1;
        } else {
          user.cart.push({
            productId: product.id,
            title: product.title,
            price: product.priceValue || parseFloat(product.price.replace(/[^\d.]/g, '')),
            currency: 'USD',
            image: product.image,
            url: product.url,
            affiliateLink: product.affiliate_link || product.url,
            store: product.store,
            quantity: 1
          });
        }
        
        await user.save();
        return true;
      } else {
        // استخدام التخزين المحلي
        if (!localUsers[telegramId]) {
          localUsers[telegramId] = {
            telegramId,
            cart: [],
            orders: [],
            affiliateEarnings: 0,
            createdAt: new Date()
          };
        }
        
        const user = localUsers[telegramId];
        const existingItemIndex = user.cart.findIndex(item => item.productId === product.id);
        
        if (existingItemIndex > -1) {
          user.cart[existingItemIndex].quantity += 1;
        } else {
          user.cart.push({
            productId: product.id,
            title: product.title,
            price: product.priceValue || parseFloat(product.price.replace(/[^\d.]/g, '')),
            currency: 'USD',
            image: product.image,
            url: product.url,
            affiliateLink: product.affiliate_link || product.url,
            store: product.store,
            quantity: 1,
            addedAt: new Date()
          });
        }
        
        saveLocalData('users.json', localUsers);
        return true;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  async function getCart(telegramId) {
    try {
      if (dbConnected) {
        const user = await User.findOne({ telegramId });
        return user ? user.cart : [];
      } else {
        return localUsers[telegramId]?.cart || [];
      }
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  }

  async function clearCart(telegramId) {
    try {
      if (dbConnected) {
        const user = await User.findOne({ telegramId });
        
        if (user) {
          user.cart = [];
          await user.save();
          return true;
        }
        
        return false;
      } else {
        if (localUsers[telegramId]) {
          localUsers[telegramId].cart = [];
          saveLocalData('users.json', localUsers);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

// أضف هذه الدالة بعد تعريف stripe
async function verifyStripeConnection() {
  try {
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe connection verified successfully');
    console.log('💰 Available balance:', balance.available[0].amount, balance.available[0].currency);
    return true;
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
    return false;
  }
}
 // ========== دوال الدفع مع Stripe Checkout ==========
// بدلاً من البيانات الثابتة:
async function createStripeCheckoutSession(amount, currency = 'usd', metadata = {}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency,
        product_data: {
          name: 'Order Payment',
          description: `Order #${metadata.orderId}`
        },
        unit_amount: Math.round(amount * 100), // تحويل إلى سنتات
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.WEBAPP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.WEBAPP_URL}/cancel`,
    metadata: metadata
  });
  return { success: true, url: session.url };
}

async function retrieveStripeCheckoutSession(sessionId) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: true,
      session: session,
      status: session.payment_status
    };
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function confirmOrderPayment(orderId, sessionId, telegramId) {
  try {
    if (dbConnected) {
      const order = await Order.findOne({ orderId });

      if (!order) {
        console.error('❌ لم يتم العثور على الطلب في MongoDB:', orderId);
        return;
      }

      const sessionResult = await retrieveStripeCheckoutSession(sessionId);
      if (!sessionResult.success) {
        throw new Error(`فشل استرجاع جلسة الدفع: ${sessionResult.error}`);
      }

      if (sessionResult.status === 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
        order.updatedAt = new Date();
        await order.save();

        // حذف السلة من MongoDB
        await Cart.deleteOne({ userId: order.userId });

        // إرسال إشعار Telegram
        if (telegramId || order.telegramId) {
          const message = `✅ تم تأكيد الدفع!\n\n🆔 رقم الطلب: ${order.orderId}\n💰 المبلغ: ${order.totalAmount.toFixed(2)} USD\n📦 الحالة: جاري التجهيز\n\nشكراً لك على الشراء!`;
          await bot.sendMessage(telegramId || order.telegramId, message);
        }

        console.log(`✅ تم تأكيد الدفع للطلب ${order.orderId} وتفريغ السلة`);
        return { success: true, order };
      } else {
        console.warn(`⚠️ حالة الدفع غير مكتملة: ${sessionResult.status}`);
        return { success: false, message: `Payment status: ${sessionResult.status}` };
      }

    } else {
      // التخزين المحلي (اختياري)
      const order = orders.find(o => o.sessionId === sessionId);
      if (!order) {
        console.error('❌ لم يتم العثور على الطلب في التخزين المحلي:', sessionId);
        return;
      }

      order.paymentStatus = 'paid';
      order.status = 'processing';
      saveOrders();

      if (carts[order.userId]) {
        delete carts[order.userId];
        saveCarts();
      }

      if (telegramId || order.telegramId) {
        const message = `✅ تم تأكيد الدفع!\n\n🆔 رقم الطلب: ${order.orderId}\n💰 المبلغ: ${order.totalAmount.toFixed(2)} USD\n📦 الحالة: جاري التجهيز\n\nشكراً لك على الشراء!`;
        await bot.sendMessage(telegramId || order.telegramId, message);
      }

      console.log(`✅ تم تأكيد الدفع للطلب ${order.orderId} وتفريغ السلة`);
      return { success: true, order };
    }
  } catch (error) {
    console.error('❌ خطأ أثناء تأكيد الدفع:', error.message);
    throw error;
  }
}

  // ========== دوال إدارة الطلبات الحقيقية ==========
async function processRealOrder(telegramId, cartItems, shippingAddress, paymentMethod) {
  try {
    // حساب المبلغ الإجمالي
    let totalAmount = 0;
    const orderProducts = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        title: item.title,
        price: item.price,
        currency: item.currency || 'USD',
        quantity: item.quantity,
        affiliateLink: item.affiliateLink,
        store: item.store
      };
    });

    // إنشاء رقم طلب فريد
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ✅ إنشاء جلسة checkout مع Stripe
    const checkoutResult = await createStripeCheckoutSession(totalAmount, 'usd', {
      orderId: orderId,
      telegramId: telegramId.toString()
    });

    if (!checkoutResult.success) {
      throw new Error(`Checkout failed: ${checkoutResult.error}`);
    }

    // ✅ هنا لا نحفظ الطلب في DB، فقط نرجع بياناته
    return {
      success: true,
      order: {
        orderId,
        telegramId,
        products: orderProducts,
        totalAmount,
        currency: 'USD',
        status: 'pending',
        shippingAddress,
        paymentMethod,
        paymentStatus: 'pending',
        paymentId: checkoutResult.sessionId,
        createdAt: new Date(),
      },
      checkout: checkoutResult
    };

  } catch (error) {
    console.error('Error processing real order:', error);
    return { success: false, error: error.message };
  }
}
  async function getUserOrders(telegramId) {
    try {
      if (dbConnected) {
        const user = await User.findOne({ telegramId }).populate('orders');
        return user ? user.orders : [];
      } else {
        return Object.values(localOrders).filter(order => order.telegramId === telegramId);
      }
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  }

  async function getCommissions(telegramId) {
    try {
      if (dbConnected) {
        const commissions = await Commission.find({ telegramId }).sort({ createdAt: -1 });
        return commissions;
      } else {
        return Object.values(localCommissions).filter(com => com.telegramId === telegramId);
      }
    } catch (error) {
      console.error('Error getting commissions:', error);
      return [];
    }
  }

  async function getTotalEarnings(telegramId) {
    try {
      if (dbConnected) {
        const user = await User.findOne({ telegramId });
        return user ? user.affiliateEarnings : 0;
      } else {
        return localUsers[telegramId]?.affiliateEarnings || 0;
      }
    } catch (error) {
      console.error('Error getting total earnings:', error);
      return 0;
    }
  }


  const ordersPath = './data/orders.json';
  function saveOrders() {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

let orders = [];

  function createTestOrder(userId, source = 'amazon') {
  const testProduct = {
    id: `test-${Date.now()}`,
    title: `منتج تجريبي من ${source}`,
    price: 10,
    source,
    shippingStatus: 'pending',
    trackingUrl: null
  };

  const order = {
    id: `order-${Date.now()}`,
    userId,
    products: [testProduct],
    totalAmount: 10,
    paymentStatus: 'paid',
    createdAt: new Date()
  };

  orders.push(order);
  saveOrders();

  return order;
}


function simulateShipping(orderId, productId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return { success: false, message: '❌ الطلب غير موجود' };

  const product = order.products.find(p => p.id === productId);
  if (!product) return { success: false, message: '❌ المنتج غير موجود في هذا الطلب' };

  const trackingUrl = product.source === 'amazon'
    ? `https://track.amazon.com/${productId}`
    : `https://global.cainiao.com/${productId}`;

  product.shippingStatus = 'shipped';
  product.trackingUrl = trackingUrl;
  product.shippedAt = Date.now();
  saveOrders();

  return {
    success: true,
    message: `📦 تم شحن المنتج (${product.title}) من ${product.source}.\n🔗 رابط التتبع:\n${trackingUrl}`
  };
}
function autoUpdateDeliveredStatus() {
  const now = Date.now();

  orders.forEach(order => {
    order.products.forEach(product => {
      if (
        product.shippingStatus === 'shipped' &&
        product.shippedAt &&
        now - product.shippedAt >= 60 * 1000 // دقيقة واحدة
      ) {
        product.shippingStatus = 'delivered';
        product.deliveredAt = now;
        saveOrders();

        bot.sendMessage(order.userId, `📬 تم تسليم المنتج (${product.title}) بنجاح!`);
      }
    });
  });
}
setInterval(autoUpdateDeliveredStatus, 30 * 1000); // كل 30 ثانية

function getUserTrackingInfo(userId) {
  const userOrders = orders.filter(o => o.userId === userId);
  if (userOrders.length === 0) return '📭 لا توجد طلبات حتى الآن.';

  let message = '📦 حالة الشحن لمنتجاتك:\n\n';

  userOrders.forEach(order => {
    message += `🧾 طلب رقم: ${order.id}\n`;
    order.products.forEach(product => {
      const statusEmoji = product.shippingStatus === 'shipped' ? '✅' :
                          product.shippingStatus === 'delivered' ? '📬' : '⏳';
      const tracking = product.trackingUrl ? `\n🔗 تتبع: ${product.trackingUrl}` : '';
      message += `- ${product.title} (${product.source})\n  الحالة: ${product.shippingStatus} ${statusEmoji}${tracking}\n`;
    });
    message += '\n';
  });

  return message;
}


  // ========== البوت الرئيسي ==========
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN غير موجود في ملف البيئة');
    process.exit(1);
  }
  const bot = new TelegramBot(token, {polling: true});



bot.onText(/\/shiptest (.+) (.+)/, (msg, match) => {
  const userId = msg.chat.id;
  const orderId = match[1];
  const productId = match[2];

  const result = simulateShipping(orderId, productId);

  bot.sendMessage(userId, result.message);
});
bot.onText(/\/testorder (amazon|aliexpress)/, (msg, match) => {
  const userId = msg.chat.id;
  const source = match[1];

  const order = createTestOrder(userId, source);

  bot.sendMessage(userId, `✅ تم إنشاء طلب تجريبي من ${source}.\nرقم الطلب: ${order.id}\nالمنتج: ${order.products[0].title}\nالسعر: $${order.totalAmount}`);
});
bot.onText(/\/track/, (msg) => {
  const userId = msg.chat.id;
  const userOrders = orders.filter(o => o.userId === userId);

  if (userOrders.length === 0) {
    return bot.sendMessage(userId, '📭 لا توجد طلبات حتى الآن.');
  }

  userOrders.forEach(order => {
    order.products.forEach(product => {
      const statusEmoji = product.shippingStatus === 'shipped' ? '✅' :
                          product.shippingStatus === 'delivered' ? '📬' : '⏳';
      const tracking = product.trackingUrl ? `\n🔗 تتبع: ${product.trackingUrl}` : '';
      const message = `🧾 طلب: ${order.id}\n- ${product.title} (${product.source})\nالحالة: ${product.shippingStatus} ${statusEmoji}${tracking}`;

      const inlineKeyboard = {
        inline_keyboard: []
      };

      if (product.shippingStatus === 'pending') {
        inlineKeyboard.inline_keyboard.push([
          {
            text: '📦 تحديث إلى "تم الشحن"',
            callback_data: `ship:${order.id}:${product.id}`
          }
        ]);
      }

      bot.sendMessage(userId, message, { reply_markup: inlineKeyboard });
    });
  });
});




// bot.sendMessage(userId, `📦 تم شحن المنتج التجريبي! يمكنك تتبعه هنا:\n${trackingUrl}`);

  // ========== أمر تغيير طريقة العرض ==========
  bot.onText(/\/display_(mixed|price|rating|orders|store)/, (msg, match) => {
    const chatId = msg.chat.id;
    const option = match[1];
    
    const optionMap = {
      'mixed': DISPLAY_OPTIONS.MIXED,
      'price': DISPLAY_OPTIONS.BY_PRICE,
      'rating': DISPLAY_OPTIONS.BY_RATING,
      'orders': DISPLAY_OPTIONS.BY_ORDERS,
      'store': DISPLAY_OPTIONS.BY_STORE
    };
    
    currentDisplayOption = optionMap[option] || DISPLAY_OPTIONS.MIXED;
    
    const optionNames = {
      [DISPLAY_OPTIONS.MIXED]: 'خلط عشوائي',
      [DISPLAY_OPTIONS.BY_PRICE]: 'حسب السعر (الأرخص أولاً)',
      [DISPLAY_OPTIONS.BY_RATING]: 'حسب التقييم (الأعلى أولاً)',
      [DISPLAY_OPTIONS.BY_ORDERS]: 'حسب المبيعات (الأكثر مبيعاً)',
      [DISPLAY_OPTIONS.BY_STORE]: 'حسب المتجر (Amazon أولاً)'
    };
    
    bot.sendMessage(chatId, `✅ تم تغيير طريقة العرض إلى: ${optionNames[currentDisplayOption]}`);
  });

  // ========== أمر البحث من جميع المصادر ==========
  bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = match[1];
    
    if (!query) {
      bot.sendMessage(chatId, '⚠️ يرجى تقديم كلمة بحث صحيحة');
      return;
    }
    
    const waitingMsg = await bot.sendMessage(chatId, '🔍 جاري البحث في جميع المتاجر...');
    
    try {
      const [amazonProducts, aliExpressProducts] = await Promise.all([
        searchAmazonProducts(query),
        searchAliExpressProducts(query)
      ]);

      await bot.deleteMessage(chatId, waitingMsg.message_id);
      
      const allProducts = [...amazonProducts, ...aliExpressProducts];
      
      if (allProducts.length === 0) {
        bot.sendMessage(chatId, '❌ لم يتم العثور على منتجات تطابق بحثك.');
        return;
      }
      
      // ترتيب المنتجات حسب الخيار المحدد
      const sortedProducts = sortProducts(allProducts, currentDisplayOption);
      const productsToSend = sortedProducts.slice(0, 8);
      
      // إرسال رسالة عن طريقة العرض المستخدمة
      const displayInfo = {
        [DISPLAY_OPTIONS.MIXED]: '🔄 عرض عشوائي',
        [DISPLAY_OPTIONS.BY_PRICE]: '💰 عرض حسب السعر (الأرخص أولاً)',
        [DISPLAY_OPTIONS.BY_RATING]: '⭐ عرض حسب التقييم (الأعلى أولاً)',
        [DISPLAY_OPTIONS.BY_ORDERS]: '🔥 عرض حسب المبيعات (الأكثر مبيعاً)',
        [DISPLAY_OPTIONS.BY_STORE]: '🏪 عرض حسب المتجر (Amazon أولاً)'
      };
      
      await bot.sendMessage(chatId, displayInfo[currentDisplayOption]);
      
      // إرسال المنتجات مع أزرار إضافة إلى السلة
      for (const product of productsToSend) {
        const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
        const message = `
  ${storeIcon} *${product.store}*
  📦 ${product.title}
  💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
  ⭐ التقييم: ${product.rating || 'غير متوفر'}
  🛒 ${product.orders || 'غير متوفر'}
  🚚 ${product.shipping}
  ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
  🔗 [عرض المنتج](${product.affiliate_link || product.url})

  *عمولة: ${(product.commission_rate * 100).toFixed(1)}%*
        `;
        
        try {
          const keyboard = {
            inline_keyboard: [[
              { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id}` }
            ]]
          };
          
          if (product.image && product.image.startsWith('http')) {
            await bot.sendPhoto(chatId, product.image, {
              caption: message,
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          } else {
            await bot.sendMessage(chatId, message, {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          }
        } catch (sendError) {
          console.error('Error sending product:', sendError.message);
          await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const statsMessage = `
  ✅ تم العثور على ${allProducts.length} منتج:
  • 🏪 Amazon: ${amazonProducts.length} منتج
  • 🛒 AliExpress: ${aliExpressProducts.length} منتج

  *أوامر العرض المتاحة:*
  /display_mixed - عرض عشوائي
  /display_price - حسب السعر
  /display_rating - حسب التقييم  
  /display_orders - حسب المبيعات
  /display_store - حسب المتجر

  استخدم /search <كلمة البحث> للبحث مرة أخرى.
      `;
      
      bot.sendMessage(chatId, statsMessage, {parse_mode: 'Markdown'});
      
    } catch (error) {
      console.error('Error in search:', error);
      try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقاً.');
    }
  });

  // ========== أمر البحث في متجر محدد ==========
  bot.onText(/\/search_(amazon|aliexpress) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const store = match[1];
    const query = match[2];
    
    const waitingMsg = await bot.sendMessage(chatId, `🔍 جاري البحث في ${store}...`);
    
    try {
      let products = [];
      if (store === 'amazon') {
        products = await searchAmazonProducts(query);
      } else if (store === 'aliexpress') {
        products = await searchAliExpressProducts(query);
      }
      
      await bot.deleteMessage(chatId, waitingMsg.message_id);
      
      if (!products || products.length === 0) {
        bot.sendMessage(chatId, `❌ لم يتم العثور على منتجات في ${store} تطابق بحثك.`);
        return;
      }
      
      const sortedProducts = sortProducts(products, currentDisplayOption);
      const productsToSend = sortedProducts.slice(0, 6);
      
      for (const product of productsToSend) {
        const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
        const message = `
  ${storeIcon} *${product.store}*
  📦 ${product.title}
  💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
  ⭐ التقييم: ${product.rating || 'غير متوفر'}
  🛒 ${product.orders || 'غير متوفر'}
  🚚 ${product.shipping}
  ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
  🔗 [عرض المنتج](${product.affiliate_link || product.url})

  *عمولة: ${(product.commission_rate * 100).toFixed(1)}%*
        `;
        
        try {
          const keyboard = {
            inline_keyboard: [[
              { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id}` }
            ]]
          };
          
          if (product.image && product.image.startsWith('http')) {
            await bot.sendPhoto(chatId, product.image, {
              caption: message,
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          } else {
            await bot.sendMessage(chatId, message, {
              parse_mode: 'Markdown',
              reply_markup: keyboard
            });
          }
        } catch (sendError) {
          await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      bot.sendMessage(chatId, `✅ تم العثور على ${products.length} منتج في ${store}.`);
      
    } catch (error) {
      console.error(`Error searching ${store}:`, error);
      try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
      bot.sendMessage(chatId, `❌ حدث خطأ أثناء البحث في ${store}.`);
    }
  });

  // ========== معالجة الأزرار ==========
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    try {
      if (data.startsWith('add_to_cart_')) {
        const productId = data.replace('add_to_cart_', '');
        
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إضافة المنتج إلى السلة...' });
        
        // محاكاة إضافة منتج إلى السلة (في التطبيق الحقيقي، ستحتاج إلى البحث عن المنتج أولاً)
        const product = {
          id: productId,
          title: `منتج ${productId}`,
          price: '$10.00',
          priceValue: 10.00,
          image: '',
          url: `https://example.com/product/${productId}`,
          affiliate_link: `https://example.com/product/${productId}?aff=123`,
          store: 'Amazon'
        };
        
        const success = await addToCart(chatId, product);
        
        if (success) {
          await bot.sendMessage(chatId, '✅ تمت إضافة المنتج إلى سلة المشتريات.');
        } else {
          await bot.sendMessage(chatId, '❌ فشلت إضافة المنتج إلى السلة. يرجى المحاولة مرة أخرى.');
        }
      }
      else if (data === 'checkout') {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إنهاء عملية الشراء...' });
        
        const cartItems = await getCart(chatId);
        
        if (cartItems.length === 0) {
          await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
          return;
        }
        
        try {
          // طلب معلومات الشحن من المستخدم
          const shippingOptions = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📋 إدخال عنوان الشحن', callback_data: 'enter_shipping' }],
                [{ text: '❌ إلغاء', callback_data: 'cancel_checkout' }]
              ]
            }
          };
          
          bot.sendMessage(chatId, '🚚 يرجى إدخال عنوان الشحن لإكمال عملية الشراء:', shippingOptions);
        } catch (error) {
          await bot.sendMessage(chatId, '❌ فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
        }
      }
      else if (data === 'clear_cart') {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري تفريغ السلة...' });
        
        const success = await clearCart(chatId);
        
        if (success) {
          await bot.sendMessage(chatId, '✅ تم تفريغ سلة المشتريات.');
        } else {
          await bot.sendMessage(chatId, '❌ فشل تفريغ السلة. يرجى المحاولة مرة أخرى.');
        }
      }
  else if (data === 'enter_shipping') {
  await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إعداد نموذج العنوان...' });
  
  const addressInstructions = `📋 يرجى إرسال عنوان الشحن بالشكل التالي:
  
الشارع: [اسم الشارع ورقم المنزل]
المدينة: [اسم المدينة]
الولاية/المحافظة: [اسم الولاية]
الرمز البريدي: [الرمز البريدي]
البلد: [اسم البلد]

مثال:
الشارع: 123 شارع التسوق
المدينة: الرياض
الولاية/المحافظة: الرياض
الرمز البريدي: 12345
البلد: السعودية`;

  bot.sendMessage(chatId, addressInstructions);
  
  const addressHandler = async (addressMsg) => {
    if (addressMsg.chat.id === chatId) {
      bot.removeListener('message', addressHandler);
      
      const addressText = addressMsg.text;
      const shippingAddress = {};
      
      // معالجة العنوان
      const addressLines = addressText.split('\n');
      addressLines.forEach(line => {
        if (line.includes('الشارع:')) shippingAddress.street = line.replace('الشارع:', '').trim();
        else if (line.includes('المدينة:')) shippingAddress.city = line.replace('المدينة:', '').trim();
        else if (line.includes('الولاية:') || line.includes('المحافظة:')) {
          shippingAddress.state = line.replace('الولاية:', '').replace('المحافظة:', '').trim();
        }
        else if (line.includes('الرمز البريدي:')) shippingAddress.zipCode = line.replace('الرمز البريدي:', '').trim();
        else if (line.includes('البلد:')) shippingAddress.country = line.replace('البلد:', '').trim();
      });
      
      try {
        const cartItems = await getCart(chatId);
        
        if (cartItems.length === 0) {
          await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
          return;
        }
        
        const orderResult = await processRealOrder(chatId, cartItems, shippingAddress, 'credit_card');
        
        if (!orderResult || !orderResult.success) {
          await bot.sendMessage(chatId, '❌ فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
          return;
        }
        
        if (process.env.STRIPE_SECRET_KEY && orderResult.checkout && orderResult.checkout.url) {
          // إرسال رابط الدفع الحقيقي
          await bot.sendMessage(chatId, `✅ تم إنشاء طلبك بنجاح!\n🆔 رقم الطلب: ${orderResult.order.orderId}\n💰 المبلغ الإجمالي: ${orderResult.order.totalAmount.toFixed(2)} USD`);
       console.log( orderResult.checkout.url);
          await   bot.sendMessage(chatId, "💳 لإتمام عملية الدفع:", {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "إتمام الدفع",
          web_app: { url: orderResult.checkout.url }  // رابط Stripe Checkout
        }
      ]
    ]
  }
});
          await bot.sendMessage(chatId, `💳 يرجى إكمال عملية الدفع عبر الرابط التالي:\n${orderResult.checkout.url}`);
        } else {
          // وضع التطوير
          await bot.sendMessage(chatId, `✅ تم إنشاء طلب تجريبي!\n🆔 رقم الطلب: ${orderResult.order.orderId}\n💰 المبلغ الإجمالي: ${orderResult.order.totalAmount.toFixed(2)} USD`);
          await bot.sendMessage(chatId, '🔗 هذا رابط تجريبي للدفع (للتطوير فقط)');
        }
      } catch (error) {
        console.error('Error processing order:', error);
        await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة الطلب.');
      }
    }
  };
  
  bot.on('message', addressHandler);
}
      else if (data === 'cancel_checkout') {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'تم إلغاء عملية الشراء' });
        await bot.sendMessage(chatId, '❌ تم إلغاء عملية الشراء.');
      }
        else if (data.startsWith('ship:')) {
        const [, orderId, productId] = data.split(':');

        const result = simulateShipping(orderId, productId); // تأكد أن هذه الدالة موجودة وتحدث shippedAt
        await bot.sendMessage(chatId, result.message);
        await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ تم التحديث إلى "تم الشحن"' });
      }

      else if (data.startsWith('deliver:')) {
        const [, orderId, productId] = data.split(':');

        const order = orders.find(o => o.id === orderId);
        if (!order) {
          await bot.sendMessage(chatId, '❌ الطلب غير موجود.');
          return;
        }

        const product = order.products.find(p => p.id === productId);
        if (!product) {
          await bot.sendMessage(chatId, '❌ المنتج غير موجود.');
          return;
        }

        product.shippingStatus = 'delivered';
        product.deliveredAt = Date.now();
        saveOrders();

        await bot.sendMessage(chatId, `📬 تم تأكيد تسليم المنتج (${product.title}) بنجاح!`);
        await bot.answerCallbackQuery(callbackQuery.id, { text: '📬 تم التحديث إلى "تم التسليم"' });
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'حدث خطأ أثناء المعالجة.' });
    }
  });

  // ========== أمر بدء عملية الشراء الحقيقية ==========
  bot.onText(/\/checkout/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const cartItems = await getCart(chatId);
      
      if (cartItems.length === 0) {
        bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
        return;
      }
      
      // طلب معلومات الشحن من المستخدم
      const shippingOptions = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 إدخال عنوان الشحن', callback_data: 'enter_shipping' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_checkout' }]
          ]
        }
      };
      
      bot.sendMessage(chatId, '🚚 يرجى إدخال عنوان الشحن لإكمال عملية الشراء:', shippingOptions);
      
    } catch (error) {
      console.error('Error starting checkout:', error);
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء بدء عملية الشراء.');
    }
  });

  // ========== أمر عرض سلة المشتريات ==========
  bot.onText(/\/cart/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const cartItems = await getCart(chatId);
      
      if (cartItems.length === 0) {
        bot.sendMessage(chatId, '🛒 سلة المشتريات فارغة.');
        return;
      }
      
      let total = 0;
      let message = '🛒 *سلة المشتريات*\n\n';
      
      for (const item of cartItems) {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        message += `📦 ${item.title}\n`;
        message += `💰 ${item.price} USD x ${item.quantity} = ${itemTotal.toFixed(2)} USD\n`;
        message += `🏪 ${item.store}\n`;
        message += `🔗 [عرض المنتج](${item.url})\n`;
        message += '────────────────────\n';
      }
      
      message += `\n*المجموع: ${total.toFixed(2)} USD*`;
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ إنهاء الشراء', callback_data: 'checkout' }],
          [{ text: '🗑️ تفريغ السلة', callback_data: 'clear_cart' }]
        ]
      };
      
      bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
    } catch (error) {
      console.error('Error showing cart:', error);
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض سلة المشتريات.');
    }
  });

  // ========== أمر الطلبات ==========
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const orders = await getUserOrders(chatId);

    if (orders.length === 0) {
      bot.sendMessage(chatId, '📦 لم تقم بأي طلبات حتى الآن.');
      return;
    }

    let message = '📦 *طلباتك السابقة*\n\n';

    for (const order of orders.slice(0, 5)) {
      message += `🆔 رقم الطلب: ${order.orderId}\n`;
      message += `💰 المبلغ: ${order.totalAmount.toFixed(2)} ${order.currency || 'USD'}\n`;
      message += `📊 الحالة العامة: ${order.status}\n`;
      message += `💳 الدفع: ${order.paymentStatus}\n`;
      message += `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}\n`;

      if (order.products && order.products.length > 0) {
        message += `🛍️ المنتجات:\n`;
        for (const product of order.products) {
          const statusEmoji = product.shippingStatus === 'shipped' ? '✅' :
                              product.shippingStatus === 'delivered' ? '📬' : '⏳';
          const tracking = product.trackingUrl ? `\n🔗 تتبع: ${product.trackingUrl}` : '';
          message += `  - ${product.title} (${product.source})\n    الحالة: ${product.shippingStatus} ${statusEmoji}${tracking}\n`;
        }
      }

      message += '────────────────────\n';
    }

    if (orders.length > 5) {
      message += `\nو${orders.length - 5} طلبات أخرى...`;
    }

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error showing orders:', error);
    bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض الطلبات.');
  }
});


  // ========== أمر العمولات ==========
  bot.onText(/\/earnings/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const commissions = await getCommissions(chatId);
      const totalEarnings = await getTotalEarnings(chatId);
      
      if (commissions.length === 0) {
        bot.sendMessage(chatId, '💰 لم تحصل على أي عمولات حتى الآن.');
        return;
      }
      
      let message = '💰 *عمولاتك*\n\n';
      
      for (const commission of commissions.slice(0, 5)) {
        message += `📦 ${commission.productTitle}\n`;
        message += `🏪 ${commission.store}\n`;
        message += `💵 المبلغ: ${commission.saleAmount.toFixed(2)} USD\n`;
        message += `📊 العمولة: ${(commission.commissionRate * 100).toFixed(1)}%\n`;
        message += `💰 قيمة العمولة: ${commission.commissionAmount.toFixed(2)} USD\n`;
        message += `📊 الحالة: ${commission.status}\n`;
        message += '────────────────────\n';
      }
      
      message += `\n*إجمالي الأرباح: ${totalEarnings.toFixed(2)} USD*`;
      
      if (commissions.length > 5) {
        message += `\nو${commissions.length - 5} عمولة أخرى...`;
      }
      
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error showing earnings:', error);
      bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض العمولات.');
    }
  });

  // ========== أمر المساعدة مع معلومات حالة قاعدة البيانات ==========
  bot.onText(/\/start|\/help/, (msg) => {
    const chatId = msg.chat.id;
    const dbStatus = dbConnected ? '✅ متصلة بـ MongoDB' : '⚠️ باستخدام التخزين المحلي';
    const paymentStatus = process.env.STRIPE_SECRET_KEY ? '✅ Stripe (حقيقي)' : '⚠️ تجريبي (لتطوير)';
    
    const message = `
  مرحباً! 👋 أنا بوت للبحث في المتاجر العالمية.

  *حالة النظام:*
  💾 ${dbStatus}
  💳 ${paymentStatus}

  *المتاجر المدعومة:*
  🏪 Amazon - عمولة 5%
  🛒 AliExpress - عمولة 8%

  *أوامر البحث:*
  /search [كلمة] - البحث في جميع المتاجر
  /search_amazon [كلمة] - البحث في أمازون فقط  
  /search_aliexpress [كلمة] - البحث في AliExpress فقط

  *أوامر العرض:*
  /display_mixed - عرض عشوائي
  /display_price - حسب السعر (الأرخص أولاً)
  /display_rating - حسب التقييم (الأعلى أولاً)
  /display_orders - حسب المبيعات (الأكثر مبيعاً)
  /display_store - حسب المتجر (Amazon أولاً)

  *أوامر السلة والطلبات:*
  /cart - عرض سلة المشتريات
  /checkout - بدء عملية الشراء
  /orders - عرض الطلبات السابقة
  /earnings - عرض العمولات والأرباح

  *مثال:*
  /search laptop
  /display_price
  /cart
  /checkout
    `;
    
    bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});
  });

  // ========== routes API للدفع الحقيقي ==========
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const checkoutResult = await createStripeCheckoutSession(amount, currency, metadata);
    if (checkoutResult.success) {
      return res.json({ success: true, url: checkoutResult.url });
    } else {
      return res.status(400).json({ success: false, error: checkoutResult.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Webhook لاستقبال أحداث Stripe
app.post('/api/confirm-payment', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ تم الدفع بنجاح، session:', session.id);

    const orderId = session.metadata?.orderId;
    const telegramId = session.metadata?.telegramId;

    if (orderId && session.id) {
      await confirmOrderPayment(orderId, session.id, telegramId);
    } else {
      console.warn('⚠️ لم يتم العثور على orderId أو telegramId في metadata');
    }
  }

  res.status(200).send('✅ Webhook received');
});



  app.post('/api/confirm-payment', async (req, res) => {
    try {
      const { orderId, paymentIntentId } = req.body;
      
      if (!orderId || !paymentIntentId) {
        return res.status(400).json({ error: 'Order ID and Payment Intent ID are required' });
      }
      
      const result = await confirmOrderPayment(orderId, paymentIntentId);
      
      if (result.success) {
        res.json({
          success: true,
          order: result.order,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/cart', async (req, res) => {
    try {
      const { telegramId, product } = req.body;
      
      if (!telegramId || !product) {
        return res.status(400).json({ error: 'Telegram ID and product are required' });
      }
      
      const success = await addToCart(telegramId, product);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/cart/:telegramId', async (req, res) => {
    try {
      const { telegramId } = req.params;
      const cartItems = await getCart(telegramId);
      res.json({ success: true, cart: cartItems });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/order', async (req, res) => {
    try {
      const { telegramId, shippingAddress } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({ error: 'Telegram ID is required' });
      }
      
      const cartItems = await getCart(telegramId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      const order = await processRealOrder(telegramId, cartItems, shippingAddress, 'credit_card');
      res.json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: dbConnected ? 'MongoDB' : 'Local Storage',
      payment: process.env.STRIPE_SECRET_KEY ? 'Stripe (Real)' : 'Mock (Development)',
      affiliate: {
        amazon: process.env.AMAZON_AFFILIATE_TAG ? 'Active' : 'Inactive',
        aliexpress: process.env.ALIEXPRESS_AFFILIATE_ID ? 'Active' : 'Inactive'
      }
    });
  });

  // ========== تشغيل السيرفر مع الاتصال بقاعدة البيانات ==========
  async function startServer() {
    try {
      // await connectToMongoDB();
      
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🤖 Telegram bot started`);
        // console.log(`💾 Database: ${dbConnected ? 'MongoDB' : 'Local Storage'}`);
        console.log(`💳 Payment: ${process.env.STRIPE_SECRET_KEY ? 'Stripe (Real)' : 'Mock (Development)'}`);
        if (process.env.AMAZON_AFFILIATE_TAG) console.log(`🏪 Amazon affiliate: ${process.env.AMAZON_AFFILIATE_TAG}`);
        if (process.env.ALIEXPRESS_AFFILIATE_ID) console.log(`🛒 AliExpress affiliate: ${process.env.ALIEXPRESS_AFFILIATE_ID}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
app.post('/checkout', async (req, res) => {
  try {
    // ✅ 1. استقبال البيانات من الطلب
    const priceInDollars = parseFloat(req.body.price);
    const priceInCents = Math.round(priceInDollars * 100); // Stripe يتعامل بالسنت
    const itemName = req.body.itmename;
    const userId = req.body.userId;
    const userEmail = req.body.userEmail;

    // ✅ 2. إنشاء رابط نجاح آمن باستخدام session_id
    const successUrl = 'https://ghidhaalruwhusa.com/success?session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = 'https://ghidhaalruwhusa.com/cancel';

    // ✅ 3. إنشاء جلسة Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: itemName,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      automatic_tax: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'SA'],
      },
      metadata: {
        productName: itemName,
        userId: userId,
      },
    });

    // ✅ 4. إرسال رابط الدفع إلى الواجهة أو البوت
    res.json({ url: session.url });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).send('حدث خطأ أثناء إنشاء جلسة الدفع');
  }
});

  // ========== معالجة الأخطاء ==========
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });