# Tiles Hub: APK बनाने की गाइड (आसान तरीका पहले)

## तरीका A (सबसे आसान): GitHub से, कंप्यूटर पर कुछ इंस्टॉल नहीं करना
1. Emergent में "Save to GitHub" से कोड अपने GitHub पर भेजें (या github.com पर नई repo बनाकर यह पूरा प्रोजेक्ट अपलोड करें)।
2. GitHub में अपनी repo खोलें > **Actions** > **Build Android APK** > **Run workflow**।
3. 5-10 मिनट बाद बने हुए रन में नीचे **Artifacts** में `tiles-hub-apk` डाउनलोड करें।
4. ज़िप खोलकर `app-debug.apk` फोन में भेजें और इंस्टॉल करें (फोन में "Install unknown apps" की अनुमति देनी होगी)।

कैमरा की अनुमति और बाकी सब workflow अपने आप जोड़ देता है।

## तरीका B: अपने कंप्यूटर पर (Android Studio)
Node.js 22+, Yarn और Android Studio इंस्टॉल करके `frontend/` फोल्डर में:
```bash
yarn install
yarn android:sync
npx cap add android      # सिर्फ़ पहली बार
yarn android:sync
yarn android:open
```
`android/app/src/main/AndroidManifest.xml` में `<application` से ऊपर यह लाइन जोड़ें:
`<uses-permission android:name="android.permission.CAMERA" />`
फिर Android Studio में Build > Build APK(s)।

## ज़रूरी बातें
- बैकएंड ऐप के अंदर नहीं है। Emergent पर आपकी साइट चालू रहनी चाहिए। उसका पता बदले तो `.env.android` में `VITE_API_BASE` बदलें और APK दोबारा बनाएँ।
- असली AI इमेज के लिए बैकएंड में `
- Play Store पर डालने से पहले `capacitor.config.ts` में `appId` बदलें, और signed AAB बनाएँ (Build > Generate Signed Bundle)।
