# Development Build Kılavuzu - ConnectList

## Push Notification Problemi Çözümü

Expo SDK 53+ ile birlikte, push notification özelliği Expo Go'dan kaldırılmıştır. Bu sorunu çözmek için **Development Build** kullanmanız gerekiyor.

## Development Build Nedir?

Development Build, Expo Go'nun sınırlamalarını aşarak native kodları da içeren özel bir geliştirme uygulamasıdır.

## Kurulum Adımları

### 1. EAS CLI Kurulumu
```bash
npm install -g @expo/eas-cli
eas login
```

### 2. EAS Build Konfigürasyonu
```bash
eas build:configure
```

### 3. Development Build Oluşturma
```bash
# iOS için
eas build --profile development --platform ios

# Android için  
eas build --profile development --platform android

# Her ikisi için
eas build --profile development --platform all
```

### 4. Cihaza Yükleme
- Build tamamlandığında size bir QR kod verilecek
- Bu QR kodu tarayarak uygulamayı cihazınıza yükleyin
- Alternatif olarak build URL'sini kullanabilirsiniz

### 5. Development Server Başlatma
```bash
npx expo start --dev-client
```

## Push Notification Test Etme

Development build yüklendikten sonra:

1. Uygulamayı açın
2. Giriş yapın
3. Push token otomatik olarak kaydedilecek
4. Test notification göndermek için settings sayfasını kullanın

## Hata Giderme

### Build Hatası Alıyorsanız:
```bash
# Cache temizleme
eas build:configure --clear-cache

# Tekrar deneme
eas build --profile development --platform ios --clear-cache
```

### Push Token Alamıyorsanız:
1. Cihaz ayarlarından notification izinlerini kontrol edin
2. Development build kullandığınızdan emin olun (Expo Go değil)
3. Console loglarını kontrol edin

## EAS.json Konfigürasyonu

Projenizde `eas.json` dosyası şöyle olmalı:

```json
{
  "cli": {
    "version": ">= 7.8.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## Alternatif Çözümler

### 1. Local Notification Test
```javascript
// Test için local notification kullanabilirsiniz
import { sendTestNotification } from '../hooks/usePushNotifications';

// Bir butona tıklandığında
await sendTestNotification();
```

### 2. Web Platformunda Test
Push notification web'de desteklenmediği için, sadece UI testleri yapabilirsiniz.

## Faydalı Linkler

- [Expo Development Builds Dokümantasyonu](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Kılavuzu](https://docs.expo.dev/build/introduction/)
- [Push Notification Kurulumu](https://docs.expo.dev/push-notifications/push-notifications-setup/)

## Notlar

- Development build sadece bir kez oluşturmanız yeterli
- Kod değişiklikleri için tekrar build yapmanıza gerek yok
- Sadece native dependency eklediğinizde yeni build gerekir