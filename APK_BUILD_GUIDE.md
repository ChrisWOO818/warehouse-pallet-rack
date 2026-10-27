# 📱 안드로이드 APK 파일 직접 빌드 가이드 (Capacitor 기반)

이 문서는 React 웹앱을 안드로이드 `.apk` 설치 파일로 직접 빌드하는 전체 절차를 안내합니다.

---

## 🛠️ 사전 준비물
1. **Node.js** (v18 이상 권장)
2. **Android Studio** (설치 및 Android SDK 구성)
3. **Java JDK** (JDK 17 이상)

---

## 🚀 1. Capacitor 설치 및 초기화

프로젝트 루트 폴더(`warehouse-pallet-rack`)에서 아래 명령어를 실행합니다:

```bash
cd warehouse-pallet-rack

# 1. 의존성 설치
npm install

# 2. Capacitor CLI 및 코어 설치
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Capacitor 초기화
npx cap init "창고 파렛트 렉" com.warehouse.palletrack --web-dir dist

# 4. 안드로이드 플랫폼 추가
npx cap add android
```

---

## 📦 2. 웹앱 빌드 및 안드로이드 동기화

웹 코드를 빌드하고 안드로이드 프로젝트 폴더로 복사합니다:

```bash
# Vite 프로덕션 빌드
npm run build

# 빌드 산출물을 Android 네이티브 폴더로 복사
npx cap sync
```

---

## 🔨 3. Android Studio에서 APK 생성

```bash
# Android Studio 열기
npx cap open android
```

1. **Android Studio**가 열리면 Gradle 동기화가 완료될 때까지 잠시 기다립니다.
2. 상단 메뉴에서 **[Build]** → **[Build Bundle(s) / APK(s)]** → **[Build APK(s)]**를 클릭합니다.
3. 빌드가 완료되면 우측 하단에 알림 창이 뜨며, **[locate]** 링크를 누르면 생성된 `app-debug.apk` 파일 위치로 바로 이동합니다.
   - 기본 경로: `android/app/build/outputs/apk/debug/app-debug.apk`
4. 이 `app-debug.apk` 파일을 안드로이드 스마트폰에 복사(카카오톡, 메일, USB 등)한 뒤 스마트폰에서 눌러 설치하면 끝납니다!

---

## 💡 가장 간단한 대안 (PWABuilder 사용)
위와 같이 안드로이드 스튜디오를 설치하지 않고 바로 `.apk`를 얻으려면:
1. `index.html` 파일을 웹 호스팅(GitHub Pages 또는 Vercel 등)에 올립니다.
2. **[PWABuilder](https://www.pwabuilder.com)**에 해당 주소를 입력하고 **[Package for Android]**를 누르면 1분 만에 `.apk` 파일이 즉시 다운로드됩니다.
