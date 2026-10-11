# Tiles Hub: Emergent के बिना पूरा सेटअप (सब कुछ मुफ़्त सर्विसेज़ पर)

कुल 3 हिस्से हैं: (1) डेटाबेस, (2) बैकएंड + AI, (3) APK। इसी क्रम में करें।

## 1. डेटाबेस: MongoDB Atlas (मुफ़्त)
1. mongodb.com/cloud/atlas पर अकाउंट बनाएँ, मुफ़्त **M0** क्लस्टर चुनें।
2. **Database Access** में एक यूज़र बनाएँ (यूज़रनेम + पासवर्ड नोट कर लें)।
3. **Network Access** > Add IP Address > **Allow access from anywhere** (0.0.0.0/0)।
4. Connect > Drivers से कनेक्शन स्ट्रिंग कॉपी करें। वह `mongodb+srv://...` से शुरू होती है। उसमें `<password>` की जगह अपना पासवर्ड डालें।

## 2. AI की चाबी: Google Gemini (मुफ़्त चाबी)
1. aistudio.google.com/apikey खोलकर Create API key दबाएँ और चाबी कॉपी करें।
2. ध्यान दें: इमेज बनाने वाले मॉडल पर Google की मुफ़्त सीमा बदलती रहती है। सीमा पूरी हो जाए तो वही पेज बिलिंग जोड़ने को कहेगा। तब तक ऐप डेमो इमेज पर चलता रहेगा।

## 3. बैकएंड: Render (मुफ़्त)
1. यह प्रोजेक्ट GitHub repo में डालें (GITHUB_GUIDE देखें)।
2. render.com पर GitHub से साइन-इन करें > New > **Blueprint** > अपनी repo चुनें। `render.yaml` अपने आप पढ़ा जाएगा।
3. पूछे जाने पर दो मान भरें: `MONGO_URL` (ऊपर वाली स्ट्रिंग) और `GEMINI_API_KEY`।
4. Deploy करें। 3-5 मिनट बाद ऊपर एक पता दिखेगा, जैसे `https://tiles-hub-backend.onrender.com`। उसके आगे `/api/tiles` जोड़कर ब्राउज़र में खोलें। टाइल्स की सूची दिखे तो बैकएंड चालू है।
5. मुफ़्त प्लान में सर्वर 15 मिनट बेकार रहने पर सो जाता है, और अगली बार पहला रिक्वेस्ट 30-60 सेकंड लेता है। यह सामान्य है।

## 4. ऐप को नए बैकएंड से जोड़ें
GitHub में `frontend/.env.android` खोलें, पेंसिल (Edit) दबाएँ और यह लाइन बदलें:
```
VITE_API_BASE=https://tiles-hub-backend.onrender.com
```
(अपना असली Render पता डालें, अंत में `/` या `/api` नहीं), फिर Commit करें।

## 5. APK बनाएँ
Actions > Build Android APK > Run workflow > पूरा होने पर Artifacts से `tiles-hub-apk` डाउनलोड करके फोन में इंस्टॉल करें।
