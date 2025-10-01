



require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(bodyParser.json());

// إعدادات من .env
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.INSTGRAM_TOKN; // التوكن من Meta
const IG_USER_ID = process.env.IG_USER_ID; // instagram_business_account id

// تهيئة Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== Webhook Verification =====
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// ===== Webhook Receiver =====
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'instagram') {
      body.entry.forEach(async (entry) => {
        if (entry.messaging) {
          entry.messaging.forEach(async (event) => {
            if (event.message && event.sender && event.sender.id) {
              const senderId = event.sender.id;
              const messageText = event.message.text || '';

              console.log(`📩 رسالة من ${senderId}: ${messageText}`);

              // استدعاء Gemini لتصنيف الرسالة / إنشاء رد
              const replyText = await getReplyFromGemini(messageText);

              // إرسال الرد للمستخدم عبر Graph API
              await sendInstagramMessage(senderId, replyText);
            }
          });
        }
      });
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('❌ Webhook Error:', err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// ===== Gemini Handler =====
async function getReplyFromGemini(messageText) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const intentPrompt = `
أنت مصنف نوايا ذكي. مهمتك تحديد نوع الرسالة التالية بدقة عالية.
التصنيفات الممكنة:
- سؤال
- شكر
- سخرية
- طلب
- عام

الرسالة: "${messageText}"
`;

    const intentResult = await model.generateContent(intentPrompt);
    const intent = intentResult.response.text().trim().toLowerCase();

    console.log("🎯 التصنيف:", intent);

    // بناء رد بسيط حسب النية
    switch (intent) {
      case 'سؤال':
        return "سؤالك رائع! خليني أجاوبك...";
      case 'شكر':
        return "العفو 🙏 يسعدني مساعدتك.";
      case 'سخرية':
        return "تمام، خلينا نخليها بروح رياضية 😅";
      case 'طلب':
        return "تمام، خليني أنفذ طلبك 👍";
      default:
        return "مفهوم ✅ شكراً لتواصلك معنا.";
    }
  } catch (e) {
    console.error("❌ Gemini Error:", e.message);
    return "عذراً، حدث خطأ أثناء تحليل الرسالة.";
  }
}

// ===== إرسال رسالة عبر Graph API =====
async function sendInstagramMessage(userId, text) {
  const url = `https://graph.facebook.com/v17.0/${IG_USER_ID}/messages`;
  const payload = {
    recipient: { id: userId },
    message: { text }
  };

  const resp = await axios.post(url, payload, {
    params: { access_token: PAGE_ACCESS_TOKEN }
  });

  console.log("📤 تم إرسال الرد:", resp.data);
  return resp.data;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));






























// const express = require('express');
// const axios = require('axios');
// const bodyParser = require('body-parser');
// require('dotenv').config();
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// const app = express();
// const PORT = 8000;
// app.use(bodyParser.json());
// const PAGE_ID = process.env.PAGE_ID;
// const PAGE_NAME = process.env.PAGE_NAME;
// const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const repliedComments = new Set();

// // setInterval(async () => {
// //   console.log(`📡 بدء فحص منشورات الصفحة...`);

// //   try {
// //     const res = await axios.get(`https://graph.facebook.com/v19.0/${PAGE_ID}/feed`, {
// //       params: {
// //         access_token: PAGE_ACCESS_TOKEN,
// //         fields: 'id,message,comments{message,id}'

// //       }
// //     });

// //     const posts = res.data.data;

// //     for (const post of posts) {
// //       const postId = post.id;
// //       const postText = post.message || '';
// //       console.log(`📝 منشور (${postId}): ${postText}`);

// //       if (post.comments && post.comments.data) {
// //         for (const comment of post.comments.data) {
// //           const commentId = comment.id;
// //           const commentText = comment.message || '';
// //           console.log(`💬 تعليق (${commentId}): ${commentText}`);

// //           if (!repliedComments.has(commentId)) {
// //             console.log(`🤖 جاري الرد على التعليق...`);
// //             await replyToComment(commentId, commentText, postText);
// //             repliedComments.add(commentId);
// //             console.log(`✅ تم الرد على (${commentId})`);
// //           } else {
// //             console.log(`⏭️ تم تجاهل التعليق (${commentId}) لأنه تم الرد عليه مسبقًا.`);
// //           }
// //         }
// //       } else {
// //         console.log(`📭 لا توجد تعليقات على المنشور (${postId}) حتى الآن.`);
// //       }
// //     }
// //   } catch (err) {
// //     console.error('❌ خطأ أثناء جلب المنشورات:', JSON.stringify(err.response?.data, null, 2));
// //   }

// //   console.log(`⏳ انتهاء الدورة، سيتم الفحص مرة أخرى بعد دقيقة...`);
// // }, 60000);
  
// // async function replyToComment(commentId, commentText, postText) {
// //   try {
// //     console.log(`🧠 تحليل التعليق: ${commentText}`);

// //     const intentPrompt = `
// // أنت مصنف نوايا ذكي. مهمتك تحديد نوع التعليق التالي بدقة عالية.
// // التصنيفات الممكنة:
// // - سؤال
// // - شكر
// // - سخرية
// // - طلب
// // - عام

// // التعليق: "${commentText}"
// // `;

// //     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
// //     const intentResult = await model.generateContent(intentPrompt);
// //     const intent = intentResult.response.text().trim().toLowerCase();
// //     console.log(intent);

// //     let replyPrompt = '';

// //     switch (intent) {
// //       case 'سؤال':
// //         replyPrompt = `شخص كتب تعليقًا فيه سؤال: "${commentText}" وكان المنشور يقول: "${postText}". أجب عليه بطريقة ذكية وواضحة.`;
// //         break;
// //       case 'شكر':
// //         replyPrompt = `شخص كتب تعليقًا فيه شكر: "${commentText}". رد عليه بلطافة وامتنان.`;
// //         break;
// //       case 'سخرية':
// //         replyPrompt = `شخص كتب تعليقًا ساخرًا: "${commentText}". رد عليه بلطافة دون استفزاز.`;
// //         break;
// //       case 'طلب':
// //         replyPrompt = `شخص كتب تعليقًا فيه طلب: "${commentText}". حاول مساعدته أو توجيهه.`;
// //         break;
// //       default:
// //         replyPrompt = `شخص كتب تعليقًا: "${commentText}". وكان المنشور يقول: "${postText}". رد عليه برد ودي ومحايد.`;
// //     }

// //     const replyResult = await model.generateContent(replyPrompt);
// //     const reply = replyResult.response.text().trim();
// //     console.log(reply);
// //     await axios.post(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
// //       message: reply,
// //       access_token: PAGE_ACCESS_TOKEN
// //     });

// //     console.log(`✅ تم الرد على ${commentId} (${intent}): ${reply}`);
// //   } catch (err) {
// //     console.error(`❌ فشل الرد على ${commentId}:`, JSON.stringify(err.response?.data, null, 2) || err.message, err.stack);

// //   }
// // }
// // ✅ تحقق من Webhook عند الاشتراك من Facebook Developer Console
// // app.get('/webhook', (req, res) => {
// //   const VERIFY_TOKEN = 'abduljabbar';

// //   const mode = req.query['hub.mode'];
// //   const token = req.query['hub.verify_token'];
// //   const challenge = req.query['hub.challenge'];

// //   if (mode === 'subscribe' && token === VERIFY_TOKEN) {
// //     console.log('✅ تم التحقق من Webhook بنجاح');
// //     res.status(200).send(challenge);
// //   } else {
// //     console.log('❌ فشل التحقق من Webhook');
// //     res.sendStatus(403);
// //   }
// // });

// // ✅ استقبال رسائل ماسنجر والرد عليها تلقائيًا
// // app.post('/webhook', express.json(), async (req, res) => {
// //   const body = req.body;
// // console.log('📥 تم استقبال POST /webhook:', JSON.stringify(req.body, null, 2));

// //   if (body.object === 'page') {
// //     for (const entry of body.entry) {
// //       for (const event of entry.messaging) {
// //         const senderId = event.sender.id;
// //         const messageText = event.message?.text;

// //         if (messageText) {
// //           console.log(`📩 رسالة من ${senderId}: ${messageText}`);

// //           try {
// //             // تحليل النية باستخدام Gemini
// //             const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
// //             const intentPrompt = `
// // أنت مصنف نوايا ذكي. مهمتك تحديد نوع الرسالة التالية بدقة عالية.
// // التصنيفات الممكنة:
// // - سؤال
// // - شكر
// // - سخرية
// // - طلب
// // - عام

// // الرسالة: "${messageText}"
// // `;
// //             const intentResult = await model.generateContent(intentPrompt);
// //             const intent = intentResult.response.text().trim().toLowerCase();
// //             console.log(`🧠 نية الرسالة: ${intent}`);

// //             let replyPrompt = '';

// //             switch (intent) {
// //               case 'سؤال':
// //                 replyPrompt = `شخص أرسل رسالة فيها سؤال: "${messageText}". أجب عليه بطريقة ذكية وواضحة.`;
// //                 break;
// //               case 'شكر':
// //                 replyPrompt = `شخص أرسل رسالة فيها شكر: "${messageText}". رد عليه بلطافة وامتنان.`;
// //                 break;
// //               case 'سخرية':
// //                 replyPrompt = `شخص أرسل رسالة ساخرة: "${messageText}". رد عليه بلطافة دون استفزاز.`;
// //                 break;
// //               case 'طلب':
// //                 replyPrompt = `شخص أرسل رسالة فيها طلب: "${messageText}". حاول مساعدته أو توجيهه.`;
// //                 break;
// //               default:
// //                 replyPrompt = `شخص أرسل رسالة: "${messageText}". رد عليه برد ودي ومحايد.`;
// //             }

// //             const replyResult = await model.generateContent(replyPrompt);
// //             const reply = replyResult.response.text().trim();
// //             console.log(`✉️ الرد: ${reply}`);

// //             // إرسال الرد عبر ماسنجر
// //             await axios.post(`https://graph.facebook.com/v19.0/me/messages`, {
// //               recipient: { id: senderId },
// //               message: { text: reply },
// //               messaging_type: 'RESPONSE',
// //               access_token: PAGE_ACCESS_TOKEN
// //             });

// //             console.log(`✅ تم الرد على ${senderId}`);
// //           } catch (err) {
// //             console.error(`❌ فشل الرد على ${senderId}:`, JSON.stringify(err.response?.data, null, 2) || err.message);
// //           }
// //         }
// //       }
// //     }

// //     res.sendStatus(200);
// //   } else {
// //     res.sendStatus(404);
// //   }
// // });

// app.get('/webhook', (req, res) => {
//   const verifyToken = 'abduljabbar'; // تأكد أنها نفس القيمة التي أدخلتها في Meta

//   const mode = req.query['hub.mode'];
//   const token = req.query['hub.verify_token'];
//   const challenge = req.query['hub.challenge'];

//   if (mode === 'subscribe' && token === verifyToken) {
//     console.log('✅ Webhook verified');
//     res.status(200).send(challenge); // يجب أن يُرجع challenge مباشرة
//   } else {
//     console.log('❌ فشل التحقق من Webhook');
//     res.sendStatus(403);
//   }
// });


// // app.get('/webhook', (req, res) => {
// //   const verifyToken = process.env.WHATSAPP_TOKEN; // اختر رمز تحقق خاص بك

// //   const mode = req.query['hub.mode'];
// //   const token = req.query['hub.verify_token'];
// //   const challenge = req.query['hub.challenge'];

// //   if (mode && token === verifyToken) {
// //     console.log('✅ Webhook verified');
// //     res.status(200).send(challenge);
// //   } else {
// //     res.sendStatus(403);
// //   }
// // });

// // استقبال الأحداث من WhatsApp
// app.post('/webhook', async (req, res) => {
//   const body = req.body;

//   if (body.object === 'whatsapp_business_account') {
//     for (const entry of body.entry) {
//       for (const change of entry.changes) {
//         const value = change.value;

//         // استقبال رسالة جديدة
//         if (value.messages) {
//           const message = value.messages[0];
//           const from = message.from;
//           const text = message.text?.body;

//           console.log(`📩 رسالة من ${from}: ${text}`);

//           if (text) {
//             try {
//               // تحليل النية باستخدام Gemini
//               const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
//               const intentPrompt = `
// أنت مصنف نوايا ذكي. مهمتك تحديد نوع الرسالة التالية بدقة عالية.
// التصنيفات الممكنة:
// - سؤال
// - شكر
// - سخرية
// - طلب
// - عام

// الرسالة: "${text}"
// `;
//               const intentResult = await model.generateContent(intentPrompt);
//               const intent = intentResult.response.text().trim().toLowerCase();
//               console.log(`🧠 نية الرسالة: ${intent}`);

//               let replyPrompt = '';

//               switch (intent) {
//                 case 'سؤال':
//                   replyPrompt = `شخص أرسل سؤال: "${text}". أجب عليه بطريقة ذكية وواضحة.`;
//                   break;
//                 case 'شكر':
//                   replyPrompt = `شخص أرسل شكر: "${text}". رد عليه بلطافة وامتنان.`;
//                   break;
//                 case 'سخرية':
//                   replyPrompt = `شخص كتب تعليقًا ساخرًا: "${text}". رد عليه بلطافة دون استفزاز.`;
//                   break;
//                 case 'طلب':
//                   replyPrompt = `شخص طلب شيئًا: "${text}". حاول مساعدته أو توجيهه.`;
//                   break;
//                 default:
//                   replyPrompt = `شخص كتب: "${text}". رد عليه برد ودي ومحايد.`;
//               }

//               const replyResult = await model.generateContent(replyPrompt);
//               const reply = replyResult.response.text().trim();
//               console.log(`✉️ الرد: ${reply}`);
// const cleanReply = reply
//   .replace(/\n/g, ' ')        // إزالة السطور الجديدة
//   .replace(/\t/g, ' ')        // إزالة علامات التبويب
//   .replace(/ {5,}/g, '    '); // تقليل المسافات المتتالية إلى 4 كحد أقصى

//               // إرسال الرد عبر واتساب
//            await axios.post(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
//   messaging_product: "whatsapp",
//   to: from,
//   type: "text",
//   text: {
//     body: cleanReply // رد Gemini بعد التنظيف
//   }
// }, {
//   headers: {
//     Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
//     "Content-Type": "application/json"
//   }
// });


//               console.log(`✅ تم الرد على ${from}`);
//             } catch (err) {
//               console.error(`❌ فشل الرد على ${from}:`, JSON.stringify(err.response?.data, null, 2) || err.message);
//             }
//           }
//         }

//         // حالة الرسالة (تم الإرسال، التسليم، القراءة، إلخ)
//         if (value.statuses) {
//           const status = value.statuses[0];
//           console.log(`📊 حالة الرسالة: ${status.status}`);

//           if (status.errors) {
//             console.log(`❌ تفاصيل الخطأ: ${JSON.stringify(status.errors, null, 2)}`);
//           }
//         }
//       }
//     }

//     res.sendStatus(200);
//   } else {
//     res.sendStatus(404);
//   }
// });


// app.listen(PORT, () => {
//   console.log(`🚀 Facebook Smart Bot يعمل على http://localhost:${PORT}`);
// });









































//   require('dotenv').config();
//   const express = require('express');
//   const axios = require('axios');
//   const TelegramBot = require('node-telegram-bot-api');
//   const cors = require('cors');
//   const mongoose = require('mongoose');
//   const fs = require('fs');
//   const multer = require('multer');
//   const path = require('path');
//   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//   const { GoogleGenerativeAI } = require('@google/generative-ai');
//   const vision = require('@google-cloud/vision');
//     const FormData = require('form-data');
// const {YtDlp} =require("ytdlp-nodejs");
// const { spawn } = require('child_process');
// const { exec } = require('child_process');
// // const chrome = require('chrome-aws-lambda'); 



//   const app = express();
  
//   const PORT = process.env.PORT || 3000;



//   // ========== البوت الرئيسي ==========
//   const token = process.env.TELEGRAM_BOT_TOKEN;
//   if (!token) {
//     console.error('TELEGRAM_BOT_TOKEN غير موجود في ملف البيئة');
//     process.exit(1);
//   }
//   const bot = new TelegramBot(token, {polling: true});
// const url = 'https://webhooktest-jfxg.onrender.com';
// // bot.setWebHook(`${url}/bot${token}`);
//   app.use(cors());

//   // middleware


//   // ========== إعدادات قاعدة البيانات ==========
//   let dbConnected = false;
//   let User, Commission, Order;
// // const User = require('./models/User'); // تأكد من المسار حسب بنية مشروعك

//   // إنشاء مجلد للتخزين المحلي إذا لم يكن موجوداً
//   const dataDir = path.join(__dirname, 'data');
//   if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir, { recursive: true });
//   }

//   // دالة لتحميل البيانات من الملفات المحلية
//   function loadLocalData(filename) {
//     try {
//       const filePath = path.join(dataDir, filename);
//       if (fs.existsSync(filePath)) {
//         return JSON.parse(fs.readFileSync(filePath, 'utf8'));
//       }
//       return {};
//     } catch (error) {
//       console.error(`Error loading ${filename}:`, error);
//       return {};
//     }
//   }

//   // دالة لحفظ البيانات في الملفات المحلية
//   function saveLocalData(filename, data) {
//     try {
//       const filePath = path.join(dataDir, filename);
//       fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
//       return true;
//     } catch (error) {
//       console.error(`Error saving ${filename}:`, error);
//       return false;
//     }
//   }

//   // تخزين محلي للبيانات
//   const localUsers = loadLocalData('users.json');
//   const localCommissions = loadLocalData('commissions.json');
//   const localOrders = loadLocalData('orders.json');
//   // ========== إعدادات العرض ==========
//   const DISPLAY_OPTIONS = {
//     MIXED: 'mixed',
//     BY_PRICE: 'by_price',
//     BY_RATING: 'by_rating',
//     BY_ORDERS: 'by_orders',
//     BY_STORE: 'by_store'
//   };

//   let currentDisplayOption = DISPLAY_OPTIONS.MIXED;



  

// console.log('🔗 MONGODB_URI:', process.env.MONGODB_URI);

// // mongoose.connect(process.env.MONGODB_URI)
// //   .then(() => {
// //     dbConnected = true;
// //     console.log('✅ تم الاتصال بـ MongoDB');
// //   })
// //   .catch(err => {
// //     console.error('❌ فشل الاتصال بـ MongoDB:', err.message);
// //   });

// // const cartSchema = new mongoose.Schema({
// //   telegramId: { type: String, required: true },
// //   items: [
// //     {
// //       title: String,
// //       price: Number,
// //       quantity: Number,
// //       store: String,
// //       url: String
// //     }
// //   ]
// // });

// // const userSchema = new mongoose.Schema({
// //   telegramId: { type: String, required: true, unique: true },
// //   cart: [
// //     {
// //       productId: String,
// //       title: String,
// //       price: Number,
// //       currency: String,
// //       image: String,
// //       url: String,
// //       affiliateLink: String,
// //       store: String,
// //       quantity: Number
// //     }
// //   ],
// //   orders: [Object],
// //   affiliateEarnings: Number,
// //   createdAt: Date
// // });

// // module.exports = mongoose.model('User', userSchema);
// // module.exports = mongoose.model('Cart', cartSchema);





// async function connectToMongoDB() {
//     try {
//       await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping_bot')  .then(() => {
//     dbConnected = true;
//     console.log('✅ تم الاتصال بـ MongoDB');
//   })
//   .catch(err => {
//     console.error('❌ فشل الاتصال بـ MongoDB:', err.message);
//   });
//       console.log('✅ Connected to MongoDB');
      
//       // نماذج قاعدة البيانات
//       const UserSchema = new mongoose.Schema({
//         telegramId: { type: Number, required: true, unique: true },
//         username: String,
//         firstName: String,
//         lastName: String,
//         email: String,
//         phone: String,
//         shippingAddress: {
//           street: String,
//           city: String,
//           state: String,
//           zipCode: String,
//           country: String
//         },
//         cart: [{
//           productId: String,
//           title: String,
//           price: Number,
//           currency: String,
//           image: String,
//           url: String,
//           affiliateLink: String,
//           store: String,
//           quantity: { type: Number, default: 1 },
//           addedAt: { type: Date, default: Date.now }
//         }],
//         orders: [{
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'Order'
//         }],
//         affiliateEarnings: { type: Number, default: 0 },
//         createdAt: { type: Date, default: Date.now }
//       });

//       const CommissionSchema = new mongoose.Schema({
//         userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         telegramId: Number,
//         productId: String,
//         productTitle: String,
//         store: String,
//         saleAmount: Number,
//         commissionRate: Number,
//         commissionAmount: Number,
//         orderId: String,
//         status: { type: String, default: 'pending' },
//         createdAt: { type: Date, default: Date.now }
//       });

//       const OrderSchema = new mongoose.Schema({
//         orderId: { type: String, unique: true },
//         telegramId: Number,
//         user: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: 'User'
//         },
//         products: [{
//           productId: String,
//           title: String,
//           price: Number,
//           currency: String,
//           quantity: Number,
//           affiliateLink: String,
//           store: String
//         }],
//         totalAmount: Number,
//         currency: { type: String, default: 'USD' },
//         status: { 
//           type: String, 
//           enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//           default: 'pending'
//         },
//         shippingAddress: {
//           street: String,
//           city: String,
//           state: String,
//           zipCode: String,
//           country: String
//         },
//         paymentMethod: String,
//         paymentStatus: {
//           type: String,
//           enum: ['pending', 'paid', 'failed', 'refunded'],
//           default: 'pending'
//         },
//         paymentId: String,
//         trackingNumber: String,
//         createdAt: { type: Date, default: Date.now },
//         updatedAt: { type: Date, default: Date.now }
//       });

//       User = mongoose.model('User', UserSchema);
//       Commission = mongoose.model('Commission', CommissionSchema);
//       Order = mongoose.model('Order', OrderSchema);
      
//       dbConnected = true;
//       return true;
//     } catch (error) {
//       console.warn('❌ MongoDB connection failed, using local storage');
//       console.warn('For full functionality, please install MongoDB or provide a MongoDB URI');
//       dbConnected = false;
//       return false;
//     }
//   }
//   connectToMongoDB();
//   // ========== الدوال المساعدة ==========
//   async function translateToEnglish(text) {
//     console.log("ترجمة النص:", text);
//     return text;
//   }

//   // ========== دوال الترتيب ==========
//   function sortProducts(products, option) {
//     const sorted = [...products];
    
//     switch (option) {
//       case DISPLAY_OPTIONS.BY_PRICE:
//         return sorted.sort((a, b) => {
//           const priceA = parseFloat(a.price.replace(/[^\d.]/g, '')) || 0;
//           const priceB = parseFloat(b.price.replace(/[^\d.]/g, '')) || 0;
//           return priceA - priceB;
//         });

//       case DISPLAY_OPTIONS.BY_RATING:
//         return sorted.sort((a, b) => {
//           const ratingA = parseFloat(a.rating) || 0;
//           const ratingB = parseFloat(b.rating) || 0;
//           return ratingB - ratingA;
//         });

//       case DISPLAY_OPTIONS.BY_ORDERS:
//         return sorted.sort((a, b) => {
//           const ordersA = parseFloat(a.orders.replace(/[^\d.]/g, '')) || 0;
//           const ordersB = parseFloat(b.orders.replace(/[^\d.]/g, '')) || 0;
//           return ordersB - ordersA;
//         });

//       case DISPLAY_OPTIONS.BY_STORE:
//         return sorted.sort((a, b) => {
//           if (a.store === 'Amazon' && b.store !== 'Amazon') return -1;
//           if (a.store !== 'Amazon' && b.store === 'Amazon') return 1;
//           return 0;
//         });

//       case DISPLAY_OPTIONS.MIXED:
//       default:
//         return sorted.sort(() => Math.random() - 0.5);
//     }
//   }

//   // ========== AMAZON FUNCTIONS ==========
//   function generateAmazonAffiliateLink(productUrl, affiliateTag) {
//     try {
//       const url = new URL(productUrl);
//       url.searchParams.set('tag', affiliateTag);
//       url.searchParams.set('linkCode', 'as2');
      
//       const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/);
//       if (asinMatch && asinMatch[1]) {
//         url.searchParams.set('creativeASIN', asinMatch[1]);
//       }
      
//       return url.toString();
//     } catch (error) {
//       console.error('Error generating Amazon affiliate link:', error);
//       return productUrl;
//     }
//   }

//   async function searchAmazonProducts(query) {
//     console.log(query);
//     if (!query || query.trim().length === 0) {
//       console.error('استعلام البحث فارغ');
//       return [];
//     }

//     const cleanQuery = query.replace(/[^\w\u0600-\u06FF\s]/gi, '').trim();
//     let translatedQuery = cleanQuery;
    
//     try {
//       if (/^[\u0600-\u06FF]/.test(cleanQuery)) {
//         translatedQuery = await translateToEnglish(cleanQuery);
//       }
//     } catch (translationError) {
//       console.error('خطأ في الترجمة:', translationError.message);
//       translatedQuery = cleanQuery;
//     }

//     // const options = {
//     //   method: 'GET',
//     //   url: 'https://real-time-amazon-data.p.rapidapi.com/search',
//     //   params: {
//     //     query: translatedQuery,
//     //     page: '1',
//     //     country: 'US',
//     //     sort_by: 'RELEVANCE',
//     //     product_condition: 'ALL'
//     //   },
//     //   headers: {
//     //     'x-rapidapi-key': process.env.RAPIDAPI_KEY,
//     //     'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
//     //   },
//     //   timeout: 10000
//     // };
    
    
    
//     const pro=[
//         {
//         "asin": "B0FF38Z3KQ",
//         "product_title": "Digital Display Drones with Camera for Adults 4k Brushless Motor Drone for Beginners Kids with 2 Batteries Foldable FPV RC Quadcopter Gift Toys for Mens Boys under249g",
//         "product_price": "$89.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 24,
//         "product_url": "https://www.amazon.com/dp/B0FF38Z3KQ",
//         "product_photo": "https://m.media-amazon.com/images/I/71X6C9VpoNL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$89.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//        {
//         "asin": "B0CDC9VGVQ",
//         "product_title": "X1 Drone with Camera, Self-Flying Camera Drone with Follow Me Mode, Foldable Mini Drone with HDR Video Capture, Palm Takeoff, Intelligent Flight Paths, Hands-Free Control Black (Standard)",
//         "product_price": "$269.00",
//         "product_original_price": "$349.00",
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 1192,
//         "product_url": "https://www.amazon.com/dp/B0CDC9VGVQ",
//         "product_photo": "https://m.media-amazon.com/images/I/61NV8FOCy4L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$269.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": true,
//         "climate_pledge_friendly": false,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FF4M8CLW",
//         "product_title": "GPS Drone with 4K Camera for Adults, FPV RC Quadcopter, 90-min Flight Time, Auto Return, Follow Me, Circle Fly, 5-inch LCD Tablet Screen, Brushless Motor, Lightweight Foldable Drone for Beginners",
//         "product_price": "$219.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 21,
//         "product_url": "https://www.amazon.com/dp/B0FF4M8CLW",
//         "product_photo": "https://m.media-amazon.com/images/I/71DbIMrEoOL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$219.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $30.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C7GV6RRZ",
//         "product_title": "DJI Air 3 Fly More Combo with RC-N2 Remote Controller, Drone with Camera 4K, Dual Primary Cameras, 3 Batteries for Extended Flight Time, 48MP Photo, Camera Drone for Adults, FAA Remote ID Compliant",
//         "product_price": "$1,349.00",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 1597,
//         "product_url": "https://www.amazon.com/dp/B0C7GV6RRZ",
//         "product_photo": "https://m.media-amazon.com/images/I/61B0sR9ibRL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 3,
//         "product_minimum_offer_price": "$1,106.52",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 17 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Wed, Sep 17Only 17 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B0CZQKNYL5",
//         "product_title": "Mini Drone with Camera for Beginners Adults-1080P FPV Camera Foldable Drone with Stable Altitude Hold, Gestures Selfie, Waypoint Fly, Headless Mode, Auto-Follow, 3D Flip, One Key Start, 3 Speeds, 2 Batteries",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 781,
//         "product_url": "https://www.amazon.com/dp/B0CZQKNYL5",
//         "product_photo": "https://m.media-amazon.com/images/I/71zigA8aqGL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DPFW4QZQ",
//         "product_title": "Drone with Camera for Kids &amp; Adults, 1080P HD Mini FPV Drones with Altitude Hold, One-Key Take Off/Landing, Headless Mode, 360° Flips, Speed Adjustment, Toys Gifts for Boys Girls, Beginner",
//         "product_price": "$49.99",
//         "product_original_price": "$74.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 649,
//         "product_url": "https://www.amazon.com/dp/B0DPFW4QZQ",
//         "product_photo": "https://m.media-amazon.com/images/I/71MJSnObR+L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$49.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0F37MYK6N",
//         "product_title": "GPS Drone with Camera 4K, Under 249g, 45 Mins Flight, Brushless Motor, Light, Auto Follow, Tap Fly &amp; Circle Fly, One Key Start, Foldable Drone for Adults Beginners",
//         "product_price": "$119.98",
//         "product_original_price": "$199.99",
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 488,
//         "product_url": "https://www.amazon.com/dp/B0F37MYK6N",
//         "product_photo": "https://m.media-amazon.com/images/I/71T10GcaNWL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 5,
//         "product_minimum_offer_price": "$113.98",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0FBRHN2JC",
//         "product_title": "Brushless Motor Drone with Camera for Adults 4K UHD Long Range FPV Video,5G Transmission,120°FOV 90°Adjustable Lens,2Batteries,Carrying Case,Optical Positioning,Easy for Beginner,Under249G",
//         "product_price": "$99.99",
//         "product_original_price": "$199.99",
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 203,
//         "product_url": "https://www.amazon.com/dp/B0FBRHN2JC",
//         "product_photo": "https://m.media-amazon.com/images/I/71kNokmBB2L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$99.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save 20% with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B07GTCB7G7",
//         "product_title": "Mini Drone for Kids &amp; Beginners, Indoor Portable Hand Operated/RC Nano Helicopter Quadcopter with Auto Hovering, Headless Mode &amp; Remote Control, Children&#x27;s Day Gift for Boys and Girls -Blue.4-blade design delivers greater stability and increased thrust.",      
//         "product_price": "$24.63",
//         "product_original_price": "$25.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 1126,
//         "product_url": "https://www.amazon.com/dp/B07GTCB7G7",
//         "product_photo": "https://m.media-amazon.com/images/I/411v0cnrXyL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$24.63",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": null,
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0BBVZ849G",
//         "product_title": "Drone with 1080P Camera for Beginners and Adults, Foldable Remote Control Quadcopter with Voice Control, Gestures Selfie, Altitude Hold, One Key Start, 3D Flips, 2 Batteries, Toy for Beginners ClimatePartner certified",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 3662,
//         "product_url": "https://www.amazon.com/dp/B0BBVZ849G",
//         "product_photo": "https://m.media-amazon.com/images/I/71zs2B9b1eL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DHRQKHZV",
//         "product_title": "Drone with 1080P Camera for Kids, Foldable Mini Drone for Kids Boys Beginners, 2 Batteries, Toys Drone, Gestures Selfie, One Key Start, 360° Flips, Toy Gifts for Boys Black E88",
//         "product_price": "$25.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.2",
//         "product_num_ratings": 136,
//         "product_url": "https://www.amazon.com/dp/B0DHRQKHZV",
//         "product_photo": "https://m.media-amazon.com/images/I/71sGwcNWrKL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$24.69",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 12 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15Only 12 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DDGFHH7R",
//         "product_title": "Holy Stone HS600D Drone with 8K Camera for Adults, 3-Axis Gimbal, 4K/30fps Video, 48MP Image, 80-Min Flight Time with 2 Batteries,20000ft FPV Transmission Professional Drone,Auto Return,Beginner Mode Global Recycled Standard",
//         "product_price": "$499.98",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 2904,
//         "product_url": "https://www.amazon.com/dp/B0DDGFHH7R",
//         "product_photo": "https://m.media-amazon.com/images/I/61k-YkUS4GL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$499.98",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $100.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0D5CXY6X8",
//         "product_title": "Cool Mini Drone with Camera for Kids Adults Beginners, 1080P FPV Camera Remote Control Drone for Kids with 3 Batteries, One-Click Take Off/Landing, Altitude Hold, Headless Mode, 360° Flips, 3-Gear Speeds , Emergency Stop, Toys Gifts for Kids",
//         "product_price": "$29.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.7",
//         "product_num_ratings": 279,
//         "product_url": "https://www.amazon.com/dp/B0D5CXY6X8",
//         "product_photo": "https://m.media-amazon.com/images/I/71rCuVVshXL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$29.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "200+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DDPLQ3RY",
//         "product_title": "Drone with Camera, 2K HD FPV Drone with Brushless Motor, Altitude Hold, Gesture Selfie, One Key Take Off/Landing, 3D Flips, Waypoint Fly, 2 Batteries, Foldable Mini Drones for Kids and Beginners",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 810,
//         "product_url": "https://www.amazon.com/dp/B0DDPLQ3RY",
//         "product_photo": "https://m.media-amazon.com/images/I/71FebZk7hfL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "200+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FB3SBPJ7",
//         "product_title": "Bwine F7GB2 Pro Drones with Camera for Adults 4K UHD Aerial, 3-Axis Gimbal, 10000FT Control, 75 Mins Flight Time with 3 Batteries, GPS Follow, Waypoint, Orbit Fly, Auto Return, Beginner Mode",
//         "product_price": "$519.99",
//         "product_original_price": "$569.99",
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 228,
//         "product_url": "https://www.amazon.com/dp/B0FB3SBPJ7",
//         "product_photo": "https://m.media-amazon.com/images/I/71-TfzEfweL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$519.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $140.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DQ4W3BHK",
//         "product_title": "Drone with Camera 1080P HD, FPV Foldable Drone for Adults Kids, One-Key Take Off/Landing, 3D Flips, Altitude Hold, Speed Adjustment, Headless Mode, 2 Batteries, Toys Gifts for Boys Girls",
//         "product_price": "$44.97",
//         "product_original_price": "$74.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 582,
//         "product_url": "https://www.amazon.com/dp/B0DQ4W3BHK",
//         "product_photo": "https://m.media-amazon.com/images/I/712HtmNSknL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$44.97",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0BFWS4N4T",
//         "product_title": "Potensic ATOM SE GPS Drone with 4K EIS Camera, Under 249g, 62 Mins Flight, 4KM FPV Transmission, Brushless Motor, Max Speed 16m/s, Auto Return, Lightweight and Foldable Drone for Adults Beginner",
//         "product_price": "$249.99",
//         "product_original_price": "$299.99",
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 6052,
//         "product_url": "https://www.amazon.com/dp/B0BFWS4N4T",
//         "product_photo": "https://m.media-amazon.com/images/I/61fbYPFOoSL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 4,
//         "product_minimum_offer_price": "$234.13",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Sep 19 - 21Or fastest delivery Thu, Sep 18",
//         "has_variations": false
//       },
//       {
//         "asin": "B07P62LD88",
//         "product_title": "Holy Stone Mini Drone for Kids and Beginners, Indoor Outdoor Quadcopter Plane for Boys Girls with Auto Hover, 3D Flips, 3 Batteries, Headless Mode, Great Gift Toy for Boys and Girls, HS210 Green Global Recycled Standard ClimatePartner certified",
//         "product_price": "$39.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 763,
//         "product_url": "https://www.amazon.com/dp/B07P62LD88",
//         "product_photo": "https://m.media-amazon.com/images/I/71-4Uuh5t5L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$39.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save 15% with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FDX99KSC",
//         "product_title": "RC Drone with Screen Display Remote Control, 1080P Dual Camera, Speed Adjustment, Altitude Hold, One-Key Takeoff, 3D Flips, 2 Batteries, Toy for Boys Girls, Hovering, Brushless Motor, APP Control, LED Lights, for Kids 8-12 and Adult Beginners FPV Quadcopter Plane Copter (Grey)",
//         "product_price": "$59.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "5",
//         "product_num_ratings": 3,
//         "product_url": "https://www.amazon.com/dp/B0FDX99KSC",
//         "product_photo": "https://m.media-amazon.com/images/I/61yrtEpquEL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$59.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 15 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": null,
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15Only 15 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B07VCD1SRL",
//         "product_title": "Ruko F11PRO Drones with Camera for Adults 4K UHD Camera, 60 Mins Flight Time with GPS Auto Return Home, Brushless Motor, Black (with Carrying Case) Global Recycled Standard",
//         "product_price": "$299.99",
//         "product_original_price": "$379.99",
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 8890,
//         "product_url": "https://www.amazon.com/dp/B07VCD1SRL",
//         "product_photo": "https://m.media-amazon.com/images/I/71zGJQ+8gkL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$246.05",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DKHCZHCY",
//         "product_title": "Potensic Atom 2 Drone with Camera for Adults 4K Video, 8K Photo, Under 249g, 3-Axis Gimbal, 10KM Transmission, AI Track, Vertical Shooting, AI Night Shot, QuickShots, Fly More Combo (96-Min Flight)",
//         "product_price": "$479.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 898,
//         "product_url": "https://www.amazon.com/dp/B0DKHCZHCY",
//         "product_photo": "https://m.media-amazon.com/images/I/61zZQXnT4RL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$479.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "1K+ bought in past month",
//         "delivery": "FREE delivery Sep 23 - Oct 2Or fastest delivery Sep 22 - 29",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C1HL632R",
//         "product_title": "DJI Mini 3 Camera Drone Quadcopter with RC Smart Remote Controller (With Screen), 4K Video, 38min Flight Time, True Vertical Shooting, Intelligent Modes Bundle with Deco Gear Backpack + Accessories",
//         "product_price": "$849.00",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 362,
//         "product_url": "https://www.amazon.com/dp/B0C1HL632R",
//         "product_photo": "https://m.media-amazon.com/images/I/81tDvUJxztL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$849.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Sep 17 - 19Or fastest delivery Tue, Sep 16",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C1N7Z2ND",
//         "product_title": "Holy Stone GPS Drone with 4K UHD Camera for Adults Beginner; HS360S 249g Foldable FPV RC Quadcopter with 10000 Feet Control Range, Brushless Motor, Follow Me, Smart Return Home, 5G Transmission Global Recycled Standard ClimatePartner certified",
//         "product_price": "$199.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.8",
//         "product_num_ratings": 1270,
//         "product_url": "https://www.amazon.com/dp/B0C1N7Z2ND",
//         "product_photo": "https://m.media-amazon.com/images/I/61vufzhhQ6L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$199.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "400+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $10.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DY4LQT26",
//         "product_title": "Holy Stone HS360D GPS Drones With 4K Camera For Adults, 249g RC Quadcopter with 80-Min Flight Time, 20000ft Range FPV Transmission Beginner Drone, Auto Return, 2 Batteries, Upgraded HS360S Global Recycled Standard",
//         "product_price": "$249.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 4,
//         "product_url": "https://www.amazon.com/dp/B0DY4LQT26",
//         "product_photo": "https://m.media-amazon.com/images/I/71pcg8iyqZL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$245.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $50.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0CF8NXJ57",
//         "product_title": "Potensic ATOM 3-Axis Gimbal 4K GPS Drone, Under 249g, 96 Mins Flight, Max 6KM Transmission, Visual Tracking, 4K/30FPS QuickShots, Lightweight for Adults and Beginners, Fly More Combo",
//         "product_price": "$319.99",
//         "product_original_price": "$359.99",
//         "currency": "USD",
//         "product_star_rating": "4.6",
//         "product_num_ratings": 3513,
//         "product_url": "https://www.amazon.com/dp/B0CF8NXJ57",
//         "product_photo": "https://m.media-amazon.com/images/I/61jRqC2QCpL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$319.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 8 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "400+ bought in past month",
//         "delivery": "FREE delivery Sep 23 - 30Or fastest delivery Sep 23 - 27Only 8 left in stock - order soon.",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0F9NQ6GPK",
//         "product_title": "Drones for Kids With Cool Light, Kids Drone with 3D Flip, Altitude-Hold, Self-Rotation, Headless Mode, 3 Speed Modes, One-Click Take-off/Landing, Mini Drone for Christmas, Beginners, Indoor",
//         "product_price": "$29.99",
//         "product_original_price": "$49.99",
//         "currency": "USD",
//         "product_star_rating": "4.9",
//         "product_num_ratings": 282,
//         "product_url": "https://www.amazon.com/dp/B0F9NQ6GPK",
//         "product_photo": "https://m.media-amazon.com/images/I/71oZcQZGCFL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$29.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "1K+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tue, Sep 16",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DT9H745X",
//         "product_title": "Drone with Camera 1080P HD FPV Foldable Mini Drone for Beginners Kids Adults, Drone with One Key Take Off/Landing, Gesture Selfie, Altitude Hold, 3D Flip, Easy to Fly, 2 Batteries, Toys for Boys Girls",
//         "product_price": "$39.99",
//         "product_original_price": "$71.99",
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 223,
//         "product_url": "https://www.amazon.com/dp/B0DT9H745X",
//         "product_photo": "https://m.media-amazon.com/images/I/717YnaXhiFL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$39.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//     ];
//     try {
//       // const response = await axios.request(options);
//       // const products = response.data?.data?.products || [];
//       const products =pro;

//       const validProducts = products
//         .map((product, index) => {
//           const priceValue = parseFloat(product.product_price?.replace('$', '') || '0');
          
//           const productData = {
//             id: product.asin || `amazon_${index}_${Date.now()}`,
//             title: product.product_title || 'No title',
//             price: product.product_price ? `${product.product_price} USD` : 'السعر غير متوفر',
//             priceValue: priceValue,
//             image: product.product_photo || '',
//             url: product.product_url || `https://www.amazon.com/dp/${product.asin}`,
//             rating: product.product_star_rating || '',
//             orders: product.is_best_seller ? 'الأكثر مبيعاً' : '',
//             store: 'Amazon',
//             shipping: product.is_prime ? 'Prime شحن مجاني' : 'رسوم شحن',
//             source: 'amazon',
//             commission_rate: 0.05,
//             original_price: product.product_original_price || '',
//             discount: product.product_discount || ''
//           };

//           let affiliateLink = productData.url;
//           if (process.env.AMAZON_AFFILIATE_TAG) {
//             affiliateLink = generateAmazonAffiliateLink(productData.url, process.env.AMAZON_AFFILIATE_TAG);
//           }

//           const isValid = productData.title !== 'No title' && productData.price !== 'السعر غير متوفر';
//           return isValid ? { ...productData, affiliate_link: affiliateLink } : null;
//         })
//         .filter(Boolean);
// console.log(`Raw amazon products count: ${products.length}`);
//       return validProducts;

//     } catch (error) {
//       console.error('Amazon API Error:', error.message);
//       return [];
//     }
//   }



//   //دالة لاستخراج نص/براند من الصورة

// const credentials = JSON.parse(process.env.GOOGLE_VISION_KEY); // ضع محتوى JSON كامل هنا
// const visionClient = new vision.ImageAnnotatorClient({ credentials });
// function cleanText(text) {
//   return text
//     .replace(/[\\\/:]/g, '')            // إزالة الرموز غير الضرورية
//     .replace(/\s+/g, ' ')               // دمج الفراغات المتعددة
//     .trim()
//     .split(' ')
//     .filter(word => !['WARNING', 'OCE'].includes(word.toUpperCase())) // تجاهل الكلمات غير المفيدة
//     .join(' ');
// }
// async function extractProductQueryFromImage(imagePath) {
//   try {
//     // OCR: قراءة النصوص
//     const [textResult] = await visionClient.textDetection(imagePath);
//     const texts = (textResult.textAnnotations || []).map(t => t.description.trim()).filter(Boolean);

//     // Logo Detection: الشعارات
//     const [logoResult] = await visionClient.logoDetection(imagePath);
//     const logos = (logoResult.logoAnnotations || []).map(l => l.description.trim()).filter(Boolean);

//     // اختيار أفضل كلمة بحث
//     let query = '';
//     if (logos.length > 0) {
//       query = cleanText(logos[0]);
//     } else if (texts.length > 0) {
//       query = cleanText(texts[0]);
//     } else {
//       query = 'product'; // fallback
//     }
 
   


//  const intentPrompt = `
//     هل النص التالي يدل على أن المستخدم يبحث عن منتج؟ أجب فقط بكلمة واحدة: "search" أو "chat".
//     النص: "${query}"
//     `;

//     const intentModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//     const intentResult = await intentModel.generateContent(intentPrompt);
//     const intent = intentResult.response.text().trim().toLowerCase();
//     console.log('is search');
//       const keywordPrompt = `
// المستخدم كتب وصفًا لمنتج يريده. استخرج منه استعلامًا دقيقًا باللغة الإنجليزية يصلح للبحث في Amazon، بحيث يكون مطابقًا قدر الإمكان لعناوين المنتجات الفعلية.

// - استخدم تنسيق مثل: "Apple iPhone 13 512GB Silver Unlocked"
// - لا تستخدم عبارات عامة مثل "maximum storage" أو "largest capacity"
// - إذا لم يذكر المستخدم السعة، استنتجها فقط إذا كانت واضحة من السياق
// - لا تضف كلمات مثل "cheap", "replica", "used" إلا إذا وردت صراحة

// وصف المستخدم:
// "${query}"
//       `;
//       const keywordResult = await intentModel.generateContent(keywordPrompt);
//       const keywords = keywordResult.response.text().trim();





   


//     return keywords;
//   } catch (err) {
//     console.error('Vision API error:', err.message);
//     return null;
//   }
// }

//   // ========== ALIEXPRESS FUNCTIONS ==========
  




//   function generateAliExpressAffiliateLink(productUrl, affiliateId) {
//     try {
//       let url = productUrl;
      
//       if (!url.includes('aliexpress.com/item/')) {
//         const itemIdMatch = url.match(/(\d+)\.html/);
//         if (itemIdMatch && itemIdMatch[1]) {
//           url = `https://www.aliexpress.com/item/${itemIdMatch[1]}.html`;
//         }
//       }
      
//       return `https://www.aliexpress.com/item/${getItemIdFromUrl(url)}.html?aff_platform=${affiliateId}`;
      
//     } catch (error) {
//       console.error('Error generating AliExpress affiliate link:', error);
//       return productUrl;
//     }
//   }

//   function getItemIdFromUrl(url) {
//     try {
//       const patterns = [
//         /aliexpress\.com\/item\/(\d+)\.html/,
//         /\/item\/(\d+)\.html/,
//         /(\d+)\.html$/
//       ];
      
//       for (const pattern of patterns) {
//         const match = url.match(pattern);
//         if (match && match[1]) {
//           return match[1];
//         }
//       }
      
//       return url.split('/').pop().replace('.html', '');
//     } catch (error) {
//       return '100000000';
//     }
//   }

//   async function searchAliExpressProducts(query) {
//     if (!query || query.trim().length === 0) {
//       return [];
//     }

//     const cleanQuery = query.replace(/[^\w\u0600-\u06FF\s]/gi, '').trim();
//     let translatedQuery = cleanQuery;
    
//     try {
//       if (/^[\u0600-\u06FF]/.test(cleanQuery)) {
//         translatedQuery = await translateToEnglish(cleanQuery);
//       }
//     } catch (translationError) {
//       translatedQuery = cleanQuery;
//     }

//     // const options = {
//     //   method: 'GET',
//     //   url: 'https://aliexpress-business-api.p.rapidapi.com/textsearch.php',
//     //   params: {
//     //     keyWord: translatedQuery,
//     //     pageSize: '10',
//     //     pageIndex: '1',
//     //     country: 'US',
//     //     currency: 'USD',
//     //     lang: 'en',
//     //     filter: 'orders',
//     //     sortBy: 'desc'
//     //   },
//     //   headers: {
//     //     'x-rapidapi-key': process.env.RAPIDAPI_KEY,
//     //     'x-rapidapi-host': 'aliexpress-business-api.p.rapidapi.com'
//     //   },
//     //   timeout: 10000
//     // };
//   const pro=[
//         {
//         "asin": "B0FF38Z3KQ",
//         "product_title": "Digital Display Drones with Camera for Adults 4k Brushless Motor Drone for Beginners Kids with 2 Batteries Foldable FPV RC Quadcopter Gift Toys for Mens Boys under249g",
//         "product_price": "$89.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 24,
//         "product_url": "https://www.amazon.com/dp/B0FF38Z3KQ",
//         "product_photo": "https://m.media-amazon.com/images/I/71X6C9VpoNL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$89.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//        {
//         "asin": "B0CDC9VGVQ",
//         "product_title": "X1 Drone with Camera, Self-Flying Camera Drone with Follow Me Mode, Foldable Mini Drone with HDR Video Capture, Palm Takeoff, Intelligent Flight Paths, Hands-Free Control Black (Standard)",
//         "product_price": "$269.00",
//         "product_original_price": "$349.00",
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 1192,
//         "product_url": "https://www.amazon.com/dp/B0CDC9VGVQ",
//         "product_photo": "https://m.media-amazon.com/images/I/61NV8FOCy4L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$269.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": true,
//         "climate_pledge_friendly": false,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FF4M8CLW",
//         "product_title": "GPS Drone with 4K Camera for Adults, FPV RC Quadcopter, 90-min Flight Time, Auto Return, Follow Me, Circle Fly, 5-inch LCD Tablet Screen, Brushless Motor, Lightweight Foldable Drone for Beginners",
//         "product_price": "$219.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 21,
//         "product_url": "https://www.amazon.com/dp/B0FF4M8CLW",
//         "product_photo": "https://m.media-amazon.com/images/I/71DbIMrEoOL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$219.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $30.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C7GV6RRZ",
//         "product_title": "DJI Air 3 Fly More Combo with RC-N2 Remote Controller, Drone with Camera 4K, Dual Primary Cameras, 3 Batteries for Extended Flight Time, 48MP Photo, Camera Drone for Adults, FAA Remote ID Compliant",
//         "product_price": "$1,349.00",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 1597,
//         "product_url": "https://www.amazon.com/dp/B0C7GV6RRZ",
//         "product_photo": "https://m.media-amazon.com/images/I/61B0sR9ibRL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 3,
//         "product_minimum_offer_price": "$1,106.52",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 17 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Wed, Sep 17Only 17 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B0CZQKNYL5",
//         "product_title": "Mini Drone with Camera for Beginners Adults-1080P FPV Camera Foldable Drone with Stable Altitude Hold, Gestures Selfie, Waypoint Fly, Headless Mode, Auto-Follow, 3D Flip, One Key Start, 3 Speeds, 2 Batteries",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 781,
//         "product_url": "https://www.amazon.com/dp/B0CZQKNYL5",
//         "product_photo": "https://m.media-amazon.com/images/I/71zigA8aqGL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DPFW4QZQ",
//         "product_title": "Drone with Camera for Kids &amp; Adults, 1080P HD Mini FPV Drones with Altitude Hold, One-Key Take Off/Landing, Headless Mode, 360° Flips, Speed Adjustment, Toys Gifts for Boys Girls, Beginner",
//         "product_price": "$49.99",
//         "product_original_price": "$74.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 649,
//         "product_url": "https://www.amazon.com/dp/B0DPFW4QZQ",
//         "product_photo": "https://m.media-amazon.com/images/I/71MJSnObR+L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$49.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0F37MYK6N",
//         "product_title": "GPS Drone with Camera 4K, Under 249g, 45 Mins Flight, Brushless Motor, Light, Auto Follow, Tap Fly &amp; Circle Fly, One Key Start, Foldable Drone for Adults Beginners",
//         "product_price": "$119.98",
//         "product_original_price": "$199.99",
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 488,
//         "product_url": "https://www.amazon.com/dp/B0F37MYK6N",
//         "product_photo": "https://m.media-amazon.com/images/I/71T10GcaNWL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 5,
//         "product_minimum_offer_price": "$113.98",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0FBRHN2JC",
//         "product_title": "Brushless Motor Drone with Camera for Adults 4K UHD Long Range FPV Video,5G Transmission,120°FOV 90°Adjustable Lens,2Batteries,Carrying Case,Optical Positioning,Easy for Beginner,Under249G",
//         "product_price": "$99.99",
//         "product_original_price": "$199.99",
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 203,
//         "product_url": "https://www.amazon.com/dp/B0FBRHN2JC",
//         "product_photo": "https://m.media-amazon.com/images/I/71kNokmBB2L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$99.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save 20% with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B07GTCB7G7",
//         "product_title": "Mini Drone for Kids &amp; Beginners, Indoor Portable Hand Operated/RC Nano Helicopter Quadcopter with Auto Hovering, Headless Mode &amp; Remote Control, Children&#x27;s Day Gift for Boys and Girls -Blue.4-blade design delivers greater stability and increased thrust.",      
//         "product_price": "$24.63",
//         "product_original_price": "$25.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 1126,
//         "product_url": "https://www.amazon.com/dp/B07GTCB7G7",
//         "product_photo": "https://m.media-amazon.com/images/I/411v0cnrXyL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$24.63",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": null,
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0BBVZ849G",
//         "product_title": "Drone with 1080P Camera for Beginners and Adults, Foldable Remote Control Quadcopter with Voice Control, Gestures Selfie, Altitude Hold, One Key Start, 3D Flips, 2 Batteries, Toy for Beginners ClimatePartner certified",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 3662,
//         "product_url": "https://www.amazon.com/dp/B0BBVZ849G",
//         "product_photo": "https://m.media-amazon.com/images/I/71zs2B9b1eL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DHRQKHZV",
//         "product_title": "Drone with 1080P Camera for Kids, Foldable Mini Drone for Kids Boys Beginners, 2 Batteries, Toys Drone, Gestures Selfie, One Key Start, 360° Flips, Toy Gifts for Boys Black E88",
//         "product_price": "$25.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.2",
//         "product_num_ratings": 136,
//         "product_url": "https://www.amazon.com/dp/B0DHRQKHZV",
//         "product_photo": "https://m.media-amazon.com/images/I/71sGwcNWrKL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$24.69",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 12 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15Only 12 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DDGFHH7R",
//         "product_title": "Holy Stone HS600D Drone with 8K Camera for Adults, 3-Axis Gimbal, 4K/30fps Video, 48MP Image, 80-Min Flight Time with 2 Batteries,20000ft FPV Transmission Professional Drone,Auto Return,Beginner Mode Global Recycled Standard",
//         "product_price": "$499.98",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 2904,
//         "product_url": "https://www.amazon.com/dp/B0DDGFHH7R",
//         "product_photo": "https://m.media-amazon.com/images/I/61k-YkUS4GL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$499.98",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $100.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0D5CXY6X8",
//         "product_title": "Cool Mini Drone with Camera for Kids Adults Beginners, 1080P FPV Camera Remote Control Drone for Kids with 3 Batteries, One-Click Take Off/Landing, Altitude Hold, Headless Mode, 360° Flips, 3-Gear Speeds , Emergency Stop, Toys Gifts for Kids",
//         "product_price": "$29.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.7",
//         "product_num_ratings": 279,
//         "product_url": "https://www.amazon.com/dp/B0D5CXY6X8",
//         "product_photo": "https://m.media-amazon.com/images/I/71rCuVVshXL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$29.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "200+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19 on $35 of items shipped by AmazonOr fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DDPLQ3RY",
//         "product_title": "Drone with Camera, 2K HD FPV Drone with Brushless Motor, Altitude Hold, Gesture Selfie, One Key Take Off/Landing, 3D Flips, Waypoint Fly, 2 Batteries, Foldable Mini Drones for Kids and Beginners",
//         "product_price": "$79.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 810,
//         "product_url": "https://www.amazon.com/dp/B0DDPLQ3RY",
//         "product_photo": "https://m.media-amazon.com/images/I/71FebZk7hfL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$79.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "200+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FB3SBPJ7",
//         "product_title": "Bwine F7GB2 Pro Drones with Camera for Adults 4K UHD Aerial, 3-Axis Gimbal, 10000FT Control, 75 Mins Flight Time with 3 Batteries, GPS Follow, Waypoint, Orbit Fly, Auto Return, Beginner Mode",
//         "product_price": "$519.99",
//         "product_original_price": "$569.99",
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 228,
//         "product_url": "https://www.amazon.com/dp/B0FB3SBPJ7",
//         "product_photo": "https://m.media-amazon.com/images/I/71-TfzEfweL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$519.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $140.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DQ4W3BHK",
//         "product_title": "Drone with Camera 1080P HD, FPV Foldable Drone for Adults Kids, One-Key Take Off/Landing, 3D Flips, Altitude Hold, Speed Adjustment, Headless Mode, 2 Batteries, Toys Gifts for Boys Girls",
//         "product_price": "$44.97",
//         "product_original_price": "$74.99",
//         "currency": "USD",
//         "product_star_rating": "4",
//         "product_num_ratings": 582,
//         "product_url": "https://www.amazon.com/dp/B0DQ4W3BHK",
//         "product_photo": "https://m.media-amazon.com/images/I/712HtmNSknL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$44.97",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0BFWS4N4T",
//         "product_title": "Potensic ATOM SE GPS Drone with 4K EIS Camera, Under 249g, 62 Mins Flight, 4KM FPV Transmission, Brushless Motor, Max Speed 16m/s, Auto Return, Lightweight and Foldable Drone for Adults Beginner",
//         "product_price": "$249.99",
//         "product_original_price": "$299.99",
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 6052,
//         "product_url": "https://www.amazon.com/dp/B0BFWS4N4T",
//         "product_photo": "https://m.media-amazon.com/images/I/61fbYPFOoSL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 4,
//         "product_minimum_offer_price": "$234.13",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "500+ bought in past month",
//         "delivery": "FREE delivery Sep 19 - 21Or fastest delivery Thu, Sep 18",
//         "has_variations": false
//       },
//       {
//         "asin": "B07P62LD88",
//         "product_title": "Holy Stone Mini Drone for Kids and Beginners, Indoor Outdoor Quadcopter Plane for Boys Girls with Auto Hover, 3D Flips, 3 Batteries, Headless Mode, Great Gift Toy for Boys and Girls, HS210 Green Global Recycled Standard ClimatePartner certified",
//         "product_price": "$39.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.1",
//         "product_num_ratings": 763,
//         "product_url": "https://www.amazon.com/dp/B07P62LD88",
//         "product_photo": "https://m.media-amazon.com/images/I/71-4Uuh5t5L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$39.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save 15% with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0FDX99KSC",
//         "product_title": "RC Drone with Screen Display Remote Control, 1080P Dual Camera, Speed Adjustment, Altitude Hold, One-Key Takeoff, 3D Flips, 2 Batteries, Toy for Boys Girls, Hovering, Brushless Motor, APP Control, LED Lights, for Kids 8-12 and Adult Beginners FPV Quadcopter Plane Copter (Grey)",
//         "product_price": "$59.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "5",
//         "product_num_ratings": 3,
//         "product_url": "https://www.amazon.com/dp/B0FDX99KSC",
//         "product_photo": "https://m.media-amazon.com/images/I/61yrtEpquEL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$59.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 15 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": null,
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15Only 15 left in stock - order soon.",
//         "has_variations": false
//       },
//       {
//         "asin": "B07VCD1SRL",
//         "product_title": "Ruko F11PRO Drones with Camera for Adults 4K UHD Camera, 60 Mins Flight Time with GPS Auto Return Home, Brushless Motor, Black (with Carrying Case) Global Recycled Standard",
//         "product_price": "$299.99",
//         "product_original_price": "$379.99",
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 8890,
//         "product_url": "https://www.amazon.com/dp/B07VCD1SRL",
//         "product_photo": "https://m.media-amazon.com/images/I/71zGJQ+8gkL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$246.05",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DKHCZHCY",
//         "product_title": "Potensic Atom 2 Drone with Camera for Adults 4K Video, 8K Photo, Under 249g, 3-Axis Gimbal, 10KM Transmission, AI Track, Vertical Shooting, AI Night Shot, QuickShots, Fly More Combo (96-Min Flight)",
//         "product_price": "$479.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.5",
//         "product_num_ratings": 898,
//         "product_url": "https://www.amazon.com/dp/B0DKHCZHCY",
//         "product_photo": "https://m.media-amazon.com/images/I/61zZQXnT4RL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$479.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "1K+ bought in past month",
//         "delivery": "FREE delivery Sep 23 - Oct 2Or fastest delivery Sep 22 - 29",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C1HL632R",
//         "product_title": "DJI Mini 3 Camera Drone Quadcopter with RC Smart Remote Controller (With Screen), 4K Video, 38min Flight Time, True Vertical Shooting, Intelligent Modes Bundle with Deco Gear Backpack + Accessories",
//         "product_price": "$849.00",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.4",
//         "product_num_ratings": 362,
//         "product_url": "https://www.amazon.com/dp/B0C1HL632R",
//         "product_photo": "https://m.media-amazon.com/images/I/81tDvUJxztL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$849.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "100+ bought in past month",
//         "delivery": "FREE delivery Sep 17 - 19Or fastest delivery Tue, Sep 16",
//         "has_variations": false
//       },
//       {
//         "asin": "B0C1N7Z2ND",
//         "product_title": "Holy Stone GPS Drone with 4K UHD Camera for Adults Beginner; HS360S 249g Foldable FPV RC Quadcopter with 10000 Feet Control Range, Brushless Motor, Follow Me, Smart Return Home, 5G Transmission Global Recycled Standard ClimatePartner certified",
//         "product_price": "$199.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "3.8",
//         "product_num_ratings": 1270,
//         "product_url": "https://www.amazon.com/dp/B0C1N7Z2ND",
//         "product_photo": "https://m.media-amazon.com/images/I/61vufzhhQ6L._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$199.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "400+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $10.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DY4LQT26",
//         "product_title": "Holy Stone HS360D GPS Drones With 4K Camera For Adults, 249g RC Quadcopter with 80-Min Flight Time, 20000ft Range FPV Transmission Beginner Drone, Auto Return, 2 Batteries, Upgraded HS360S Global Recycled Standard",
//         "product_price": "$249.99",
//         "product_original_price": null,
//         "currency": "USD",
//         "product_star_rating": "4.2",
//         "product_num_ratings": 4,
//         "product_url": "https://www.amazon.com/dp/B0DY4LQT26",
//         "product_photo": "https://m.media-amazon.com/images/I/71pcg8iyqZL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 2,
//         "product_minimum_offer_price": "$245.00",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": true,
//         "sales_volume": "50+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "coupon_text": "Save $50.00 with coupon",
//         "has_variations": false
//       },
//       {
//         "asin": "B0CF8NXJ57",
//         "product_title": "Potensic ATOM 3-Axis Gimbal 4K GPS Drone, Under 249g, 96 Mins Flight, Max 6KM Transmission, Visual Tracking, 4K/30FPS QuickShots, Lightweight for Adults and Beginners, Fly More Combo",
//         "product_price": "$319.99",
//         "product_original_price": "$359.99",
//         "currency": "USD",
//         "product_star_rating": "4.6",
//         "product_num_ratings": 3513,
//         "product_url": "https://www.amazon.com/dp/B0CF8NXJ57",
//         "product_photo": "https://m.media-amazon.com/images/I/61jRqC2QCpL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$319.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "product_availability": "Only 8 left in stock - order soon.",
//         "climate_pledge_friendly": false,
//         "sales_volume": "400+ bought in past month",
//         "delivery": "FREE delivery Sep 23 - 30Or fastest delivery Sep 23 - 27Only 8 left in stock - order soon.",
//         "has_variations": false,
//         "product_badge": "Limited time deal"
//       },
//       {
//         "asin": "B0F9NQ6GPK",
//         "product_title": "Drones for Kids With Cool Light, Kids Drone with 3D Flip, Altitude-Hold, Self-Rotation, Headless Mode, 3 Speed Modes, One-Click Take-off/Landing, Mini Drone for Christmas, Beginners, Indoor",
//         "product_price": "$29.99",
//         "product_original_price": "$49.99",
//         "currency": "USD",
//         "product_star_rating": "4.9",
//         "product_num_ratings": 282,
//         "product_url": "https://www.amazon.com/dp/B0F9NQ6GPK",
//         "product_photo": "https://m.media-amazon.com/images/I/71oZcQZGCFL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$29.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "1K+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tue, Sep 16",
//         "has_variations": false
//       },
//       {
//         "asin": "B0DT9H745X",
//         "product_title": "Drone with Camera 1080P HD FPV Foldable Mini Drone for Beginners Kids Adults, Drone with One Key Take Off/Landing, Gesture Selfie, Altitude Hold, 3D Flip, Easy to Fly, 2 Batteries, Toys for Boys Girls",
//         "product_price": "$39.99",
//         "product_original_price": "$71.99",
//         "currency": "USD",
//         "product_star_rating": "4.3",
//         "product_num_ratings": 223,
//         "product_url": "https://www.amazon.com/dp/B0DT9H745X",
//         "product_photo": "https://m.media-amazon.com/images/I/717YnaXhiFL._AC_UL960_FMwebp_QL65_.jpg",
//         "product_num_offers": 1,
//         "product_minimum_offer_price": "$39.99",
//         "is_best_seller": false,
//         "is_amazon_choice": false,
//         "is_prime": false,
//         "climate_pledge_friendly": false,
//         "sales_volume": "300+ bought in past month",
//         "delivery": "FREE delivery Fri, Sep 19Or fastest delivery Tomorrow, Sep 15",
//         "has_variations": false
//       },
//     ];
//     try {
//       // const response = await axios.request(options);
      
//       // const products = response.data?.data?.itemList || [];
//       const products =pro;
//       console.log(`Raw AliExpress products count: ${products.length}`);
      
//       const validProducts = products
//         .map((product) => {
//           try {
//             let price = product.salePriceFormat || `$${product.targetSalePrice}`;
//             let priceValue = parseFloat(product.targetSalePrice || '0');
//             let originalPrice = product.targetOriginalPrice ? `$${product.targetOriginalPrice}` : '';
            
//             if (product.originMinPrice && typeof product.originMinPrice === 'string') {
//               try {
//                 const priceData = JSON.parse(product.originMinPrice);
//                 price = priceData.formatPrice || price;
//                 priceValue = parseFloat(priceData.minPrice || '0');
//               } catch (e) {
//                 console.log('Cannot parse originMinPrice, using fallback');
//               }
//             }
            
//             let rating = '';
//             if (product.evaluateRate) {
//               const ratingPercent = parseFloat(product.evaluateRate);
//               rating = (ratingPercent / 20).toFixed(1);
//             } else if (product.score) {
//               rating = product.score;
//             }
            
//             const productData = {
//               id: product.itemId || `aliexpress_${Date.now()}`,
//               title: product.title || 'No title',
//               price: price,
//               priceValue: priceValue,
//               image: product.itemMainPic || '',
//               url: `https://www.aliexpress.com/item/${product.itemId}.html`,
//               rating: rating,
//               orders: product.orders || '0',
//               store: 'AliExpress',
//               shipping: 'شحن مجاني',
//               source: 'aliexpress',
//               commission_rate: 0.08,
//               original_price: originalPrice,
//               discount: product.discount || ''
//             };

//             let affiliateLink = productData.url;
//             if (process.env.ALIEXPRESS_AFFILIATE_ID) {
//               affiliateLink = generateAliExpressAffiliateLink(productData.url, process.env.ALIEXPRESS_AFFILIATE_ID);
//             }

//             const isValid = productData.title !== 'No title' && productData.price !== '$0';
//             return isValid ? { ...productData, affiliate_link: affiliateLink } : null;
//           } catch (productError) {
//             console.error('Error processing AliExpress product:', productError);
//             return null;
//           }
//         })
//         .filter(Boolean);

//       console.log(`Found ${validProducts.length} valid AliExpress products`);
//       return validProducts;

//     } catch (error) {
//       console.error('AliExpress API Error:', error.response?.data || error.message);
//       return [];
//     }
//   }




//   // ========== دوال إدارة سلة المشتريات (مع دعم التخزين المحلي) ==========


// //   async function launchBrowser() {
// //   return await puppeteer.launch({
// //     headless: true,
// //     executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
// //     args: [
// //       '--ignore-certificate-errors',
// //       '--no-sandbox',
// //       '--disable-setuid-sandbox',
// //       '--disable-blink-features=AutomationControlled',
// //       '--lang=en-US,en',
// //       '--window-size=1920,1080'
// //     ]
// //   });
// // }
// // async function searchAmazonProducts(query, browser) {
// //   const page = await browser.newPage();
// //   await page.setDefaultTimeout(90000);

// //   await page.goto('https://www.amazon.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
// //   await page.waitForSelector('#twotabsearchtextbox');
// //   await page.type('#twotabsearchtextbox', query);
// //   await page.click('#nav-search-submit-button');
// //   await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 90000 });

// //   const productLinks = await page.$$eval('a[href*="/dp/"]', links =>
// //     links.map(a => a.href).filter((href, i, arr) => href.includes('/dp/') && arr.indexOf(href) === i)
// //   );

// //   const results = [];

// //   for (const link of productLinks.slice(0, 10)) {
// //     const productPage = await browser.newPage();
// //     try {
// //       await productPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 90000 });
// //       await productPage.waitForSelector('#productTitle', { timeout: 10000 });

// //       const title = await productPage.$eval('#productTitle', el => el.innerText.trim());
// //       const price = await productPage.$eval('#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen', el => el.innerText.trim()).catch(() => null);
// //       const rating = await productPage.$eval('.a-icon-alt', el => el.innerText.trim()).catch(() => null);
// //       const orders = await productPage.$eval('#acrCustomerReviewText', el => el.innerText.trim()).catch(() => null);
// //       const image = await productPage.$eval('#imgTagWrapperId img, #landingImage', el => el.src).catch(() => null);

// //       results.push({ store: 'Amazon', title, price, rating, orders, image, url: link, id: link.split('/dp/')[1]?.split('/')[0] });
// //     } catch (err) {
// //       console.error(`❌ Amazon error: ${err.message}`);
// //     }
// //     await productPage.close();
// //   }

// //   await page.close();
// //   return results;
// // }
// // async function searchAliExpressProducts(query,browser) {


// //   const page = await browser.newPage();
// //   await page.setDefaultTimeout(90000); // توسيع المهلة لجميع العمليات

// //   const searchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
// //   await page.goto(searchUrl, {
// //     waitUntil: 'domcontentloaded',
// //     timeout: 90000
// //   });

// //   // انتظار ظهور روابط المنتجات بدلًا من عناصر غير مستقرة
// //   await page.waitForSelector('a[href*="/item/"]', { timeout: 90000 });

// //   // استخراج بيانات المنتجات من الروابط
// //   const products = await page.$$eval('a[href*="/item/"]', items =>
// //     items.slice(0, 10).map(item => {
// //       const title =
// //         item.querySelector('.manhattan--titleText--WccSjUS')?.innerText ||
// //         item.querySelector('h1, h2')?.innerText;
// //       const price =
// //         item.querySelector('.manhattan--price-sale--1CCSZfK')?.innerText ||
// //         item.querySelector('.price')?.innerText;
// //       const image = item.querySelector('img')?.src;
// //       const url = item.href;

// //       return {
// //         store: 'AliExpress',
// //         title: title?.trim() || 'غير متوفر',
// //         price: price?.trim() || 'غير متوفر',
// //         image,
// //         url,
// //         id: url?.match(/\/item\/(\d+)/)?.[1] || Math.random().toString(36).substring(7)
// //       };
// //     })
// //   );

// //   await page.close(); // ✅ أغلق الصفحة فقط
// //   return products;
// // }

// // async function searchNoonProducts(query,browser) {


// //   const page = await browser.newPage();
// //   await page.setDefaultTimeout(90000); // توسيع المهلة لجميع العمليات

// //   const searchUrl = `https://www.noon.com/saudi-en/search/?q=${encodeURIComponent(query)}`;
// //   await page.goto(searchUrl, {
// //     waitUntil: 'domcontentloaded',
// //     timeout: 90000
// //   });

// //   // استخدام waitForSelector بدل waitForFunction لتقليل الأخطاء
// //   await page.waitForSelector('a[href*="/p/"]', { timeout: 90000 });

// //   // استخراج بيانات المنتجات من الروابط
// //   const products = await page.$$eval('a[href*="/p/"]', items =>
// //     items.slice(0, 10).map(item => {
// //       const title = item.querySelector('[data-qa="product-name"], h2, .title')?.innerText;
// //       const price = item.querySelector('[data-qa="price"], .price')?.innerText;
// //       const image = item.querySelector('img')?.src;
// //       const url = item.href;
// //       const rating = item.querySelector('[data-qa="rating-stars"]')?.getAttribute('aria-label');

// //       return {
// //         store: 'Noon',
// //         title: title?.trim() || 'غير متوفر',
// //         price: price?.trim() || 'غير متوفر',
// //         rating: rating?.trim() || null,
// //         orders: null,
// //         image,
// //         url,
// //         id: url?.split('/p/')[1]?.split('/')[0] || Math.random().toString(36).substring(7)
// //       };
// //     })
// //   );

// //   await page.close(); // ✅ أغلق الصفحة فقط
// //   return products;
// // }

// // async function searchAllStores(query) {
// //   const browser = await launchBrowser();

// //   const [amazon, aliExpres] = await Promise.all([
// //     searchAmazonProducts(query, browser),
// //     searchAliExpressProducts(query, browser),
// //     // searchNoonProducts(query, browser)
// //   ]);

// //   await browser.close();

// //   return [...amazon, ...aliExpress,];
// // }


// // ;

// const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
// const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;

// let ebayAccessToken = null;
// let tokenExpiry = null;

// // 🔐 الحصول على التوكن من eBay Sandbox
// async function fetchEbayToken() {
//   const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

//   const response = await axios.post('https://api.sandbox.ebay.com/identity/v1/oauth2/token',
//     'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
//     {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Authorization': `Basic ${credentials}`
//       }
//     }
//   );

//   return {
//     token: response.data.access_token,
//     expires_in: response.data.expires_in
//   };
// }

// // 🧠 إدارة صلاحية التوكن
// async function getValidToken() {
//   const now = Date.now();
//   if (!ebayAccessToken || now > tokenExpiry) {
//     const { token, expires_in } = await fetchEbayToken();
//     ebayAccessToken = token;
//     tokenExpiry = now + expires_in * 1000;
//   }
//   return ebayAccessToken;
// }

// // 🔍 البحث عن المنتجات في eBay Sandbox
// async function searchEbayProducts(query, limit = 10) {
//   try {
//     const accessToken = await getValidToken();

//   const url = `https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}`;

//     const response = await axios.get(url, {
//       headers: {
//         'Authorization': `Bearer ${accessToken}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     const items = response.data?.itemSummaries;

//     if (!Array.isArray(items)) {
//       console.warn('⚠️ eBay API returned unexpected format:', response.data);
//       return [];
//     }

//     return items.map(item => ({
//       source: 'eBay',
//       title: item.title || 'بدون عنوان',
//       price: item.price?.value && item.price?.currency
//         ? `${item.price.value} ${item.price.currency}`
//         : 'غير متوفر',
//       image: item.image?.imageUrl || null,
//       url: item.itemWebUrl || '#'
//     }));
//   } catch (error) {
//     console.error('❌ Error fetching eBay products:', error.message);
//     return [];
//   }
// }

// module.exports = { searchEbayProducts };

//   async function addToCart(telegramId, product) {
//     try {
//       if (dbConnected) {
//         let user = await User.findOne({ telegramId });
        
//         if (!user) {
//           user = new User({ 
//             telegramId, 
//             cart: [] 
//           });
//         }
        
//         const existingItemIndex = user.cart.findIndex(item => item.productId === product.id);
        
//         if (existingItemIndex > -1) {
//           user.cart[existingItemIndex].quantity += 1;
//         } else {
//           user.cart.push({
//             productId: product.id,
//             title: product.title,
//             price: product.priceValue ||product.price,
//             currency: 'USD',
//             image: product.image,
//             url: product.url,
//             affiliateLink: product.affiliate_link || product.url,
//             store: product.store,
//             quantity: 1
//           });
//         }
        
//         await user.save();
//         return true;
//       } else {
//         // استخدام التخزين المحلي
//         if (!localUsers[telegramId]) {
//           localUsers[telegramId] = {
//             telegramId,
//             cart: [],
//             orders: [],
//             affiliateEarnings: 0,
//             createdAt: new Date()
//           };
//         }
        
//         const user = localUsers[telegramId];
//         const existingItemIndex = user.cart.findIndex(item => item.productId === product.id);
        
//         if (existingItemIndex > -1) {
//           user.cart[existingItemIndex].quantity += 1;
//         } else {
//           user.cart.push({
//             productId: product.id,
//             title: product.title,
//             price: product.priceValue || product.price,
//             currency: 'USD',
//             image: product.image,
//             url: product.url,
//             affiliateLink: product.affiliate_link || product.url,
//             store: product.store,
//             quantity: 1,
//             addedAt: new Date()
//           });
//         }
        
//         saveLocalData('users.json', localUsers);
//         return true;
//       }
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       return false;
//     }
//   }

//   async function getCart(telegramId) {
//     try {
//       if (dbConnected) {
//         const user = await User.findOne({ telegramId });
//         return user ? user.cart : [];
//       } else {
//         return localUsers[telegramId]?.cart || [];
//       }
//     } catch (error) {
//       console.error('Error getting cart:', error);
//       return [];
//     }
//   }

//   async function clearCart(telegramId) {
//     try {
//       if (dbConnected) {
//         const user = await User.findOne({ telegramId });
        
//         if (user) {
//           user.cart = [];
//           await user.save();
//           return true;
//         }
        
//         return false;
//       } else {
//         if (localUsers[telegramId]) {
//           localUsers[telegramId].cart = [];
//           saveLocalData('users.json', localUsers);
//           return true;
//         }
//         return false;
//       }
//     } catch (error) {
//       console.error('Error clearing cart:', error);
//       return false;
//     }
//   }

// // أضف هذه الدالة بعد تعريف stripe
// async function verifyStripeConnection() {
//   try {
//     const balance = await stripe.balance.retrieve();
//     console.log('✅ Stripe connection verified successfully');
//     console.log('💰 Available balance:', balance.available[0].amount, balance.available[0].currency);
//     return true;
//   } catch (error) {
//     console.error('❌ Stripe connection failed:', error.message);
//     return false;
//   }
// }
//  // ========== دوال الدفع مع Stripe Checkout ==========
// // بدلاً من البيانات الثابتة:
// async function createStripeCheckoutSession(amount, currency = 'usd', metadata = {}) {
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     line_items: [{
//       price_data: {
//         currency: currency,
//         product_data: {
//           name: 'Order Payment',
//           description: `Order #${metadata.orderId}`
//         },
//         unit_amount: Math.round(amount * 100), // تحويل إلى سنتات
//       },
//       quantity: 1,
//     }],
//     mode: 'payment',
//     success_url: `${process.env.WEBAPP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.WEBAPP_URL}/cancel`,
//     metadata: metadata
//   });
//   return { success: true, url: session.url };
// }

// async function retrieveStripeCheckoutSession(sessionId) {
//   try {
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     return {
//       success: true,
//       session: session,
//       status: session.payment_status
//     };
//   } catch (error) {
//     console.error('Error retrieving checkout session:', error);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// }

// async function confirmOrderPayment(orderId, sessionId, telegramId) {
//   try {
//     let order = null;

//     // ✅ محاولة البحث في MongoDB أولًا
//     if (dbConnected) {
//       try {
//         order = await Order.findOne({ orderId });
//       } catch (err) {
//         console.error('❌ خطأ أثناء البحث في MongoDB:', err.message);
//       }
//     }

//     // ✅ إذا لم يتم العثور على الطلب في MongoDB، نبحث في التخزين المحلي
//     if (!order) {
//       console.warn('⚠️ لم يتم العثور على الطلب في MongoDB، سيتم البحث في التخزين المحلي');
//       order = orders.find(o => o.sessionId === sessionId);

//       if (!order) {
//         console.error('❌ لم يتم العثور على الطلب في التخزين المحلي:', sessionId);
//         console.log('🔍 البحث عن الطلب باستخدام orderId:', orderId);
//         return;
//       }

//       order.paymentStatus = 'paid';
//       order.status = 'processing';
//       saveOrders();

//       if (carts[order.userId]) {
//         delete carts[order.userId];
//         saveCarts();
//       }

//       const message = `✅ تم تأكيد الدفع!\n\n🆔 رقم الطلب: ${order.orderId}\n💰 المبلغ: ${order.totalAmount.toFixed(2)} USD\n📦 الحالة: جاري التجهيز\n\nشكراً لك على الشراء!`;
//       await bot.sendMessage(telegramId || order.telegramId, message);

//       console.log(`✅ تم تأكيد الدفع للطلب ${order.orderId} وتفريغ السلة (محليًا)`);
//       return { success: true, order };
//     }

//     // ✅ إذا تم العثور على الطلب في MongoDB
//     const sessionResult = await retrieveStripeCheckoutSession(sessionId);
//     if (!sessionResult.success) {
//       throw new Error(`فشل استرجاع جلسة الدفع: ${sessionResult.error}`);
//     }

//     if (sessionResult.status === 'paid') {
//       order.paymentStatus = 'paid';
//       order.status = 'processing';
//       order.updatedAt = new Date();
//       await order.save();

//       await Cart.deleteOne({ userId: order.userId });

//       const message = `✅ تم تأكيد الدفع!\n\n🆔 رقم الطلب: ${order.orderId}\n💰 المبلغ: ${order.totalAmount.toFixed(2)} USD\n📦 الحالة: جاري التجهيز\n\nشكراً لك على الشراء!`;
//       await bot.sendMessage(telegramId || order.telegramId, message);

//       console.log(`✅ تم تأكيد الدفع للطلب ${order.orderId} وتفريغ السلة (من MongoDB)`);
//       return { success: true, order };
//     } else {
//       console.warn(`⚠️ حالة الدفع غير مكتملة: ${sessionResult.status}`);
//       return { success: false, message: `Payment status: ${sessionResult.status}` };
//     }

//   } catch (error) {
//     console.error('❌ خطأ أثناء تأكيد الدفع:', error.message);
//     throw error;
//   }
// }


//   // ========== دوال إدارة الطلبات الحقيقية ==========
// async function processRealOrder(telegramId, cartItems, shippingAddress, paymentMethod) {
//   try {
//     // حساب المبلغ الإجمالي
//     let totalAmount = 0;
//     const orderProducts = cartItems.map(item => {
//       const itemTotal = item.price * item.quantity;
//       totalAmount += itemTotal;
//       return {
//         productId: item.productId,
//         title: item.title,
//         price: item.price,
//         currency: item.currency || 'USD',
//         quantity: item.quantity,
//         affiliateLink: item.affiliateLink,
//         store: item.store
//       };
//     });

//     // إنشاء رقم طلب فريد
//     const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//     // ✅ إنشاء جلسة checkout مع Stripe
//     const checkoutResult = await createStripeCheckoutSession(totalAmount, 'usd', {
//       orderId: orderId,
//       telegramId: telegramId.toString()
//     });

//     if (!checkoutResult.success) {
//       throw new Error(`Checkout failed: ${checkoutResult.error}`);
//     }

//     // ✅ هنا لا نحفظ الطلب في DB، فقط نرجع بياناته
//     return {
//       success: true,
//       order: {
//         orderId,
//         telegramId,
//         products: orderProducts,
//         totalAmount,
//         currency: 'USD',
//         status: 'pending',
//         shippingAddress,
//         paymentMethod,
//         paymentStatus: 'pending',
//         paymentId: checkoutResult.sessionId,
//         createdAt: new Date(),
//       },
//       checkout: checkoutResult
//     };

//   } catch (error) {
//     console.error('Error processing real order:', error);
//     return { success: false, error: error.message };
//   }
// }
//   async function getUserOrders(telegramId) {
//     try {
//       if (dbConnected) {
//         const user = await User.findOne({ telegramId }).populate('orders');
//         return user ? user.orders : [];
//       } else {
//         return Object.values(localOrders).filter(order => order.telegramId === telegramId);
//       }
//     } catch (error) {
//       console.error('Error getting user orders:', error);
//       return [];
//     }
//   }

//   async function getCommissions(telegramId) {
//     try {
//       if (dbConnected) {
//         const commissions = await Commission.find({ telegramId }).sort({ createdAt: -1 });
//         return commissions;
//       } else {
//         return Object.values(localCommissions).filter(com => com.telegramId === telegramId);
//       }
//     } catch (error) {
//       console.error('Error getting commissions:', error);
//       return [];
//     }
//   }

//   async function getTotalEarnings(telegramId) {
//     try {
//       if (dbConnected) {
//         const user = await User.findOne({ telegramId });
//         return user ? user.affiliateEarnings : 0;
//       } else {
//         return localUsers[telegramId]?.affiliateEarnings || 0;
//       }
//     } catch (error) {
//       console.error('Error getting total earnings:', error);
//       return 0;
//     }
//   }




// // Webhook لاستقبال أحداث Stripe
// app.post('/api/confirm-payment', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error('❌ Webhook Error:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
//     console.log('✅ تم الدفع بنجاح، session:', session.id);

//     const orderId = session.metadata?.orderId;
//     const telegramId = session.metadata?.telegramId;

//     if (orderId && session.id) {
//       console.log('🔌 dbConnected:', dbConnected);

//       await confirmOrderPayment(orderId, session.id, telegramId);
//          console.log('📦 Metadata:', session.metadata);
         
//     } else {
   

//       console.warn('⚠️ لم يتم العثور على orderId أو telegramId في metadata');
//     }
//   }

//   res.status(200).send('✅ Webhook received');
// });

//   app.use(express.json());
// app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });


// bot.onText(/\/shiptest (.+) (.+)/, (msg, match) => {
//   const userId = msg.chat.id;
//   const orderId = match[1];
//   const productId = match[2];

//   const result = simulateShipping(orderId, productId);

//   bot.sendMessage(userId, result.message);
// });
// bot.onText(/\/testorder (amazon|aliexpress)/, (msg, match) => {
//   const userId = msg.chat.id;
//   const source = match[1];

//   const order = createTestOrder(userId, source);

//   bot.sendMessage(userId, `✅ تم إنشاء طلب تجريبي من ${source}.\nرقم الطلب: ${order.id}\nالمنتج: ${order.products[0].title}\nالسعر: $${order.totalAmount}`);
// });
// bot.onText(/\/track/, (msg) => {
//   const userId = msg.chat.id;
//   const userOrders = orders.filter(o => o.userId === userId);

//   if (userOrders.length === 0) {
//     return bot.sendMessage(userId, '📭 لا توجد طلبات حتى الآن.');
//   }

//   userOrders.forEach(order => {
//     order.products.forEach(product => {
//       const statusEmoji = product.shippingStatus === 'shipped' ? '✅' :
//                           product.shippingStatus === 'delivered' ? '📬' : '⏳';
//       const tracking = product.trackingUrl ? `\n🔗 تتبع: ${product.trackingUrl}` : '';
//       const message = `🧾 طلب: ${order.id}\n- ${product.title} (${product.source})\nالحالة: ${product.shippingStatus} ${statusEmoji}${tracking}`;

//       const inlineKeyboard = {
//         inline_keyboard: []
//       };

//       if (product.shippingStatus === 'pending') {
//         inlineKeyboard.inline_keyboard.push([
//           {
//             text: '📦 تحديث إلى "تم الشحن"',
//             callback_data: `ship:${order.id}:${product.id}`
//           }
//         ]);
//       }

//       bot.sendMessage(userId, message, { reply_markup: inlineKeyboard });
//     });
//   });
// });
// //أمر في Telegram للبحث بالصور

// bot.on('photo', async (msg) => {
//   const chatId = msg.chat.id;
//   const fileId = msg.photo[msg.photo.length - 1].file_id; // أفضل دقة

//   try {
//     const file = await bot.getFile(fileId);
//     const imageUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

//     // التحقق من رابط الصورة
//     if (!imageUrl) {
//       await bot.sendMessage(chatId, '❌ فشل الحصول على رابط الصورة.');
//       return;
//     }

//     const waitingMsg = await bot.sendMessage(chatId, '📷 جاري تحليل الصورة...');

//     // تنزيل الصورة محليًا
//     const imagePath = `./downloads/${file.file_unique_id}.jpg`;
//     const writer = fs.createWriteStream(imagePath);
//     const response = await axios({
//       url: imageUrl,
//       method: 'GET',
//       responseType: 'stream'
//     });
//     response.data.pipe(writer);
//     await new Promise((resolve, reject) => {
//       writer.on('finish', resolve);
//       writer.on('error', reject);
//     });

//     // دالة لتهريب Markdown
//     const escapeMarkdown = (text) => text.replace(/([_*[\]()~`>#+-=|{}.!])/g, '\\$1');

//     // استخراج كلمة البحث
//     const query = await extractProductQueryFromImage(imagePath);
//     if (!query) {
//       await bot.sendMessage(chatId, '❌ لم أستطع استخراج اسم المنتج من الصورة.');
//       return;
//     }

//     await bot.sendMessage(chatId, `🔎 جاري البحث عن: *${escapeMarkdown(query)}*`, { parse_mode: 'Markdown' });

//     // البحث في المتاجر
//     const [amazonProducts, aliExpressProducts] = await Promise.all([
//       searchAmazonProducts(query),
//       searchAliExpressProducts(query)
//     ]);

//     const allProducts = [...amazonProducts, ...aliExpressProducts];
//     if (allProducts.length === 0) {
//       await bot.sendMessage(chatId, '❌ لم أجد منتجات مشابهة لهذه الصورة.');
//       return;
//     }

//     // عرض النتائج
//     const sortedProducts = sortProducts(allProducts, currentDisplayOption).slice(0, 5);
//     for (const product of sortedProducts) {
//       await bot.sendPhoto(chatId, product.image, {
//         caption: `${escapeMarkdown(product.title)}\n💰 ${escapeMarkdown(product.price)}\n🔗 ${escapeMarkdown(product.affiliate_link || product.url)}`,
//         parse_mode: 'Markdown'
//       });
//     }

//     // حذف رسالة الانتظار
//     try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}

//   } catch (err) {
//     console.error('Image processing error:', err);
//     await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة الصورة أو البحث عن المنتج.');
//   }
// });




// // bot.sendMessage(userId, `📦 تم شحن المنتج التجريبي! يمكنك تتبعه هنا:\n${trackingUrl}`);

//   // ========== أمر تغيير طريقة العرض ==========
// let  allpro;
//   bot.onText(/\/display_(mixed|price|rating|orders|store)/, (msg, match) => {
//     const chatId = msg.chat.id;
//     const option = match[1];
    
//     const optionMap = {
//       'mixed': DISPLAY_OPTIONS.MIXED,
//       'price': DISPLAY_OPTIONS.BY_PRICE,
//       'rating': DISPLAY_OPTIONS.BY_RATING,
//       'orders': DISPLAY_OPTIONS.BY_ORDERS,
//       'store': DISPLAY_OPTIONS.BY_STORE
//     };
    
//     currentDisplayOption = optionMap[option] || DISPLAY_OPTIONS.MIXED;
    
//     const optionNames = {
//       [DISPLAY_OPTIONS.MIXED]: 'خلط عشوائي',
//       [DISPLAY_OPTIONS.BY_PRICE]: 'حسب السعر (الأرخص أولاً)',
//       [DISPLAY_OPTIONS.BY_RATING]: 'حسب التقييم (الأعلى أولاً)',
//       [DISPLAY_OPTIONS.BY_ORDERS]: 'حسب المبيعات (الأكثر مبيعاً)',
//       [DISPLAY_OPTIONS.BY_STORE]: 'حسب المتجر (Amazon أولاً)'
//     };
    
//     bot.sendMessage(chatId, `✅ تم تغيير طريقة العرض إلى: ${optionNames[currentDisplayOption]}`);
//   });

//   // ========== أمر البحث من جميع المصادر ==========
// bot.onText(/\/search (.+)/, async (msg, match) => {
//   const chatId = msg.chat.id;
//   const query = match[1];

//   if (!query) {
//     bot.sendMessage(chatId, '⚠️ يرجى تقديم كلمة بحث صحيحة');
//     return;
//   }

//   const waitingMsg = await bot.sendMessage(chatId, '🔍 جاري البحث في جميع المتاجر...');

//   try {
//     const [amazonProducts, aliExpressProducts] = await Promise.all([
//       searchAmazonProducts(query),
//       searchAliExpressProducts(query),
//       searchEbayProducts(query)
//     ]);
// const ebayProducts = await searchEbayProducts(query);

//     await bot.deleteMessage(chatId, waitingMsg.message_id);
// // const allProducts = Array.isArray(ebayProducts) ? [...ebayProducts] : [];

//     const allProducts = [...amazonProducts, ...aliExpressProducts, ...ebayProducts];
//     // const allProducts = [ ...ebayProducts];

//     if (allProducts.length === 0) {
//       bot.sendMessage(chatId, '❌ لم يتم العثور على منتجات تطابق بحثك.');
//       return;
//     }

//     const sortedProducts = sortProducts(allProducts, currentDisplayOption);
//     const productsToSend = sortedProducts.slice(0, 8);
//     allpro = productsToSend;
//     console.log(allpro);

//     const displayInfo = {
//       [DISPLAY_OPTIONS.MIXED]: '🔄 عرض عشوائي',
//       [DISPLAY_OPTIONS.BY_PRICE]: '💰 عرض حسب السعر (الأرخص أولاً)',
//       [DISPLAY_OPTIONS.BY_RATING]: '⭐ عرض حسب التقييم (الأعلى أولاً)',
//       [DISPLAY_OPTIONS.BY_ORDERS]: '🔥 عرض حسب المبيعات (الأكثر مبيعاً)',
//       [DISPLAY_OPTIONS.BY_STORE]: '🏪 عرض حسب المتجر (Amazon أولاً)'
//     };

//     await bot.sendMessage(chatId, displayInfo[currentDisplayOption]);

//     for (const product of productsToSend) {
//       const storeIcon = product.store === 'Amazon' ? '🏪' :
//                         product.store === 'AliExpress' ? '🛒' : '📦';

//       const message = `
// ${storeIcon} *${product.store || product.source}*
// 📦 ${product.title}
// 💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
// ⭐ التقييم: ${product.rating || 'غير متوفر'}
// 🛒 ${product.orders || 'غير متوفر'}
// 🚚 ${product.shipping || 'غير محدد'}
// ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
// 🔗 [عرض المنتج](${product.affiliate_link || product.url})

// ${product.commission_rate ? `*عمولة: ${(product.commission_rate * 100).toFixed(1)}%*` : ''}
//       `;

//       const keyboard = {
//         inline_keyboard: [[
//           { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id || product.url}` }
//         ]]
//       };

//       try {
//         if (product.image && product.image.startsWith('http')) {
//           await bot.sendPhoto(chatId, product.image, {
//             caption: message,
//             parse_mode: 'Markdown',
//             reply_markup: keyboard
//           });
//         } else {
//           await bot.sendMessage(chatId, message, {
//             parse_mode: 'Markdown',
//             reply_markup: keyboard
//           });
//         }
//       } catch (sendError) {
//         console.error('Error sending product:', sendError.message);
//         await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
//       }

//       await new Promise(resolve => setTimeout(resolve, 800));
//     }

//     const statsMessage = `
// ✅ تم العثور على ${allProducts.length} منتج:
// • 🏪 Amazon: ${amazonProducts.length} منتج
// • 🛒 AliExpress: ${aliExpressProducts.length} منتج
// • 📦 eBay: ${ebayProducts.length} منتج

// *أوامر العرض المتاحة:*
// /display_mixed - عرض عشوائي
// /display_price - حسب السعر
// /display_rating - حسب التقييم  
// /display_orders - حسب المبيعات
// /display_store - حسب المتجر

// استخدم /search <كلمة البحث> للبحث مرة أخرى.
//     `;

// // const statsMessage = `
// // ✅ تم العثور على ${allProducts.length} منتج:
// // ${typeof amazonProducts !== 'undefined' ? `• 🏪 Amazon: ${amazonProducts.length} منتج\n` : ''}
// // ${typeof aliExpressProducts !== 'undefined' ? `• 🛒 AliExpress: ${aliExpressProducts.length} منتج\n` : ''}
// // • 📦 eBay: ${ebayProducts.length} منتج

// // *أوامر العرض المتاحة:*
// // /display_mixed - عرض عشوائي
// // /display_price - حسب السعر
// // /display_rating - حسب التقييم  
// // /display_orders - حسب المبيعات
// // /display_store - حسب المتجر

// // استخدم /search <كلمة البحث> للبحث مرة أخرى.
// // `;

//     bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

//   } catch (error) {
//     console.error('Error in search:', error);
//     try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
//     bot.sendMessage(chatId, '❌ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقاً.');
//   }
// });

// // bot.onText(/\/search (.+)/, async (msg, match) => {
// //   const chatId = msg.chat.id;
// //   const query = match[1];

// //   if (!query) {
// //     bot.sendMessage(chatId, '⚠️ يرجى تقديم كلمة بحث صحيحة');
// //     return;
// //   }

// //   const waitingMsg = await bot.sendMessage(chatId, '🔍 جاري البحث في جميع المتاجر...');

// //   try {
// //     const browser = await launchBrowser();
// //     const allProducts = await searchAllStores(query, browser);
// //     await browser.close();
// //     await bot.deleteMessage(chatId, waitingMsg.message_id);

// //     if (allProducts.length === 0) {
// //       bot.sendMessage(chatId, '❌ لم يتم العثور على منتجات تطابق بحثك.');
// //       return;
// //     }

// //     const sortedProducts = sortProducts(allProducts, currentDisplayOption);
// //     const productsToSend = sortedProducts.slice(0, 8);
// //     allpro = productsToSend;
// //     console.log(allpro);

// //     const displayInfo = {
// //       [DISPLAY_OPTIONS.MIXED]: '🔄 عرض عشوائي',
// //       [DISPLAY_OPTIONS.BY_PRICE]: '💰 عرض حسب السعر (الأرخص أولاً)',
// //       [DISPLAY_OPTIONS.BY_RATING]: '⭐ عرض حسب التقييم (الأعلى أولاً)',
// //       [DISPLAY_OPTIONS.BY_ORDERS]: '🔥 عرض حسب المبيعات (الأكثر مبيعاً)',
// //       [DISPLAY_OPTIONS.BY_STORE]: '🏪 عرض حسب المتجر (Amazon أولاً)'
// //     };

// //     await bot.sendMessage(chatId, displayInfo[currentDisplayOption]);

// //     for (const product of productsToSend) {
// //       const storeIcon = product.store === 'Amazon' ? '🏪' : product.store === 'Noon' ? '🟡' : '🛒';
// //       const message = `
// // ${storeIcon} *${product.store}*
// // 📦 ${product.title}
// // 💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
// // ⭐ التقييم: ${product.rating || 'غير متوفر'}
// // 🛒 ${product.orders || 'غير متوفر'}
// // 🚚 ${product.shipping || 'غير محدد'}
// // ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
// // 🔗 [عرض المنتج](${product.affiliate_link || product.url})

// // *عمولة: ${product.commission_rate ? (product.commission_rate * 100).toFixed(1) + '%' : 'غير متوفر'}*
// //       `;

// //       const keyboard = {
// //         inline_keyboard: [[
// //           { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id}` }
// //         ]]
// //       };

// //       try {
// //         if (product.image && product.image.startsWith('http')) {
// //           await bot.sendPhoto(chatId, product.image, {
// //             caption: message,
// //             parse_mode: 'Markdown',
// //             reply_markup: keyboard
// //           });
// //         } else {
// //           await bot.sendMessage(chatId, message, {
// //             parse_mode: 'Markdown',
// //             reply_markup: keyboard
// //           });
// //         }
// //       } catch (sendError) {
// //         console.error('Error sending product:', sendError.message);
// //         await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
// //       }

// //       await new Promise(resolve => setTimeout(resolve, 800));
// //     }

// //     const amazonCount = allProducts.filter(p => p.store === 'Amazon').length;
// //     const aliExpressCount = allProducts.filter(p => p.store === 'AliExpress').length;
// //     const noonCount = allProducts.filter(p => p.store === 'Noon').length;

// //     const statsMessage = `
// // ✅ تم العثور على ${allProducts.length} منتج:
// // • 🏪 Amazon: ${amazonCount} منتج
// // • 🛒 AliExpress: ${aliExpressCount} منتج
// // • 🟡 Noon: ${noonCount} منتج

// // *أوامر العرض المتاحة:*
// // /display_mixed - عرض عشوائي
// // /display_price - حسب السعر
// // /display_rating - حسب التقييم  
// // /display_orders - حسب المبيعات
// // /display_store - حسب المتجر

// // استخدم /search <كلمة البحث> للبحث مرة أخرى.
// //     `;

// //     bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

// //   } catch (error) {
// //     console.error('Error in search:', error);
// //     try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
// //     bot.sendMessage(chatId, '❌ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقاً.');
// //   }
// // });




// // bot.onText(/\/search (.+)/, async (msg, match) => {
// //   const chatId = msg.chat.id;
// //   const query = match[1];

// //   if (!query) {
// //     bot.sendMessage(chatId, '⚠️ يرجى تقديم كلمة بحث صحيحة');
// //     return;
// //   }

// //   const waitingMsg = await bot.sendMessage(chatId, '🔍 جاري البحث في جميع المتاجر...');

// //   try {
// //     const [amazonProducts, aliExpressProducts] = await Promise.all([
// //       searchAmazonProducts(query),
// //       searchAliExpressProducts(query)
// //     ]);

// //     await bot.deleteMessage(chatId, waitingMsg.message_id);

// //     const allProducts = [...amazonProducts, ...aliExpressProducts];
// //     if (allProducts.length === 0) {
// //       bot.sendMessage(chatId, '❌ لم يتم العثور على منتجات تطابق بحثك.');
// //       return;
// //     }

// //     const sortedProducts = sortProducts(allProducts, currentDisplayOption);
// //     const productsToSend = sortedProducts.slice(0, 8);
// //     allpro = productsToSend;

// //     const displayInfo = {
// //       [DISPLAY_OPTIONS.MIXED]: '🔄 عرض عشوائي',
// //       [DISPLAY_OPTIONS.BY_PRICE]: '💰 عرض حسب السعر (الأرخص أولاً)',
// //       [DISPLAY_OPTIONS.BY_RATING]: '⭐ عرض حسب التقييم (الأعلى أولاً)',
// //       [DISPLAY_OPTIONS.BY_ORDERS]: '🔥 عرض حسب المبيعات (الأكثر مبيعاً)',
// //       [DISPLAY_OPTIONS.BY_STORE]: '🏪 عرض حسب المتجر (Amazon أولاً)'
// //     };

// //     await bot.sendMessage(chatId, displayInfo[currentDisplayOption]);

// //     for (const product of productsToSend) {
// //       const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
// //       const imageUrl = product.image || product.thumbnail || product.image_url;

// //       const message = `
// // ${storeIcon} *${product.store}*
// // 📦 ${product.title}
// // 💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
// // ⭐ التقييم: ${product.rating || 'غير متوفر'}
// // 🛒 ${product.orders || 'غير متوفر'}
// // 🚚 ${product.shipping}
// // ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
// // 🔗 [عرض المنتج](${product.affiliate_link || product.url})

// // *عمولة: ${(product.commission_rate * 100).toFixed(1)}%*
// //       `.trim();

// //     const keyboard = {
// //   inline_keyboard: [[
// //     {
// //       text: '🛒 إضافة إلى السلة',
// //       callback_data: `add_to_cart_${product.id}`
// //     }
// //   ]]
// // };

// //       try {
// //         if (imageUrl && imageUrl.startsWith('http')) {
// //           await bot.sendPhoto(chatId, imageUrl, {
// //             caption: message,
// //             parse_mode: 'Markdown',
// //             reply_markup: keyboard
// //           });
// //         } else {
// //           await bot.sendMessage(chatId, message, {
// //             parse_mode: 'Markdown',
// //             reply_markup: keyboard
// //           });
// //         }
// //       } catch (sendError) {
// //         console.error('Error sending product:', sendError.message);
// //         await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
// //       }

// //       await new Promise(resolve => setTimeout(resolve, 800));
// //     }

// //     const statsMessage = `
// // ✅ تم العثور على ${allProducts.length} منتج:
// // • 🏪 Amazon: ${amazonProducts.length} منتج
// // • 🛒 AliExpress: ${aliExpressProducts.length} منتج

// // *أوامر العرض المتاحة:*
// // /display_mixed - عرض عشوائي
// // /display_price - حسب السعر
// // /display_rating - حسب التقييم  
// // /display_orders - حسب المبيعات
// // /display_store - حسب المتجر

// // استخدم /search <كلمة البحث> للبحث مرة أخرى.
// //     `.trim();

// //     bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

// //   } catch (error) {
// //     console.error('Error in search:', error);
// //     try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
// //     bot.sendMessage(chatId, '❌ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقاً.');
// //   }
// // });
//   // ========== أمر البحث في متجر محدد ==========


//   bot.onText(/\/search_(amazon|aliexpress) (.+)/, async (msg, match) => {
//     const chatId = msg.chat.id;
//     const store = match[1];
//     const query = match[2];
    
//     const waitingMsg = await bot.sendMessage(chatId, `🔍 جاري البحث في ${store}...`);
    
//     try {
//       let products = [];
//       if (store === 'amazon') {
//         products = await searchAmazonProducts(query);
//       } else if (store === 'aliexpress') {
//         products = await searchAliExpressProducts(query);
//       }
      
//       await bot.deleteMessage(chatId, waitingMsg.message_id);
      
//       if (!products || products.length === 0) {
//         bot.sendMessage(chatId, `❌ لم يتم العثور على منتجات في ${store} تطابق بحثك.`);
//         return;
//       }
      
//       const sortedProducts = sortProducts(products, currentDisplayOption);
//       const productsToSend = sortedProducts.slice(0, 6);
      
//       for (const product of productsToSend) {
//         const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
//         const message = `
//   ${storeIcon} *${product.store}*
//   📦 ${product.title}
//   💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
//   ⭐ التقييم: ${product.rating || 'غير متوفر'}
//   🛒 ${product.orders || 'غير متوفر'}
//   🚚 ${product.shipping}
//   ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
//   🔗 [عرض المنتج](${product.affiliate_link || product.url})

//   *عمولة: ${(product.commission_rate * 100).toFixed(1)}%*
//         `;
        
//         try {
//           const keyboard = {
//             inline_keyboard: [[
//               { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id}` }
//             ]]
//           };
          
//           if (product.image && product.image.startsWith('http')) {
//             await bot.sendPhoto(chatId, product.image, {
//               caption: message,
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           } else {
//             await bot.sendMessage(chatId, message, {
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           }
//         } catch (sendError) {
//           await bot.sendMessage(chatId, `📦 ${product.title}\n💰 ${product.price}\n🔗 ${product.affiliate_link || product.url}`);
//         }
        
//         await new Promise(resolve => setTimeout(resolve, 800));
//       }
      
//       bot.sendMessage(chatId, `✅ تم العثور على ${products.length} منتج في ${store}.`);
      
//     } catch (error) {
//       console.error(`Error searching ${store}:`, error);
//       try { await bot.deleteMessage(chatId, waitingMsg.message_id); } catch {}
//       bot.sendMessage(chatId, `❌ حدث خطأ أثناء البحث في ${store}.`);
//     }
//   });

//   // ========== معالجة الأزرار ==========
// //   bot.on('callback_query', async (callbackQuery) => {
// //     const chatId = callbackQuery.message.chat.id;
// //     const data = callbackQuery.data;
    
// //     try {
// //       if (data.startsWith('add_to_cart_')) {
// //          let producttitle;
// //         let productprice;
// //         let productpriceValue;
// //         let productimage ;
// //         let producturl;
// //         let productaffiliate_link ;
// //         let productstore;
// //         const productId = data.replace('add_to_cart_', '');
       
// //         console.log("id   :    "+productId);
// // console.log("ــــــــــــــــــــــــــــت");

// //         await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إضافة المنتج إلى السلة...' });
        
// //            for(const pro of allpro){


// //           if(pro.id==productId){
// //               producttitle=pro.title;
// //             productprice=pro.price;
// //             productpriceValue=pro.original_price;
// //             productimage=pro.image;
// //             producturl=pro.url;
// //             productaffiliate_link=pro.affiliate_link;
// //             productstore=pro.store;
// //             console.log("store : "+productstore);
// //             console.log(pro.id);
// // console.log(pro.title);
// // console.log(pro.price);
// // console.log(pro.original_price);
// // console.log(pro.image);
// // console.log(pro.url);
// // console.log(pro.affiliate_link);
// // console.log(pro.store);
// // console.log("ــــــــــــــــــــــــــــت");
// //           console.log("this is item"+pro.title);
          
// //             break;

// //           }
// //         }
// //         // console.log(`data :${data}`);
// //         // محاكاة إضافة منتج إلى السلة (في التطبيق الحقيقي، ستحتاج إلى البحث عن المنتج أولاً)
// //         // const product = {
// //         //   id: productId,
// //         //   title: `منتج ${productId}`,
// //         //   price: '$10.00',
// //         //   priceValue: 10.00,
// //         //   image: '',
// //         //   url: `https://example.com/product/${productId}`,
// //         //   affiliate_link: `https://example.com/product/${productId}?aff=123`,
// //         //   store: 'Amazon'
// //         // };
// //         let cleanPrice,cleanPrice2;
// //          if (typeof productprice === 'string'&&productprice.length!=0) {
// //         cleanPrice  = Number(String(productprice).replace(/[^0-9.]/g, ""));
// //          cleanPrice2 = Number(String(productpriceValue).replace(/[^0-9.]/g, ""));
// //          }
// //          else{
// //           cleanPrice=productprice;
// //           cleanPrice2=productpriceValue;
// //          }
// //           const product = {
// //           id: productId,
// //           title:producttitle,
// //           price:cleanPrice,  
// //           priceValue: cleanPrice2,
// //           image: productimage,
// //           url:productaffiliate_link,
// //           affiliate_link: productaffiliate_link,
// //           store: productstore
// //         };
// //         const success = await addToCart(chatId, product);
        
// //         if (success) {
// //           await bot.sendMessage(chatId, '✅ تمت إضافة المنتج إلى سلة المشتريات.');
// //         } else {
// //           await bot.sendMessage(chatId, '❌ فشلت إضافة المنتج إلى السلة. يرجى المحاولة مرة أخرى.');
// //         }
// //       }
// //       else if (data === 'checkout') {
// //         await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إنهاء عملية الشراء...' });
        
// //         const cartItems = await getCart(chatId);
        
// //         if (cartItems.length === 0) {
// //           await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
// //           return;
// //         }
        
// //         try {
// //           // طلب معلومات الشحن من المستخدم
// //           const shippingOptions = {
// //             reply_markup: {
// //               inline_keyboard: [
// //                 [{ text: '📋 إدخال عنوان الشحن', callback_data: 'enter_shipping' }],
// //                 [{ text: '❌ إلغاء', callback_data: 'cancel_checkout' }]
// //               ]
// //             }
// //           };
          
// //           bot.sendMessage(chatId, '🚚 يرجى إدخال عنوان الشحن لإكمال عملية الشراء:', shippingOptions);
// //         } catch (error) {
// //           await bot.sendMessage(chatId, '❌ فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
// //         }
// //       }
// //       else if (data === 'clear_cart') {
// //         await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري تفريغ السلة...' });
        
// //         const success = await clearCart(chatId);
        
// //         if (success) {
// //           await bot.sendMessage(chatId, '✅ تم تفريغ سلة المشتريات.');
// //         } else {
// //           await bot.sendMessage(chatId, '❌ فشل تفريغ السلة. يرجى المحاولة مرة أخرى.');
// //         }
// //       }
// //   else if (data === 'enter_shipping') {
// //   await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إعداد نموذج العنوان...' });
  
// //   const addressInstructions = `📋 يرجى إرسال عنوان الشحن بالشكل التالي:
  
// // الشارع: [اسم الشارع ورقم المنزل]
// // المدينة: [اسم المدينة]
// // الولاية/المحافظة: [اسم الولاية]
// // الرمز البريدي: [الرمز البريدي]
// // البلد: [اسم البلد]

// // مثال:
// // الشارع: 123 شارع التسوق
// // المدينة: الرياض
// // الولاية/المحافظة: الرياض
// // الرمز البريدي: 12345
// // البلد: السعودية`;

// //   bot.sendMessage(chatId, addressInstructions);
  
// //   const addressHandler = async (addressMsg) => {
// //     if (addressMsg.chat.id === chatId) {
// //       bot.removeListener('message', addressHandler);
      
// //       const addressText = addressMsg.text;
// //       const shippingAddress = {};
      
// //       // معالجة العنوان
// //       const addressLines = addressText.split('\n');
// //       addressLines.forEach(line => {
// //         if (line.includes('الشارع:')) shippingAddress.street = line.replace('الشارع:', '').trim();
// //         else if (line.includes('المدينة:')) shippingAddress.city = line.replace('المدينة:', '').trim();
// //         else if (line.includes('الولاية:') || line.includes('المحافظة:')) {
// //           shippingAddress.state = line.replace('الولاية:', '').replace('المحافظة:', '').trim();
// //         }
// //         else if (line.includes('الرمز البريدي:')) shippingAddress.zipCode = line.replace('الرمز البريدي:', '').trim();
// //         else if (line.includes('البلد:')) shippingAddress.country = line.replace('البلد:', '').trim();
// //       });
      
// //       try {
// //         const cartItems = await getCart(chatId);
        
// //         if (cartItems.length === 0) {
// //           await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
// //           return;
// //         }
        
// //         const orderResult = await processRealOrder(chatId, cartItems, shippingAddress, 'credit_card');
        
// //         if (!orderResult || !orderResult.success) {
// //           await bot.sendMessage(chatId, '❌ فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
// //           return;
// //         }
        
// //         if (process.env.STRIPE_SECRET_KEY && orderResult.checkout && orderResult.checkout.url) {
// //           // إرسال رابط الدفع الحقيقي
// //           await bot.sendMessage(chatId, `✅ تم إنشاء طلبك بنجاح!\n🆔 رقم الطلب: ${orderResult.order.orderId}\n💰 المبلغ الإجمالي: ${orderResult.order.totalAmount.toFixed(2)} USD`);
// //        console.log( orderResult.checkout.url);
// //           await   bot.sendMessage(chatId, "💳 لإتمام عملية الدفع:", {
// //   reply_markup: {
// //     inline_keyboard: [
// //       [
// //         {
// //           text: "إتمام الدفع",
// //           web_app: { url: orderResult.checkout.url }  // رابط Stripe Checkout
// //         }
// //       ]
// //     ]
// //   }
// // });
// //           await bot.sendMessage(chatId, `💳 يرجى إكمال عملية الدفع عبر الرابط التالي:\n${orderResult.checkout.url}`);
// //         } else {
// //           // وضع التطوير
// //           await bot.sendMessage(chatId, `✅ تم إنشاء طلب تجريبي!\n🆔 رقم الطلب: ${orderResult.order.orderId}\n💰 المبلغ الإجمالي: ${orderResult.order.totalAmount.toFixed(2)} USD`);
// //           await bot.sendMessage(chatId, '🔗 هذا رابط تجريبي للدفع (للتطوير فقط)');
// //         }
// //       } catch (error) {
// //         console.error('Error processing order:', error);
// //         await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة الطلب.');
// //       }
// //     }
// //   };
  
// //   bot.on('message', addressHandler);
// // }
// //       else if (data === 'cancel_checkout') {
// //         await bot.answerCallbackQuery(callbackQuery.id, { text: 'تم إلغاء عملية الشراء' });
// //         await bot.sendMessage(chatId, '❌ تم إلغاء عملية الشراء.');
// //       }
// //         else if (data.startsWith('ship:')) {
// //         const [, orderId, productId] = data.split(':');

// //         const result = simulateShipping(orderId, productId); // تأكد أن هذه الدالة موجودة وتحدث shippedAt
// //         await bot.sendMessage(chatId, result.message);
// //         await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ تم التحديث إلى "تم الشحن"' });
// //       }

// //       else if (data.startsWith('deliver:')) {
// //         const [, orderId, productId] = data.split(':');

// //         const order = orders.find(o => o.id === orderId);
// //         if (!order) {
// //           await bot.sendMessage(chatId, '❌ الطلب غير موجود.');
// //           return;
// //         }

// //         const product = order.products.find(p => p.id === productId);
// //         if (!product) {
// //           await bot.sendMessage(chatId, '❌ المنتج غير موجود.');
// //           return;
// //         }

// //         product.shippingStatus = 'delivered';
// //         product.deliveredAt = Date.now();
// //         saveOrders();

// //         await bot.sendMessage(chatId, `📬 تم تأكيد تسليم المنتج (${product.title}) بنجاح!`);
// //         await bot.answerCallbackQuery(callbackQuery.id, { text: '📬 تم التحديث إلى "تم التسليم"' });
// //       }
// //     } catch (error) {
// //       console.error('Error handling callback query:', error);
// //       await bot.answerCallbackQuery(callbackQuery.id, { text: 'حدث خطأ أثناء المعالجة.' });
// //     }
// //   });
// bot.on('callback_query', async (callbackQuery) => {
//   const chatId = callbackQuery.message.chat.id;
//   const data = callbackQuery.data;

//   try {
//     // إضافة منتج إلى السلة
//     if (data.startsWith('add_to_cart_')) {
//       const productId = data.replace('add_to_cart_', '');
//       let product = allpro?.find(p => p.id == productId);

//       // إذا لم يُعثر على المنتج، أعد عرضه تلقائيًا
//       if (!product) {
//         await bot.sendMessage(chatId, '⚠️ يبدو أن هذه الرسالة قديمة والبيانات غير متوفرة حالياً.\n🔄 جاري إعادة عرض المنتج...');

//         try {
//           const [amazonResults, aliResults] = await Promise.all([
//             searchAmazonProducts(productId),
//             searchAliExpressProducts(productId)
//           ]);
//           const allResults = [...amazonResults, ...aliResults];
//           product = allResults.find(p => p.id == productId);
//           allpro=allResults;
//           if (!product) {
//             await bot.sendMessage(chatId, '❌ لم يتم العثور على المنتج بعد إعادة البحث.');
//             return;
//           }

//           // إعادة عرض المنتج
//           const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
//           const imageUrl = product.image || product.thumbnail || product.image_url;

//           const message = `
// ${storeIcon} *${product.store}*
// 📦 ${product.title}
// 💰 السعر: ${product.price} ${product.original_price ? `(كان: ${product.original_price})` : ''}
// ⭐ التقييم: ${product.rating || 'غير متوفر'}
// 🛒 عدد الطلبات: ${product.orders || 'غير متوفر'}
// 🚚 الشحن: ${product.shipping || 'غير محدد'}
// ${product.discount ? `🎁 خصم: ${product.discount}` : ''}
// 🔗 [عرض المنتج](${product.affiliate_link || product.url})

// *عمولة: ${(product.commission_rate * 100).toFixed(1)}%*
//           `.trim();

//           const keyboard = {
//             inline_keyboard: [[
//               {
//                 text: '🛒 إضافة إلى السلة',
//                 callback_data: `add_to_cart_${product.id}`
//               }
//             ]]
//           };

//           if (imageUrl && imageUrl.startsWith('http')) {
//             await bot.sendPhoto(chatId, imageUrl, {
//               caption: message,
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           } else {
//             await bot.sendMessage(chatId, message, {
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           }

//           return; // لا تكمل الإضافة الآن، فقط أعِد العرض
//         } catch (err) {
//           console.error('Error during fallback search:', err);
//           await bot.sendMessage(chatId, '❌ حدث خطأ أثناء محاولة إعادة عرض المنتج.');
//           return;
//         }
//       }

//       // تنظيف السعر
//       console.log('pric   '+product.price );
//       console.log('pric2   '+product.original_price );

//       const cleanPrice = typeof product.price === 'string'
//         ? Number(String(product.price).replace(/[^0-9.]/g, ''))
//         : product.price;
       
//         let   cleanPrice2 ;
//         if(product.original_price !=null){
//  cleanPrice2 = typeof product.original_price === 'string'
//         ? Number(String(product.original_price).replace(/[^0-9.]/g, ''))
//         : product.original_price;
//         }else{
//           cleanPrice2=0;
//         }
//       console.log('pric new   '+cleanPrice);
        
//       console.log('pric2  new  '+cleanPrice2);
      


//       const productData = {
//         id: product.id,
//         title: product.title,
//         price: cleanPrice||0,
//         priceValue: cleanPrice2||0,
//         image: product.image,
//         url: product.affiliate_link || product.url,
//         affiliate_link: product.affiliate_link,
//         store: product.store
//       };

//       const success = await addToCart(chatId, productData);
//         await bot.sendMessage(chatId, '✅ تمت إضافة المنتج إلى السلة');

//       await bot.answerCallbackQuery(callbackQuery.id, {
//         text: success ? '✅ تمت إضافة المنتج إلى السلة.' : '❌ فشلت إضافة المنتج.'
//       });
//     }
    

//     // بدء عملية الشراء
//     else if (data === 'checkout') {
//       await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إنهاء عملية الشراء...' });

//       const cartItems = await getCart(chatId);
//       if (cartItems.length === 0) {
//         await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
//         return;
//       }

//       const shippingOptions = {
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: '📋 إدخال عنوان الشحن', callback_data: 'enter_shipping' }],
//             [{ text: '❌ إلغاء', callback_data: 'cancel_checkout' }]
//           ]
//         }
//       };

//       await bot.sendMessage(chatId, '🚚 يرجى إدخال عنوان الشحن لإكمال عملية الشراء:', shippingOptions);
//     }

//     // تفريغ السلة
//     else if (data === 'clear_cart') {
//       await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري تفريغ السلة...' });
//       const success = await clearCart(chatId);
//       await bot.sendMessage(chatId, success
//         ? '✅ تم تفريغ سلة المشتريات.'
//         : '❌ فشل تفريغ السلة. يرجى المحاولة مرة أخرى.');
//     }

//     // إدخال عنوان الشحن
//     else if (data === 'enter_shipping') {
//       await bot.answerCallbackQuery(callbackQuery.id, { text: 'جاري إعداد نموذج العنوان...' });

//       const addressInstructions = `📋 يرجى إرسال عنوان الشحن بالشكل التالي:

// الشارع: [اسم الشارع ورقم المنزل]
// المدينة: [اسم المدينة]
// الولاية/المحافظة: [اسم الولاية]
// الرمز البريدي: [الرمز البريدي]
// البلد: [اسم البلد]

// مثال:
// الشارع: 123 شارع التسوق
// المدينة: الرياض
// الولاية/المحافظة: الرياض
// الرمز البريدي: 12345
// البلد: السعودية`;

//       await bot.sendMessage(chatId, addressInstructions);

//       const addressHandler = async (addressMsg) => {
//         if (addressMsg.chat.id !== chatId) return;
//         bot.removeListener('message', addressHandler);

//         const addressText = addressMsg.text;
//         const shippingAddress = {};
//         addressText.split('\n').forEach(line => {
//           if (line.includes('الشارع:')) shippingAddress.street = line.replace('الشارع:', '').trim();
//           else if (line.includes('المدينة:')) shippingAddress.city = line.replace('المدينة:', '').trim();
//           else if (line.includes('الولاية:') || line.includes('المحافظة:')) {
//             shippingAddress.state = line.replace('الولاية:', '').replace('المحافظة:', '').trim();
//           }
//           else if (line.includes('الرمز البريدي:')) shippingAddress.zipCode = line.replace('الرمز البريدي:', '').trim();
//           else if (line.includes('البلد:')) shippingAddress.country = line.replace('البلد:', '').trim();
//         });

//         try {
//           const cartItems = await getCart(chatId);
//           if (cartItems.length === 0) {
//             await bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
//             return;
//           }

//           const orderResult = await processRealOrder(chatId, cartItems, shippingAddress, 'credit_card');
//           if (!orderResult || !orderResult.success) {
//             await bot.sendMessage(chatId, '❌ فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
//             return;
//           }

//           const orderId = orderResult.order.orderId;
//           const total = orderResult.order.totalAmount.toFixed(2);
//           const checkoutUrl = orderResult.checkout?.url;

//           await bot.sendMessage(chatId, `✅ تم إنشاء طلبك بنجاح!\n🆔 رقم الطلب: ${orderId}\n💰 المبلغ الإجمالي: ${total} USD`);

//           if (checkoutUrl) {
//             await bot.sendMessage(chatId, "💳 لإتمام عملية الدفع:", {
//               reply_markup: {
//                 inline_keyboard: [[{ text: "إتمام الدفع", web_app: { url: checkoutUrl } }]]
//               }
//             });
//             await bot.sendMessage(chatId, `💳 يرجى إكمال عملية الدفع عبر الرابط التالي:\n${checkoutUrl}`);
//           } else {
//             await bot.sendMessage(chatId, '🔗 هذا رابط تجريبي للدفع (للتطوير فقط)');
//           }
//         } catch (error) {
//           console.error('Error processing order:', error);
//           await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة الطلب.');
//         }
//       };

//       bot.on('message', addressHandler);
//     }

//     // إلغاء الشراء
//     else if (data === 'cancel_checkout') {
//       await bot.answerCallbackQuery(callbackQuery.id, { text: 'تم إلغاء عملية الشراء' });
//       await bot.sendMessage(chatId, '❌ تم إلغاء عملية الشراء.');
//     }

//     // تحديث حالة الشحن
//     else if (data.startsWith('ship:')) {
//       const [, orderId, productId] = data.split(':');
//           const result = simulateShipping(orderId, productId); // تأكد أن هذه الدالة موجودة وتحدث shippedAt
//       await bot.sendMessage(chatId, result.message);
//       await bot.answerCallbackQuery(callbackQuery.id, { text: '✅ تم التحديث إلى "تم الشحن"' });
//     }

//     // تأكيد التسليم
//     else if (data.startsWith('deliver:')) {
//       const [, orderId, productId] = data.split(':');
//       const order = orders.find(o => o.id === orderId);

//       if (!order) {
//         await bot.sendMessage(chatId, '❌ الطلب غير موجود.');
//         return;
//       }

//       const product = order.products.find(p => p.id === productId);
//       if (!product) {
//         await bot.sendMessage(chatId, '❌ المنتج غير موجود.');
//         return;
//       }

//       product.shippingStatus = 'delivered';
//       product.deliveredAt = Date.now();
//       saveOrders(); // تأكد أن هذه الدالة تحفظ التحديثات

//       await bot.sendMessage(chatId, `📬 تم تأكيد تسليم المنتج (${product.title}) بنجاح!`);
//       await bot.answerCallbackQuery(callbackQuery.id, { text: '📬 تم التحديث إلى "تم التسليم"' });
//     }

//     else if (
//       data === 'sort_price_asc' ||
//       data === 'sort_price_desc' ||
//       data === 'sort_rating_desc' ||
//       data === 'sort_orders_desc'
//     ) {
//       const products = userSessions[chatId]?.searchResults || [];

//       if (products.length === 0) {
//         await bot.sendMessage(chatId, '❌ لا توجد نتائج لعرضها.');
//         return;
//       }

//       // ترتيب حسب الاختيار
//       switch (data) {
//         case 'sort_price_asc':
//           products.sort((a, b) => a.price - b.price);
//           break;
//         case 'sort_price_desc':
//           products.sort((a, b) => b.price - a.price);
//           break;
//         case 'sort_rating_desc':
//           products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
//           break;
//         case 'sort_orders_desc':
//           products.sort((a, b) => (b.orders || 0) - (a.orders || 0));
//           break;
//       }

//       // عرض المنتجات من كلا المتجرين
//       for (const product of products.slice(0, 10)) {
//         try {
//           const storeIcon = product.store === 'Amazon' ? '🏪' : '🛒';
//           const title = product.title || 'منتج بدون عنوان';
//           const price = product.price || 'غير متوفر';
//           const originalPrice = product.original_price ? `(كان: ${product.original_price})` : '';
//           const rating = product.rating || 'غير متوفر';
//           const orders = product.orders || 'غير متوفر';
//           const shipping = product.shipping || 'غير محدد';
//           const discount = product.discount ? `🎁 خصم: ${product.discount}` : '';
//           const commission = product.commission_rate ? `${(product.commission_rate * 100).toFixed(1)}%` : 'غير متوفرة';
//           const url = product.affiliate_link || product.url || '#';
//           const image = product.image && product.image.startsWith('http') ? product.image : null;

//           const caption = `
// ${storeIcon} *${product.store}*
// 📦 *${title}*
// 💰 السعر: ${price} ${originalPrice}
// ⭐ التقييم: ${rating}
// 🛒 الطلبات: ${orders}
// 🚚 الشحن: ${shipping}
// ${discount}
// 🔗 [عرض المنتج](${url})

// *💼 عمولة: ${commission}*
//           `.trim();

//           const keyboard = {
//             inline_keyboard: [
//               [
//                 { text: '🔗 عرض المنتج', url },
//                 { text: '🛒 إضافة إلى السلة', callback_data: `add_to_cart_${product.id}` }
//               ]
//             ]
//           };

//           if (image) {
//             await bot.sendPhoto(chatId, image, {
//               caption,
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           } else {
//             await bot.sendMessage(chatId, caption, {
//               parse_mode: 'Markdown',
//               reply_markup: keyboard
//             });
//           }

//         } catch (error) {
//           console.error(`خطأ أثناء عرض المنتج ${product.id}:`, error);
//           await bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض أحد المنتجات.');
//         }
//       }

//       await bot.answerCallbackQuery(callbackQuery.id);
//     }

//   } catch (error) {
//     console.error('Error handling callback query:', error);
//     await bot.answerCallbackQuery(callbackQuery.id, { text: '❌ حدث خطأ أثناء المعالجة.' });
//   }
// });

//   bot.onText(/\/checkout/, async (msg) => {
//     const chatId = msg.chat.id;
    
//     try {
//       const cartItems = await getCart(chatId);
      
//       if (cartItems.length === 0) {
//         bot.sendMessage(chatId, '❌ سلة المشتريات فارغة. لا يمكن إنهاء الشراء.');
//         return;
//       }
      
//       // طلب معلومات الشحن من المستخدم
//       const shippingOptions = {
//         reply_markup: {
//           inline_keyboard: [
//             [{ text: '📋 إدخال عنوان الشحن', callback_data: 'enter_shipping' }],
//             [{ text: '❌ إلغاء', callback_data: 'cancel_checkout' }]
//           ]
//         }
//       };
      
//       bot.sendMessage(chatId, '🚚 يرجى إدخال عنوان الشحن لإكمال عملية الشراء:', shippingOptions);
      
//     } catch (error) {
//       console.error('Error starting checkout:', error);
//       bot.sendMessage(chatId, '❌ حدث خطأ أثناء بدء عملية الشراء.');
//     }
//   });

//   // ========== أمر عرض سلة المشتريات ==========
//   bot.onText(/\/cart/, async (msg) => {
//     const chatId = msg.chat.id;
    
//     try {
//       const cartItems = await getCart(chatId);
      
//       if (cartItems.length === 0) {
//         bot.sendMessage(chatId, '🛒 سلة المشتريات فارغة.');
//         return;
//       }
      
//       let total = 0;
//       let message = '🛒 *سلة المشتريات*\n\n';
      
//       for (const item of cartItems) {
//         const itemTotal = item.price * item.quantity;
//         total += itemTotal;
        
//         message += `📦 ${item.title}\n`;
//         message += `💰 ${item.price} USD x ${item.quantity} = ${itemTotal.toFixed(2)} USD\n`;
//         message += `🏪 ${item.store}\n`;
//         message += `🔗 [عرض المنتج](${item.url})\n`;
//         message += '────────────────────\n';
//       }
      
//       message += `\n*المجموع: ${total.toFixed(2)} USD*`;
      
//       const keyboard = {
//         inline_keyboard: [
//           [{ text: '✅ إنهاء الشراء', callback_data: 'checkout' }],
//           [{ text: '🗑️ تفريغ السلة', callback_data: 'clear_cart' }]
//         ]
//       };
      
//       bot.sendMessage(chatId, message, {
//         parse_mode: 'Markdown',
//         reply_markup: keyboard
//       });
      
//     } catch (error) {
//       console.error('Error showing cart:', error);
//       bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض سلة المشتريات.');
//     }
//   });

//   // ========== أمر الطلبات ==========
// bot.onText(/\/orders/, async (msg) => {
//   const chatId = msg.chat.id;

//   try {
//     const orders = await getUserOrders(chatId);

//     if (orders.length === 0) {
//       bot.sendMessage(chatId, '📦 لم تقم بأي طلبات حتى الآن.');
//       return;
//     }

//     let message = '📦 *طلباتك السابقة*\n\n';

//     for (const order of orders.slice(0, 5)) {
//       message += `🆔 رقم الطلب: ${order.orderId}\n`;
//       message += `💰 المبلغ: ${order.totalAmount.toFixed(2)} ${order.currency || 'USD'}\n`;
//       message += `📊 الحالة العامة: ${order.status}\n`;
//       message += `💳 الدفع: ${order.paymentStatus}\n`;
//       message += `📅 التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-EG')}\n`;

//       if (order.products && order.products.length > 0) {
//         message += `🛍️ المنتجات:\n`;
//         for (const product of order.products) {
//           const statusEmoji = product.shippingStatus === 'shipped' ? '✅' :
//                               product.shippingStatus === 'delivered' ? '📬' : '⏳';
//           const tracking = product.trackingUrl ? `\n🔗 تتبع: ${product.trackingUrl}` : '';
//           message += `  - ${product.title} (${product.source})\n    الحالة: ${product.shippingStatus} ${statusEmoji}${tracking}\n`;
//         }
//       }

//       message += '────────────────────\n';
//     }

//     if (orders.length > 5) {
//       message += `\nو${orders.length - 5} طلبات أخرى...`;
//     }

//     bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

//   } catch (error) {
//     console.error('Error showing orders:', error);
//     bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض الطلبات.');
//   }
// });


//   // ========== أمر العمولات ==========
//   bot.onText(/\/earnings/, async (msg) => {
//     const chatId = msg.chat.id;
    
//     try {
//       const commissions = await getCommissions(chatId);
//       const totalEarnings = await getTotalEarnings(chatId);
      
//       if (commissions.length === 0) {
//         bot.sendMessage(chatId, '💰 لم تحصل على أي عمولات حتى الآن.');
//         return;
//       }
      
//       let message = '💰 *عمولاتك*\n\n';
      
//       for (const commission of commissions.slice(0, 5)) {
//         message += `📦 ${commission.productTitle}\n`;
//         message += `🏪 ${commission.store}\n`;
//         message += `💵 المبلغ: ${commission.saleAmount.toFixed(2)} USD\n`;
//         message += `📊 العمولة: ${(commission.commissionRate * 100).toFixed(1)}%\n`;
//         message += `💰 قيمة العمولة: ${commission.commissionAmount.toFixed(2)} USD\n`;
//         message += `📊 الحالة: ${commission.status}\n`;
//         message += '────────────────────\n';
//       }
      
//       message += `\n*إجمالي الأرباح: ${totalEarnings.toFixed(2)} USD*`;
      
//       if (commissions.length > 5) {
//         message += `\nو${commissions.length - 5} عمولة أخرى...`;
//       }
      
//       bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
//     } catch (error) {
//       console.error('Error showing earnings:', error);
//       bot.sendMessage(chatId, '❌ حدث خطأ أثناء عرض العمولات.');
//     }
//   });

//   // ========== أمر المساعدة مع معلومات حالة قاعدة البيانات ==========
//   bot.onText(/\/start|\/help/, (msg) => {
//     const chatId = msg.chat.id;
//     const dbStatus = dbConnected ? '✅ متصلة بـ MongoDB' : '⚠️ باستخدام التخزين المحلي';
//     const paymentStatus = process.env.STRIPE_SECRET_KEY ? '✅ Stripe (حقيقي)' : '⚠️ تجريبي (لتطوير)';
    
//     const message = `
//   مرحباً! 👋 أنا بوت للبحث في المتاجر العالمية.

//   *حالة النظام:*
//   💾 ${dbStatus}
//   💳 ${paymentStatus}

//   *المتاجر المدعومة:*
//   🏪 Amazon - عمولة 5%
//   🛒 AliExpress - عمولة 8%

//   *أوامر البحث:*
//   /search [كلمة] - البحث في جميع المتاجر
//   /search_amazon [كلمة] - البحث في أمازون فقط  
//   /search_aliexpress [كلمة] - البحث في AliExpress فقط

//   *أوامر العرض:*
//   /display_mixed - عرض عشوائي
//   /display_price - حسب السعر (الأرخص أولاً)
//   /display_rating - حسب التقييم (الأعلى أولاً)
//   /display_orders - حسب المبيعات (الأكثر مبيعاً)
//   /display_store - حسب المتجر (Amazon أولاً)

//   *أوامر السلة والطلبات:*
//   /cart - عرض سلة المشتريات
//   /checkout - بدء عملية الشراء
//   /orders - عرض الطلبات السابقة
//   /earnings - عرض العمولات والأرباح

//   *مثال:*
//   /search laptop
//   /display_price
//   /cart
//   /checkout
//     `;
    
//     bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});
//   });

// const userSessions = {};


//   const sessions = {};
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   bot.on('message', async (msg) => {
//     const chatId = msg.chat.id;
//     const text = msg.text;

//     try {
//       // معالجة معلومات الشحن
//       // if (userSessions[chatId] && userSessions[chatId].step === 'shipping_info') {
//       //   const shippingInfo = parseShippingInfo(text);
//       //   userSessions[chatId].shippingInfo = shippingInfo;
        
//       //   await showPaymentOptions(chatId, userSessions[chatId]);
//       // }
//       // // معالجة معلومات البطاقة
//       // else if (userSessions[chatId] && userSessions[chatId].step === 'card_info') {
//       //   const cardParts = text.split('\n');
//       //   if (cardParts.length >= 3) {
//       //     const cardInfo = {
//       //       number: cardParts[0].trim(),
//       //       expiry: cardParts[1].trim(),
//       //       cvv: cardParts[2].trim()
//       //     };
          
//       //     if (validateCard(cardInfo.number, cardInfo.expiry, cardInfo.cvv)) {
//       //       userSessions[chatId].cardInfo = cardInfo;
//       //       await processPayment(chatId, userSessions[chatId]);
//       //     } else {
//       //       await bot.sendMessage(chatId, '❌ معلومات البطاقة غير صحيحة. يرجى المحاولة مرة أخرى.');
//       //     }
//       //   } else {
//       //     await bot.sendMessage(chatId, '❌ يرجى إرسال المعلومات بالصيغة الصحيحة.');
//       //   }
//       // }
//       // معالجة الصور
//        if (msg.photo) {
//         try {
//           const fileId = msg.photo[msg.photo.length - 1].file_id;
//           const fileLink = await bot.getFileLink(fileId);
//           const axiosResponse = await axios.get(fileLink, { 
//             responseType: 'arraybuffer' 
//           });

//           const formData = new FormData();
//           formData.append('image', Buffer.from(axiosResponse.data), { 
//             filename: 'image.png', 
//             contentType: 'image/png' 
//           });
//           formData.append('message', msg.caption || '');
//           formData.append('sessionId', chatId.toString());

//           const response = await axios.post(
//             `http://localhost:${PORT}/chat2`, 
//             formData, 
//             { 
//               headers: formData.getHeaders(),
//               timeout: 30000
//             }
//           );

//           if (response.data.action === 'remove-bg') {
//             await bot.sendPhoto(
//               chatId, 
//               Buffer.from(response.data.imageBase64, 'base64'),
//               { caption: response.data.message }
//             );
//           } else if (response.data.reply) {
//             await bot.sendMessage(chatId, response.data.reply);
//           }

//         } catch (error) {
//           console.error('Image processing error:', error);
//           await bot.sendMessage(
//             chatId, 
//             '❌ حدث خطأ في معالجة الصورة. يرجى المحاولة لاحقاً.'
//           );
//         }
//       }
//       // معالجة الرسائل العادية
// else if (text && !text.startsWith('/')) {
//   try {
//     const intentPrompt = `
//     هل النص التالي يدل على أن المستخدم يبحث عن منتج؟ أجب فقط بكلمة واحدة: "search" أو "chat".
//     النص: "${text}"
//     `;
//     const intentModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//     const intentResult = await intentModel.generateContent(intentPrompt);
//     const intent = intentResult.response.text().trim().toLowerCase();

//     if (intent === 'search') {
//       const keywordPrompt = `
// المستخدم كتب وصفًا لمنتج يريده. استخرج منه استعلامًا دقيقًا باللغة الإنجليزية يصلح للبحث في Amazon، بحيث يكون مطابقًا قدر الإمكان لعناوين المنتجات الفعلية.

// - استخدم تنسيق مثل: "Apple iPhone 13 512GB Silver Unlocked"
// - لا تستخدم عبارات عامة مثل "maximum storage" أو "largest capacity"
// - إذا لم يذكر المستخدم السعة، استنتجها فقط إذا كانت واضحة من السياق
// - لا تضف كلمات مثل "cheap", "replica", "used" إلا إذا وردت صراحة

// وصف المستخدم:
// "${text}"
//       `;
//       const keywordResult = await intentModel.generateContent(keywordPrompt);
//       const keywords = keywordResult.response.text().trim();

//       const amazonProducts = await searchAmazonProducts(keywords);
//       const aliExpressProducts = await searchAliExpressProducts(keywords);
//       const productsToSend = [...amazonProducts, ...aliExpressProducts];

//       if (productsToSend.length === 0) {
//         await bot.sendMessage(chatId, '❌ لم يتم العثور على منتجات مطابقة.');
//       } else {
//         // حفظ النتائج مؤقتًا في جلسة المستخدم
//         userSessions[chatId] = userSessions[chatId] || {};
//         userSessions[chatId].searchResults = productsToSend;

//         // إرسال خيارات الترتيب للمستخدم
//         const sortOptions = {
//           reply_markup: {
//             inline_keyboard: [
//               [
//                 { text: '🔽 الأرخص أولاً', callback_data: 'sort_price_asc' },
//                 { text: '🔼 الأغلى أولاً', callback_data: 'sort_price_desc' }
//               ],
//               [
//                 { text: '⭐ الأعلى تقييماً', callback_data: 'sort_rating_desc' },
//                 { text: '📦 الأكثر طلباً', callback_data: 'sort_orders_desc' }
//               ]
//             ]
//           }
//         };
//         await bot.sendMessage(chatId, 'كيف تود عرض النتائج؟', sortOptions);
//       }

//     } else {
//       if (!sessions[chatId]) sessions[chatId] = [];
//       sessions[chatId].push({ role: 'user', parts: [{ text: text }] });

//       const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//       const result = await model.generateContent({ contents: sessions[chatId] });
//       const reply = result.response.text();
//       sessions[chatId].push({ role: 'model', parts: [{ text: reply }] });

//       await bot.sendMessage(chatId, reply);
//     }

//   } catch (error) {
//     console.error('خطأ في معالجة الرسالة:', error);
//     await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة رسالتك. يمكنك استخدام /search للبحث عن منتج معين.');
//   }
// }

//     } catch (error) {
//       console.error('Message processing error:', error);
//       await bot.sendMessage(chatId, '❌ حدث خطأ أثناء معالجة رسالتك.');
//     }
//   });
//   async function decideTool(text, hasImage) {
//     const prompt = `
//     حدد نوع الطلب من التالي بناءً على النص ووجود صورة:

//     remove-bg (إذا طلب إزالة خلفية وكانت هناك صورة)
//     edit-image (إذا طلب تعديل الصورة وكانت هناك صورة)
//     chat (إذا كان طلبًا نصيًا عاديًا)

//     النص: "${text}"
//     هل يوجد صورة: ${hasImage ? 'نعم' : 'لا'}
//     النوع:
//     `;

//     try {
//       const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//       const response = await model.generateContent(prompt);
      
//       const tool = response.response.text().trim().toLowerCase();
//       if (tool.includes('remove-bg') || tool.includes('remove background')) return 'remove-bg';
//       if (tool.includes('edit-image') || tool.includes('edit image')) return 'edit-image';
//       if (tool.includes('search') || tool.includes('search')) return 'search';
//       return 'chat'
//     //  ;

//     } catch (error) {
//       console.error('خطأ في تحديد الأداة:', error);
//       return 'chat';
//     }
//   }
// const ytdlp = new YtDlp();
// //   app.post('/download', async (req, res) => {
// //   try {
// //     const { url } = req.body;

// //     if (!url) {
// //       return res.status(400).json({ error: 'يرجى إرسال رابط الفيديو' });
// //     }

// //     console.log(`📥 جاري تحميل الفيديو من: ${url}`);

// //     // تحديد مسار حفظ الفيديو
// //     const outputPath = path.join(__dirname, 'downloads');
// //     if (!fs.existsSync(outputPath)) {
// //       fs.mkdirSync(outputPath);
// //     }

// //     // اسم الملف الناتج
// //     const fileName = `video_${Date.now()}.mp4`;
// //     const filePath = path.join(outputPath, fileName);

// //     // تحميل الفيديو
// //     await ytdlp.downloadAsync(url, {
// //       output: filePath,
// //       format: 'mp4', // يمكنك تغييره حسب الحاجة
// //     });

// //     console.log(`✅ تم التحميل: ${filePath}`);

// //     // إرسال رابط التحميل للعميل
// //     res.json({
// //       success: true,
// //       message: 'تم تحميل الفيديو بنجاح',
// //       file: `/videos/${fileName}`
// //     });

// //   } catch (error) {
// //     console.error('❌ خطأ أثناء التحميل:', error);
// //     res.status(500).json({ error: 'فشل تحميل الفيديو' });
// //   }
// // });

// // تقديم الملفات المحملة عبر رابط مباشر
// app.use('/videos', express.static(path.join(__dirname, 'downloads')));
// // 2. تحويل نص إلى صوت
// app.post('/text-to-speech/:voiceId', async (req, res) => {
//   try {
//     const voiceId = req.params.voiceId;
//     const { text, stability = 0.5, similarity_boost = 0.5 } = req.body;

//     const response = await axios.post(
//       `${BASE_URL}/text-to-speech/${voiceId}`,
//       { text, voice_settings: { stability, similarity_boost } },
//       {
//         headers: {
//           'xi-api-key': process.env.ELEVENLABS_KEY,
//           'Content-Type': 'application/json'
//         },
//         responseType: 'arraybuffer'
//       }
//     );

//     res.set('Content-Type', 'audio/mpeg');
//     res.send(response.data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// const speech = require('@google-cloud/speech');
// const textToSpeech = require('@google-cloud/text-to-speech');
// const client = new speech.SpeechClient({
//   credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
// });
// const client2 = new textToSpeech.TextToSpeechClient({
//   credentials: JSON.parse(process.env.GOOGLE_TEXT_TO_SPEESH_KE),
// });
// const sessions2 = {}; // لتخزين المحادثات حسب sessionId

// app.post('/api/speech-to-voice', async (req, res) => {
//   try {
//     const audioBytes = req.body.audio;
//     const voiceId = req.body.voiceId || '9BWtsMINqrJLrRacOk9x';
//     const sessionId = req.body.sessionId || 'default-session';

//     // 1. تحويل الصوت إلى نص
//     const [response] = await client.recognize({
//       audio: { content: audioBytes },
//       config: {
//         encoding: 'WEBM_OPUS',
//         sampleRateHertz: 48000,
//         languageCode: 'ar-SA',
//       },
//     });

//     const transcription = response.results
//       .map(result => result.alternatives[0].transcript)
//       .join('\n');

//     console.log('🎤 Transcription:', transcription);

//     // 2. إعداد جلسة Gemini
//     if (!sessions2[sessionId]) sessions2[sessionId] = [];

//     sessions2[sessionId].push({
//       role: 'user',
//       parts: [{ text: transcription }]
//     });

//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

//     const result = await model.generateContent({
//       contents: sessions2[sessionId]
//     });

//     const reply = result.response.text();
//     console.log('💬 Gemini Reply:', reply);

//     sessions2[sessionId].push({
//       role: 'model',
//       parts: [{ text: reply }]
//     });



    
// const intentPrompt = `
// أنت مصنف نوايا ذكي. مهمتك تحديد نوع الرسالة التي كتبها المستخدم بدقة عالية.

// التصنيفات الممكنة:
// - search = عندما يبحث المستخدم عن منتج أو خدمة للشراء أو المقارنة أو معرفة الأسعار أو المواصفات.
// - chat = عندما يطرح المستخدم سؤالاً معلوماتياً أو يطلب شرحاً أو يتحدث بشكل عام أو يطلب مساعدة غير متعلقة بالشراء أو التحميل.
// - download = عندما يطلب المستخدم تحميل فيديو أو ملف أو مقطع صوتي من رابط أو يذكر كلمة تحميل أو تنزيل أو رابط فيديو.

// القواعد:
// 1. إذا كان النص يحتوي على نية شراء أو بحث عن منتج أو مقارنة أسعار → صنفه "search".
// 2. إذا كان النص سؤالاً تعليمياً أو نقاشياً أو تعريفياً → صنفه "chat".
// 3. إذا كان النص يحتوي على رابط فيديو أو ملف أو يذكر التحميل أو التنزيل أو الصيغة (mp4, mp3, pdf...) → صنفه "download".
// 4. لا تعتمد على كلمة واحدة فقط، بل على المعنى الكامل للجملة.
// 5. إذا كان النص غامضاً، اختر "chat" إلا إذا كان هناك دليل واضح على نية الشراء أو التحميل.

// أمثلة:
// "أريد شراء آيفون 14 برو ماكس" → search
// "كم سعر آيفون 14 برو ماكس" → search
// "أفضل لابتوب للألعاب بسعر رخيص" → search
// "ما هو فلاتر" → chat
// "اشرح لي ما هو الذكاء الاصطناعي" → chat
// "كيف أتعلم البرمجة" → chat
// "أرخص كاميرا كانون للتصوير الاحترافي" → search
// "متى تأسست شركة مايكروسوفت" → chat
// "حمل لي هذا الفيديو https://youtube.com/xxxx" → download
// "أريد تحميل مقطع mp3 من هذا الرابط" → download
// "نزّل لي الفيديو بصيغة mp4" → download

// الآن، صنف النص التالي بكلمة واحدة فقط: "search" أو "chat" أو "download".
// النص: "${reply}"
// `;


//     const intentModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//     const intentResult = await intentModel.generateContent(intentPrompt);
//     const intent = intentResult.response.text().trim().toLowerCase();
//     if(intent==="search"){
//     console.log('is search');

//       const keywordPrompt = `
// المستخدم كتب وصفًا لمنتج يريده. استخرج منه استعلامًا دقيقًا باللغة الإنجليزية يصلح للبحث في Amazon، بحيث يكون مطابقًا قدر الإمكان لعناوين المنتجات الفعلية.

// - استخدم تنسيق مثل: "Apple iPhone 13 512GB Silver Unlocked"
// - لا تستخدم عبارات عامة مثل "maximum storage" أو "largest capacity"
// - إذا لم يذكر المستخدم السعة، استنتجها فقط إذا كانت واضحة من السياق
// - لا تضف كلمات مثل "cheap", "replica", "used" إلا إذا وردت صراحة

// وصف المستخدم:
// "${reply}"
//       `;
//       const keywordResult = await intentModel.generateContent(keywordPrompt);
//       const keywords = keywordResult.response.text().trim();





//     if (!keywords) {
//       return res.status(400).json({ error: 'Query is required' });
//     }

//     const [amazonProducts, aliExpressProducts] = await Promise.all([
//       searchAmazonProducts(keywords),
//       searchAliExpressProducts(keywords),
//     ]);

//     const allProducts = [...amazonProducts, ...aliExpressProducts ];
//     console.log(allProducts.length);
//     res.json({
//       success: true,
//       count: allProducts.length,
//       products: allProducts
//     });
//     }
//     else if(intent==="download"){
//       console.log("is donwload");

//   const urlMatch = query.match(/https?:\/\/[^\s]+/);
//       if (!urlMatch) return res.status(400).json({ error: '❌ لم يتم العثور على رابط صالح في الرسالة' });

//       const videoUrl = urlMatch[0];

//       return res.json({
//         action: 'choose_format',
//         formats: ['mp4', 'mp3'],
//         videoUrl,
//         message: 'اختر الصيغة التي تريد تحميل الملف بها'
//       });
  
//   // const urlMatch = query.match(/https?:\/\/[^\s]+/);
//   // if (!urlMatch) {
//   //   return res.status(400).json({ error: 'لم يتم العثور على رابط صالح في الرسالة' });
//   // }

//   // const videoUrl = urlMatch[0];
//   // const fileId = `video_${Date.now()}`;
//   // const fileName = `${fileId}.mp4`;
//   // const tempPath = path.join(__dirname, 'downloads', fileName);

//   // downloadProgress[fileId] = '0';

//   // const ytProcess = spawn('yt-dlp', ['-f', 'mp4', '-o', tempPath, videoUrl], {
//   //   stdio: ['ignore', 'pipe', 'pipe']
//   // });

//   // let firstProgressSent = false;

//   // ytProcess.stdout.on('data', (data) => {
//   //   const output = data.toString();
//   //   const match = output.match(/\[download\]\s+([\d.]+)%/);
//   //   if (match) {
//   //     downloadProgress[fileId] = match[1];
//   //     console.log(`📊 التقدم: ${match[1]}%`);

//   //     if (!firstProgressSent) {
//   //       firstProgressSent = true;
//   //       res.json({
//   //         action: 'download',
//   //         file: `http://localhost:8000/videos/${fileName}`,
//   //         progressId: fileId,
//   //         message: 'جاري تحميل الفيديو...'
//   //       });
//   //     }
//   //   }
//   // });

//   // ytProcess.on('close', () => {
//   //   downloadProgress[fileId] = '100';
//   //   console.log(`✅ التحميل اكتمل: ${fileName}`);
//   // });
// }
//     else {

//       let contentType = 'audio/mpeg';
//  const request  = 
//     { input: {text: reply},
//      voice: {languageCode: 'ar-SA', ssmlGender: 'NEUTRAL'},
//      audioConfig: {audioEncoding: 'MP3'},
//     };
//     const [response2] = await client2.synthesizeSpeech(request);
//      res.set('Content-Type', contentType);
//    res.send(response2.audioContent);
//     }
//     // 3. تحويل النص إلى صوت باستخدام ElevenLabs
//     // let audioData;
    
    
//     // try {
//     //   const ttsResponse = await axios.post(
//     //     `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
//     //     {
//     //       text: reply,
//     //       voice_settings: {
//     //         stability: 0.5,
//     //         similarity_boost: 0.5
//     //       }
//     //     },
//     //     {
//     //       headers: {
//     //         'xi-api-key': process.env.ELEVENLABS_KEY,
//     //         'Content-Type': 'application/json',
//     //         'accept': 'audio/mpeg'
//     //       },
//     //       responseType: 'arraybuffer',
//     //       timeout: 15000
//     //     }
//     //   );

//     //   audioData = ttsResponse.data;
//     // } catch (ttsError) {
//     //   console.error('🔁 ElevenLabs TTS failed:', ttsError.message);
//     //   throw new Error('تحويل النص إلى صوت باستخدام ElevenLabs فشل');
//     // }

//     // 4. إرسال الصوت للواجهة
//    ;

//   } catch (error) {
//     console.error('❌ Error details:', {
//       message: error.message,
//       response: error.response?.data,
//       stack: error.stack
//     });

//     const statusCode = error.response?.status || 500;
//     res.status(statusCode).json({
//       error: 'حدث خطأ أثناء المعالجة',
//       details: error.response?.data || error.message,
//       suggestion: 'تحقق من مفاتيح API أو الصيغة أو الرصيد المتاح'
//     });
//   }
// });



// // إضافة هذه الـ routes بعد تعريف app
// app.post('/api/search', async (req, res) => {
//   try {
//     const { query } = req.body;
    
//     if (!query) {
//       return res.status(400).json({ error: 'Query is required' });
//     }

//     const [amazonProducts, aliExpressProducts] = await Promise.all([
//       searchAmazonProducts(query),
//       searchAliExpressProducts(query),
//       // searchEbayProducts(query)
//     ]);

//     const allProducts = [...amazonProducts, ...aliExpressProducts];
    
//     res.json({
//       success: true,
//       count: allProducts.length,
//       products: allProducts
//     });

//   } catch (error) {
//     console.error('Search API error:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }
// });

// app.post('/api/search/:store', async (req, res) => {
//   try {
//     const { store } = req.params;
//     const { query } = req.body;

//     if (!query) {
//       return res.status(400).json({ error: 'Query is required' });
//     }

//     let products = [];
    
//     switch (store) {
//       case 'amazon':
//         products = await searchAmazonProducts(query);
//         break;
//       case 'aliexpress':
//         products = await searchAliExpressProducts(query);
//         break;
//       case 'ebay':
//         products = await searchEbayProducts(query);
//         break;
//       default:
//         return res.status(400).json({ error: 'Invalid store' });
//     }

//     res.json({
//       success: true,
//       count: products.length,
//       products: products
//     });

//   } catch (error) {
//     console.error('Store search API error:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }
// });
//   const upload = multer({ storage: multer.memoryStorage() });
//   let downloadProgress = {};


// app.get('/progress/:id', (req, res) => {
//   const id = req.params.id;

//   res.setHeader('Content-Type', 'text/event-stream');
//   res.setHeader('Cache-Control', 'no-cache');
//   res.setHeader('Connection', 'keep-alive');

//   if (!(id in downloadProgress)) {
//     res.write(`data: 0\n\n`);
//     res.end();
//     return;
//   }

//   let lastSent = null;

//   const interval = setInterval(() => {
//     const status = downloadProgress[id] || '0';

//     // لا ترسل نفس القيمة مرتين
//     if (!res.writableEnded && status !== lastSent) {
//       res.write(`data: ${status}\n\n`);
//       lastSent = status;
//     }

//     // إنهاء البث فقط إذا كانت الحالة "done"
//     if (status === 'done') {
//       clearInterval(interval);
//       res.end();
//     }
//   }, 1000);

//   // حماية من البث الطويل جدًا
//   const timeout = setTimeout(() => {
//     clearInterval(interval);
//     res.end();
//   }, 5 * 60 * 1000); // 5 دقائق

//   // تنظيف عند إغلاق الاتصال
//   req.on('close', () => {
//     clearInterval(interval);
//     clearTimeout(timeout);
//   });
// });
// app.get("/test",(req,res)=>{
// console.log("is test in phon is succsessfuly");
// });



// app.post("/generate-image2", upload.single("image"), async (req, res) => {
//   const traceId = crypto.randomUUID();
//   console.log(`[${traceId}] ✅ Request received`);

//   try {
//     const { message: prompt, sessionId } = req.body;
//     console.log(prompt);

//     if (!req.file) {
//       console.warn(`[${traceId}] ⚠️ No image uploaded`);
//       return res.status(400).json({ error: "No image uploaded" });
//     }

//     const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
//     if (!allowedTypes.includes(req.file.mimetype)) {
//       console.warn(`[${traceId}] ⚠️ Unsupported image type`);
//       return res.status(400).json({ error: "Unsupported image type" });
//     }

//     const MAX_SIZE = 5 * 1024 * 1024;
//     if (req.file.size > MAX_SIZE) {
//       console.warn(`[${traceId}] ⚠️ Image too large`);
//       return res.status(400).json({ error: "Image too large (max 5MB)" });
//     }

//     const imageBase64 = req.file.buffer.toString("base64");
//     const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

//     let result;
//     try {
//       console.log(`[${traceId}] ⏳ Sending to Gemini...`);
//       result = await model.generateContent({
//         contents: [
//           {
//             role: "user",
//             parts: [
//               { text: prompt },
//               {
//                 inline_data: {
//                   mime_type: req.file.mimetype,
//                   data: imageBase64,
//                 },
//               },
//             ],
//           },
//         ],
//       });
//       console.log(`[${traceId}] ✅ Gemini responded`);
//       console.dir(result.candidates, { depth: null });

//     } catch (geminiError) {
//       console.error(`[${traceId}] ❌ Gemini error:`, geminiError);
//       return res.status(500).json({ error: "Gemini API failed" });
//     }

//     const returnedImage = result.candidates?.[0]?.content?.parts?.find(p => p.inline_data)?.inline_data?.data;
//     const replyText = result.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "";

//     let savedPath = null;
//     if (returnedImage) {
//       try {
//         const imageBuffer = Buffer.from(returnedImage, "base64");

//         // تحديد مجلد التنزيلات
//         const downloadsDir = path.join(
//           process.env.HOME || process.env.USERPROFILE || __dirname,
//           "Downloads"
//         );

//         // إنشاء المجلد إذا لم يكن موجودًا
//         if (!fs.existsSync(downloadsDir)) {
//           fs.mkdirSync(downloadsDir, { recursive: true });
//         }

//         const fileName = `gemini_image_${Date.now()}.png`;
//         const filePath = path.join(downloadsDir, fileName);

//         fs.writeFileSync(filePath, imageBuffer);
//         console.log(`[${traceId}] ✅ Image saved to ${filePath}`);
//         savedPath = filePath;
//       } catch (writeErr) {
//         console.error(`[${traceId}] ❌ Failed to save image:`, writeErr);
//       }
//     } else {
//       console.warn(`[${traceId}] ⚠️ No image returned from Gemini`);
//     }

//     res.status(200).json({
//       message: returnedImage ? "Image processed and saved" : "No image returned",
//       imageBase64: returnedImage || null,
//       reply: replyText,
//       savedPath,
//       sessionId,
//       traceId,
//     });

//   } catch (err) {
//     console.error(`[${traceId}] ❌ Unexpected error:`, err);
//     res.status(500).json({ error: err.message || "Unexpected server error" });
//   }
// });

//   app.post('/chat2', upload.single('image'), async (req, res) => {
//     try {
//       const { message, sessionId } = req.body;
//       // const imageFile = req.file;



//    const {  action2, format, formatId, videoUrl } = req.body;
//     const imageFile = req.file;

//     if (!sessionId) return res.status(400).json({ error: "Session ID is required" });
//     if (!message || message.trim().length === 0) return res.status(400).json({ error: "Message text is required" });


 






//       // if (!sessionId) {
//       //   return res.status(400).json({ error: "Session ID is required" });
//       // }
      
//       // if (!message || message.trim().length === 0) {
//       //   return res.status(400).json({ error: "Message text is required" });
//       // }
//   console.log(action2);
//   console.log(videoUrl);
//   console.log(format);

// if (action2 === 'choose_format' && videoUrl && format) {
//   console.log("choose_format");

//   exec(`yt-dlp -F "${videoUrl}"`, (error, stdout, stderr) => {
//     if (error) {
//       console.error('❌ خطأ في yt-dlp:', error);
//       return res.status(500).json({ error: 'فشل في تحليل الصيغ' });
//     }

//     const lines = stdout.split('\n');

//     const formats = lines
//       .filter(line => line.match(/^\d+/))
//       .map(line => {
//         const parts = line.trim().split(/\s+/);
//         return {
//           id: parts[0],
//           ext: parts[1],
//           resolution: parts[2],
//           note: parts.slice(3).join(' ')
//         };
//       })
//       .filter(f => {
//         const note = f.note?.toLowerCase() || '';

//         if (format === 'mp3') {
//           // دعم الصوتيات القابلة للتحويل إلى mp3
//           return ['m4a', 'webm', 'opus'].includes(f.ext) 
//           // &&
//                 //  !note.includes('m3u8') &&
//                 //  !note.includes('untested');
//         }

//         if (format === 'mp4') {
//           // دعم الفيديوهات القابلة للدمج والتحويل إلى mp4
//           return ['mp4', 'webm'].includes(f.ext)
//           //  &&
//           //        !note.includes('m3u8') &&
//           //        !note.includes('video only') &&
//           //        !note.includes('untested');
//         }

//         return false;
//       });

//     console.log(`✅ عدد الصيغ المتاحة (${format}):`, formats.length);

//     return res.json({
//       action2: 'choose_quality',
//       availableFormats: formats,
//       videoUrl,
//       format
//     });
//   });

//   return;
// }



//     // مرحلة بدء التحميل
//     if (action2 === 'start_download' && videoUrl && formatId) {
//       console.log("start_download");
//       const fileId = `video_${Date.now()}`;
//       const extension = formatId.endsWith('mp3') ? 'mp3' : 'mp4';
//       const fileName = `${fileId}.${extension}`;
//       const tempPath = path.join(__dirname, 'downloads', fileName);

//       downloadProgress[fileId] = '0';
// // const ytArgs = format === 'mp4'
// //   ? ['-f', 'bestvideo+bestaudio', '--merge-output-format', 'mp4', '-o', tempPath, videoUrl]
// //   : ['-f', formatId, '--extract-audio', '--audio-format', 'mp3', '-o', tempPath, videoUrl];
// const ytArgs = format === 'mp3'
//   ? ['-f', formatId, '--extract-audio', '--audio-format', 'mp3', '-o', tempPath, videoUrl]
//   : ['-f', `${formatId}+bestaudio`, '--merge-output-format', 'mp4', '-o', tempPath, videoUrl];

// const ytProcess = spawn('yt-dlp', ytArgs, {
//   stdio: ['ignore', 'pipe', 'pipe']
// });

// console.log(`🛠️ أمر yt-dlp: yt-dlp -f ${formatId} -o ${tempPath} ${videoUrl}`);

//       let maxProgress = 0;

//       ytProcess.stdout.on('data', (data) => {
//          console.log('📥 بيانات التحميل:', data.toString());
//         const match = data.toString().match(/\[download\]\s+([\d.]+)%/);
//         if (match) {
//           const current = parseFloat(match[1]);
//           if (current > maxProgress) {
//             maxProgress = current;
//             downloadProgress[fileId] = maxProgress.toFixed(1);
//             console.log(`📊 التقدم: ${maxProgress.toFixed(1)}%`);
//           }
//         }
//       });

      

//       ytProcess.on('close', () => {
//         downloadProgress[fileId] = '100';
//         console.log(`✅ التحميل اكتمل: ${fileName}`);
//       });

//       return res.json({
//         action2: 'start_download',
//         file: `http://localhost:8000/videos/${fileName}`,
//         progressId: fileId
//       });
//     }

//       const action = await decideTool(message, !!imageFile);

//       if (action === 'remove-bg' && imageFile) {
//         try {
//           const form = new FormData();
//           form.append('image_file', imageFile.buffer, { 
//             filename: imageFile.originalname 
//           });
          
//           const removeBgResponse = await axios.post(
//             'https://api.remove.bg/v1.0/removebg', 
//             form, 
//             {
//               headers: { 
//                 ...form.getHeaders(), 
//                 'X-Api-Key': process.env.REMOVEBG_KEY 
//               },
//               responseType: 'arraybuffer',
//             }
//           );

//           return res.json({
//             action: 'remove-bg',
//             imageBase64: removeBgResponse.data.toString('base64'),
//             message: "تم إزالة الخلفية بنجاح"
//           });

//         } catch (error) {
//           console.error('Remove.bg error:', error);
//           return res.status(500).json({ 
//             error: "فشل في إزالة الخلفية" 
//           });
//         }

//       } else if (action === 'edit-image' && imageFile) {
//         try {
//           return res.json({
//             action: 'edit-image',
//             message: "خدمة تعديل الصور حالياً غير متاحة، جاري العمل عليها"
//           });

//         } catch (error) {
//           console.error('Image editing error:', error);
//           return res.status(500).json({ 
//             error: "فشل في تعديل الصورة" 
//           });
//         }

//       } 
//       else {
//            // مرحلة اختيار الصيغة
  
//   try {
//     const  query  = message;
   

// const intentPrompt = `
// أنت مصنف نوايا ذكي. مهمتك تحديد نوع الرسالة التي كتبها المستخدم بدقة عالية.

// التصنيفات الممكنة:
// - search = عندما يبحث المستخدم عن منتج أو خدمة للشراء أو المقارنة أو معرفة الأسعار أو المواصفات.
// - chat = عندما يطرح المستخدم سؤالاً معلوماتياً أو يطلب شرحاً أو يتحدث بشكل عام أو يطلب مساعدة غير متعلقة بالشراء أو التحميل.
// - download = عندما يطلب المستخدم تحميل فيديو أو ملف أو مقطع صوتي من رابط أو يذكر كلمة تحميل أو تنزيل أو رابط فيديو.

// القواعد:
// 1. إذا كان النص يحتوي على نية شراء أو بحث عن منتج أو مقارنة أسعار → صنفه "search".
// 2. إذا كان النص سؤالاً تعليمياً أو نقاشياً أو تعريفياً → صنفه "chat".
// 3. إذا كان النص يحتوي على رابط فيديو أو ملف أو يذكر التحميل أو التنزيل أو الصيغة (mp4, mp3, pdf...) → صنفه "download".
// 4. لا تعتمد على كلمة واحدة فقط، بل على المعنى الكامل للجملة.
// 5. إذا كان النص غامضاً، اختر "chat" إلا إذا كان هناك دليل واضح على نية الشراء أو التحميل.

// أمثلة:
// "أريد شراء آيفون 14 برو ماكس" → search
// "كم سعر آيفون 14 برو ماكس" → search
// "أفضل لابتوب للألعاب بسعر رخيص" → search
// "ما هو فلاتر" → chat
// "اشرح لي ما هو الذكاء الاصطناعي" → chat
// "كيف أتعلم البرمجة" → chat
// "أرخص كاميرا كانون للتصوير الاحترافي" → search
// "متى تأسست شركة مايكروسوفت" → chat
// "حمل لي هذا الفيديو https://youtube.com/xxxx" → download
// "أريد تحميل مقطع mp3 من هذا الرابط" → download
// "نزّل لي الفيديو بصيغة mp4" → download

// الآن، صنف النص التالي بكلمة واحدة فقط: "search" أو "chat" أو "download".
// النص: "${query}"
// `;


//     const intentModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//     const intentResult = await intentModel.generateContent(intentPrompt);
//     const intent = intentResult.response.text().trim().toLowerCase();
//     if(intent==="search"){
//     console.log('is search');

//       const keywordPrompt = `
// المستخدم كتب وصفًا لمنتج يريده. استخرج منه استعلامًا دقيقًا باللغة الإنجليزية يصلح للبحث في Amazon، بحيث يكون مطابقًا قدر الإمكان لعناوين المنتجات الفعلية.

// - استخدم تنسيق مثل: "Apple iPhone 13 512GB Silver Unlocked"
// - لا تستخدم عبارات عامة مثل "maximum storage" أو "largest capacity"
// - إذا لم يذكر المستخدم السعة، استنتجها فقط إذا كانت واضحة من السياق
// - لا تضف كلمات مثل "cheap", "replica", "used" إلا إذا وردت صراحة

// وصف المستخدم:
// "${query}"
//       `;
//       const keywordResult = await intentModel.generateContent(keywordPrompt);
//       const keywords = keywordResult.response.text().trim();





//     if (!keywords) {
//       return res.status(400).json({ error: 'Query is required' });
//     }

//     const [amazonProducts, aliExpressProducts] = await Promise.all([
//       searchAmazonProducts(keywords),
//       searchAliExpressProducts(keywords),
//     ]);

//     const allProducts = [...amazonProducts, ...aliExpressProducts ];
//     console.log(allProducts.length);
//     res.json({
//       success: true,
//       count: allProducts.length,
//       products: allProducts
//     });
//     }
//     else if(intent==="download"){
//       console.log("is donwload");

//   const urlMatch = query.match(/https?:\/\/[^\s]+/);
//       if (!urlMatch) return res.status(400).json({ error: '❌ لم يتم العثور على رابط صالح في الرسالة' });

//       const videoUrl = urlMatch[0];

//       return res.json({
//         action: 'choose_format',
//         formats: ['mp4', 'mp3'],
//         videoUrl,
//         message: 'اختر الصيغة التي تريد تحميل الملف بها'
//       });
  
//   // const urlMatch = query.match(/https?:\/\/[^\s]+/);
//   // if (!urlMatch) {
//   //   return res.status(400).json({ error: 'لم يتم العثور على رابط صالح في الرسالة' });
//   // }

//   // const videoUrl = urlMatch[0];
//   // const fileId = `video_${Date.now()}`;
//   // const fileName = `${fileId}.mp4`;
//   // const tempPath = path.join(__dirname, 'downloads', fileName);

//   // downloadProgress[fileId] = '0';

//   // const ytProcess = spawn('yt-dlp', ['-f', 'mp4', '-o', tempPath, videoUrl], {
//   //   stdio: ['ignore', 'pipe', 'pipe']
//   // });

//   // let firstProgressSent = false;

//   // ytProcess.stdout.on('data', (data) => {
//   //   const output = data.toString();
//   //   const match = output.match(/\[download\]\s+([\d.]+)%/);
//   //   if (match) {
//   //     downloadProgress[fileId] = match[1];
//   //     console.log(`📊 التقدم: ${match[1]}%`);

//   //     if (!firstProgressSent) {
//   //       firstProgressSent = true;
//   //       res.json({
//   //         action: 'download',
//   //         file: `http://localhost:8000/videos/${fileName}`,
//   //         progressId: fileId,
//   //         message: 'جاري تحميل الفيديو...'
//   //       });
//   //     }
//   //   }
//   // });

//   // ytProcess.on('close', () => {
//   //   downloadProgress[fileId] = '100';
//   //   console.log(`✅ التحميل اكتمل: ${fileName}`);
//   // });
// }
//     else {
//     console.log('is text');
//     console.log(query);

//        if (!sessions[sessionId]) {
//           sessions[sessionId] = [];
//         }
        
//         sessions[sessionId].push({ 
//           role: 'user', 
//           parts: [{ text: message }] 
//         });

//         try {
//           const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
//           const result = await model.generateContent({ 
//             contents: sessions[sessionId] 
//           });
          
//           const reply = result.response.text();
          
//           sessions[sessionId].push({ 
//             role: 'model', 
//             parts: [{ text: reply }] 
//           });

//           if (sessions[sessionId].length > 10) {
//             sessions[sessionId] = sessions[sessionId].slice(-10);
//           }

//           return res.json({ 
//             action: 'chat', 
//             reply 
//           });

//         } catch (error) {
//           console.error('Chat error:', error);
//           return res.json({ 
//             action: 'chat', 
//             reply: 'عذراً، حدث خطأ في المعالجة. يرجى المحاولة مرة أخرى.' 
//           });
//         }
//     }

//   } catch (error) {
//     console.error('Search API error:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Internal server error' 
//     });
//   }

//       }
      

//     } catch (error) {
//       console.error("Error processing request:", error);
//       return res.status(500).json({ 
//         error: "Internal server error" 
//       });
//     }
//   });

//   // ========== routes API للدفع الحقيقي ==========
// app.post('/api/create-checkout-session', async (req, res) => {
//   try {
//     const { amount, currency = 'usd', metadata = {} } = req.body;
//     if (!amount) return res.status(400).json({ error: 'Amount is required' });

//     const checkoutResult = await createStripeCheckoutSession(amount, currency, metadata);
//     if (checkoutResult.success) {
//       return res.json({ success: true, url: checkoutResult.url });
//     } else {
//       return res.status(400).json({ success: false, error: checkoutResult.error });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// });

//   app.post('/api/cart', async (req, res) => {
//     try {
//       const { telegramId, product } = req.body;
      
//       if (!telegramId || !product) {
//         return res.status(400).json({ error: 'Telegram ID and product are required' });
//       }
      
//       const success = await addToCart(telegramId, product);
//       res.json({ success });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   });

//   app.get('/api/cart/:telegramId', async (req, res) => {
//     try {
//       const { telegramId } = req.params;
//       const cartItems = await getCart(telegramId);
//       res.json({ success: true, cart: cartItems });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   });

//   app.post('/api/order', async (req, res) => {
//     try {
//       const { telegramId, shippingAddress } = req.body;
      
//       if (!telegramId) {
//         return res.status(400).json({ error: 'Telegram ID is required' });
//       }
      
//       const cartItems = await getCart(telegramId);
      
//       if (cartItems.length === 0) {
//         return res.status(400).json({ error: 'Cart is empty' });
//       }
      
//       const order = await processRealOrder(telegramId, cartItems, shippingAddress, 'credit_card');
//       res.json({ success: true, order });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   });

//   app.get('/health', (req, res) => {
//     res.json({ 
//       status: 'OK', 
//       message: 'Server is running',
//       database: dbConnected ? 'MongoDB' : 'Local Storage',
//       payment: process.env.STRIPE_SECRET_KEY ? 'Stripe (Real)' : 'Mock (Development)',
//       affiliate: {
//         amazon: process.env.AMAZON_AFFILIATE_TAG ? 'Active' : 'Inactive',
//         aliexpress: process.env.ALIEXPRESS_AFFILIATE_ID ? 'Active' : 'Inactive'
//       }
//     });
//   });

//   // ========== تشغيل السيرفر مع الاتصال بقاعدة البيانات ==========
//   async function startServer() {
//     try {
//       // await connectToMongoDB();
      
//       app.listen(PORT, () => {
//         console.log(`✅ Server running on port ${PORT}`);
//         console.log(`🤖 Telegram bot started`);
//         // console.log(`💾 Database: ${dbConnected ? 'MongoDB' : 'Local Storage'}`);
//         console.log(`💳 Payment: ${process.env.STRIPE_SECRET_KEY ? 'Stripe (Real)' : 'Mock (Development)'}`);
//         if (process.env.AMAZON_AFFILIATE_TAG) console.log(`🏪 Amazon affiliate: ${process.env.AMAZON_AFFILIATE_TAG}`);
//         if (process.env.ALIEXPRESS_AFFILIATE_ID) console.log(`🛒 AliExpress affiliate: ${process.env.ALIEXPRESS_AFFILIATE_ID}`);
//       });
//     } catch (error) {
//       console.error('Failed to start server:', error);
//       process.exit(1);
//     }
//   }

//   startServer();
// app.post('/checkout', async (req, res) => {
//   try {
//     // ✅ 1. استقبال البيانات من الطلب
//     const priceInDollars = parseFloat(req.body.price);
//     const priceInCents = Math.round(priceInDollars * 100); // Stripe يتعامل بالسنت
//     const itemName = req.body.itmename;
//     const userId = req.body.userId;
//     const userEmail = req.body.userEmail;

//     // ✅ 2. إنشاء رابط نجاح آمن باستخدام session_id
//     const successUrl = 'https://ghidhaalruwhusa.com/success?session_id={CHECKOUT_SESSION_ID}';
//     const cancelUrl = 'https://ghidhaalruwhusa.com/cancel';

//     // ✅ 3. إنشاء جلسة Stripe Checkout
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: [{
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: itemName,
//           },
//           unit_amount: priceInCents,
//         },
//         quantity: 1,
//       }],
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//       customer_email: userEmail,
//       automatic_tax: { enabled: true },
//       shipping_address_collection: {
//         allowed_countries: ['US', 'CA', 'GB', 'SA'],
//       },
//       metadata: {
//         productName: itemName,
//         userId: userId,
//       },
//     });

//     // ✅ 4. إرسال رابط الدفع إلى الواجهة أو البوت
//     res.json({ url: session.url });

//   } catch (error) {
//     console.error('Stripe Checkout Error:', error);
//     res.status(500).send('حدث خطأ أثناء إنشاء جلسة الدفع');
//   }
// });

//   // ========== معالجة الأخطاء ==========
//   process.on('unhandledRejection', (reason, promise) => {
//     console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   });

//   process.on('uncaughtException', (error) => {
//     console.error('Uncaught Exception:', error);
//     process.exit(1);
//   });



