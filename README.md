# 📝 ConnectList - Social List Sharing App

> A modern React Native app for creating, sharing, and discovering curated lists of movies, books, games, places, and more.

![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue)
![Expo](https://img.shields.io/badge/Expo-53.0.17-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## ✨ Features

### 🏠 **Core Functionality**
- **List Creation**: Create curated lists for movies, TV shows, books, games, places, and people
- **Social Features**: Like, comment, and share lists with the community
- **Discovery**: Explore trending lists and discover new content
- **Search**: Multi-platform search across various content APIs
- **Profile Management**: Complete user profiles with avatars, bios, and settings

### 📱 **User Experience**
- **Instagram-style Comments**: Modern comment system with real-time updates
- **Responsive Grid Layout**: Beautiful 3-column item display
- **Pull-to-Refresh**: Seamless content updates
- **Dark/Light Mode Support**: Adaptive UI design
- **Cross-Platform**: Works on iOS, Android, and Web

### 🔧 **Technical Features**
- **Real-time Database**: Supabase PostgreSQL with real-time subscriptions
- **Authentication**: Secure user auth with session management
- **File Upload**: Avatar and image upload with cloud storage
- **API Integration**: TMDB, Google Books, RAWG, Yandex Places APIs
- **Offline Support**: Cached data and offline-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/alpereneser/connectlistApp.git
cd connectlistApp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npm start
```

### Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
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

## 📂 Project Structure

```
connectlist-expo/
├── app/                    # Expo Router pages
│   ├── auth/              # Authentication screens
│   ├── details/           # Detail pages
│   ├── list/             # List detail page
│   ├── index.tsx         # Home feed
│   ├── profile.tsx       # User profile
│   ├── search.tsx        # Search & discovery
│   ├── create.tsx        # List creation
│   ├── settings.tsx      # User settings
│   └── discover.tsx      # Content discovery
├── components/            # Reusable components
│   ├── AppBar.tsx        # Navigation header
│   └── BottomMenu.tsx    # Bottom navigation
├── lib/                  # Core utilities
│   └── supabase.ts       # Database client
├── services/             # External API services
│   ├── tmdbApi.ts       # Movie/TV data
│   ├── googleBooksApi.ts # Books data
│   ├── rawgApi.ts       # Games data
│   └── yandexApi.ts     # Places data
├── styles/              # Global styles
│   └── global.ts        # Typography & themes
└── assets/              # Static assets
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

## 🌟 Key Features Showcase

### 📋 **List Management**
Create and organize lists across multiple categories with rich metadata and media integration.

### 💬 **Social Interactions**
- Instagram-style comment system
- Real-time like/unlike functionality  
- Cross-platform sharing capabilities
- User following and discovery

### 🔍 **Smart Search**
Integrated search across multiple content platforms:
- Movies & TV via TMDB
- Books via Google Books
- Games via RAWG  
- Places via Yandex

### 👤 **Rich Profiles**
- Avatar upload and management
- Bio and social links
- Privacy settings
- Activity feeds

## 🚧 Roadmap

- [ ] **Push Notifications** - Real-time notifications for social interactions
- [ ] **Collaborative Lists** - Multi-user list editing
- [ ] **Advanced Search** - Filters and sorting options
- [ ] **AI Recommendations** - Smart content suggestions
- [ ] **List Templates** - Pre-made list templates
- [ ] **Export Features** - Export lists to various formats

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test on multiple platforms
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** - Amazing development platform
- **Supabase** - Excellent backend solution
- **TMDB** - Movie and TV data
- **Google Books** - Books API
- **RAWG** - Video games database
- **Phosphor Icons** - Beautiful icon library

## 📞 Support

- 📧 Email: support@connectlist.app
- 🐛 Issues: [GitHub Issues](https://github.com/alpereneser/connectlistApp/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/alpereneser/connectlistApp/discussions)

---

<div align="center">
  <p>Made with ❤️ by the ConnectList Team</p>
  <p>
    <a href="https://connectlist.app">Website</a> •
    <a href="https://twitter.com/connectlist">Twitter</a> •
    <a href="https://instagram.com/connectlist">Instagram</a>
  </p>
</div>
