# 🎯 ConnectList - Social List Sharing App

> **Modern React Native uygulaması ile kişiselleştirilmiş listeler oluşturun, paylaşın ve keşfedin.**

![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue)
![Expo](https://img.shields.io/badge/Expo-53.0.17-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## ✨ Özellikler

### 🏠 **Temel Fonksiyonlar**
- **Liste Oluşturma**: Film, dizi, kitap, oyun, mekan ve kişiler için özelleştirilmiş listeler
- **Sosyal Özellikler**: Beğenme, yorum yapma ve liste paylaşımı
- **Keşfetme**: Trend listeler ve yeni içerikler keşfetme
- **Akıllı Arama**: Çoklu platform API entegrasyonu ile gelişmiş arama
- **Profil Yönetimi**: Avatar, biyografi ve ayarlarla kişiselleştirme

### 📱 **Kullanıcı Deneyimi**
- **Instagram-tarzı Yorumlar**: Modern yorum sistemi ve gerçek zamanlı güncellemeler
- **Responsive Grid Layout**: Güzel 3 sütunlu öğe görünümü
- **Pull-to-Refresh**: Sorunsuz içerik güncellemeleri
- **Real-time Mesajlaşma**: Canlı sohbet ve bildirim sistemi
- **Cross-Platform**: iOS, Android ve Web desteği

### 🔧 **Teknik Özellikler**
- **Real-time Database**: Supabase PostgreSQL ile canlı veri senkronizasyonu
- **Authentication**: Güvenli kullanıcı kimlik doğrulama
- **File Upload**: Avatar ve resim yükleme ile bulut depolama
- **API Entegrasyonu**: TMDB, Google Books, RAWG, Yandex Places, YouTube APIs
- **Error Tracking**: Sentry ile kapsamlı hata izleme

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator (opsiyonel)

### Kurulum

```bash
# Projeyi klonlayın
git clone https://github.com/alpereneser/connectlistApp.git
cd connectlistApp

# Bağımlılıkları yükleyin
npm install

# Çevre değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını API anahtarlarınızla düzenleyin

# Geliştirme sunucusunu başlatın
npm start
```

### Çevre Değişkenleri

Kök dizinde `.env` dosyası oluşturun:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
EXPO_PUBLIC_RAWG_API_KEY=your_rawg_api_key
EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY=your_google_books_api_key
EXPO_PUBLIC_YANDEX_API_KEY=your_yandex_api_key
EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
```

## 📱 Screenshots

### Home Feed
Beautiful list feed with social interactions

### List Details
3-column grid layout with Instagram-style comments

### Profile
User profiles with list collections and social stats

### Search & Discovery
Multi-platform content search and trending discovery

## 🛠️ Tech Stack

### **Frontend**
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **Expo Router** - File-based navigation

### **Backend**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL Database
  - Real-time subscriptions
  - Authentication
  - File storage

### **External APIs**
- **TMDB API** - Movies and TV shows
- **Google Books API** - Books and literature
- **RAWG API** - Video games
- **Yandex Places API** - Location data

### **UI/UX**
- **Phosphor Icons** - Beautiful icon library
- **Custom Components** - Reusable UI components
- **Responsive Design** - Adaptive layouts

## 📂 Proje Yapısı

```
connectlistApp/
├── app/                    # Ana uygulama sayfaları (Expo Router)
│   ├── auth/              # Kimlik doğrulama sayfaları
│   ├── chat/              # Mesajlaşma sayfaları
│   ├── details/           # İçerik detay sayfaları
│   ├── topic/             # Trend topic sayfaları
│   ├── list/             # Liste detay sayfası
│   ├── index.tsx         # Ana sayfa feed
│   ├── profile.tsx       # Kullanıcı profili
│   ├── search.tsx        # Arama ve keşfetme
│   ├── create.tsx        # Liste oluşturma
│   ├── messages.tsx      # Mesajlar ana sayfası
│   ├── notifications.tsx # Bildirimler
│   ├── settings.tsx      # Kullanıcı ayarları
│   ├── discover.tsx      # İçerik keşfetme
│   ├── privacy-policy.tsx # Gizlilik politikası
│   └── terms-of-service.tsx # Kullanım şartları
├── components/            # Yeniden kullanılabilir bileşenler
│   ├── AppBar.tsx        # Navigasyon başlığı
│   ├── BottomMenu.tsx    # Alt navigasyon
│   └── ErrorBoundary.tsx # Hata sınır bileşeni
├── lib/                  # Temel yardımcı araçlar
│   ├── supabase.ts       # Veritabanı istemcisi
│   └── sentry.ts         # Hata izleme
├── services/             # Harici API servisleri
│   ├── tmdbApi.ts       # Film/Dizi verileri
│   ├── googleBooksApi.ts # Kitap verileri
│   ├── rawgApi.ts       # Oyun verileri
│   ├── yandexApi.ts     # Mekan verileri
│   └── youtubeApi.ts    # Video verileri
├── styles/              # Global stiller
│   ├── global.ts        # Tipografi ve temalar
│   └── fonts.css        # Font dosyaları
├── utils/               # Yardımcı fonksiyonlar
│   └── errorHandler.ts  # Hata yönetimi
├── supabase/           # Veritabanı migration dosyaları
└── assets/             # Statik dosyalar
    └── images/         # Uygulama görselleri
```

## 🗄️ Database Schema

### Core Tables
- `users_profiles` - User information and settings
- `lists` - User-created lists
- `list_items` - Items within lists
- `list_comments` - Comments on lists
- `list_likes` - List likes/favorites
- `categories` - Content categories

### Social Features
- `user_follows` - User following relationships
- `notifications` - Push notifications
- `user_activities` - Activity tracking

## 🔧 Development

### Running the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Building for Production

```bash
# Build for production
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 🌟 Ana Özellikler Showcase

### 📋 **Liste Yönetimi**
- **Kategori Bazlı Listeler**: Film, dizi, kitap, oyun, mekan ve kişiler
- **İçerik Ekleme**: Liste sahipleri için gerçek zamanlı arama
- **Drag & Drop Sıralama**: Kolay öğe yeniden düzenleme
- **Gizlilik Ayarları**: Herkese açık, arkadaşlar, özel seçenekleri

### 💬 **Sosyal Etkileşimler**
- **Instagram-tarzı Yorum Sistemi**: Modern yorum arayüzü
- **Gerçek Zamanlı Beğeni**: Anlık like/unlike işlemleri
- **Çapraz Platform Paylaşım**: Sosyal medya entegrasyonu
- **Kullanıcı Takibi**: Keşfetme ve takip sistemi
- **QR Kod Paylaşımı**: Liste paylaşımı için QR kod

### 🔍 **Akıllı Arama**
Çoklu platform entegrasyonu ile gelişmiş arama:
- **Filmler & Diziler**: TMDB API ile
- **Kitaplar**: Google Books API ile
- **Oyunlar**: RAWG API ile
- **Mekanlar**: Yandex Places API ile
- **Videolar**: YouTube API ile

### 💬 **Mesajlaşma Sistemi**
- **Gerçek Zamanlı Sohbet**: WebSocket tabanlı anlık mesajlaşma
- **Yazıyor Göstergesi**: Karşı tarafın yazma durumu
- **Online/Offline Durumu**: Kullanıcı aktiflik göstergesi
- **Mesaj Durumu**: Gönderildi, okundu işaretleri

### 🔔 **Bildirim Sistemi**
- **Gerçek Zamanlı Bildirimler**: Anlık notification sistemi
- **Kategori Filtreleme**: Bildirim türlerine göre sıralama
- **Toplu İşlemler**: Hepsini okundu işaretle
- **Bildirim Geçmişi**: Detaylı takip sistemi

## 🚧 Gelecek Özellikler

- [x] **Gerçek Zamanlı Mesajlaşma** - Canlı sohbet sistemi ✅
- [x] **Gerçek Zamanlı Bildirimler** - Anlık notification sistemi ✅
- [x] **İçerik Ekleme** - Liste sahipleri için dinamik içerik ekleme ✅
- [ ] **Push Notifications** - Mobil push notification desteği
- [ ] **İş Birlikli Listeler** - Çoklu kullanıcı liste düzenleme
- [ ] **Gelişmiş Arama** - Filtreler ve sıralama seçenekleri
- [ ] **AI Önerileri** - Akıllı içerik önerileri
- [ ] **Liste Şablonları** - Hazır liste şablonları
- [ ] **Dışa Aktarma** - Listeleri çeşitli formatlarda kaydetme

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Lütfen şu adımları takip edin:

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Harika özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

### Geliştirme Kuralları
- TypeScript best practice'lerini takip edin
- Anlamlı commit mesajları yazın
- Çoklu platformlarda test edin
- Dokümantasyonu güncelleyin

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- **Tech Istanbul** - Kuluçka merkezi desteği
- **Bilgiyi Ticaretleştirme Merkezi** - Teknoloji transfer desteği
- **Expo Team** - Harika geliştirme platformu
- **Supabase** - Mükemmel backend çözümü
- **TMDB** - Film ve dizi verileri
- **Google Books** - Kitap API'si
- **RAWG** - Video oyunları veritabanı
- **Yandex** - Mekan verileri
- **Phosphor Icons** - Güzel ikon kütüphanesi

## 📞 Destek

- 📧 Email: support@connectlist.me
- 🐛 Issues: [GitHub Issues](https://github.com/alpereneser/connectlistApp/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/alpereneser/connectlistApp/discussions)

## 👨‍💻 Geliştirici

**Alperen Eser**
- GitHub: [@alpereneser](https://github.com/alpereneser)
- Email: support@connectlist.me

---

<div align="center">
  <p><strong>🎯 ConnectList ile listelerinizi paylaşın, keşfedin ve bağlantı kurun!</strong></p>
  <p>Made with ❤️ in Istanbul, Turkey</p>
</div>
