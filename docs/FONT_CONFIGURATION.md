# Font Configuration for ConnectList

## Overview

The ConnectList app uses Inter font across all platforms (Web, iOS, Android) with proper online font loading.

## Configuration

### Web Platform
- **Font Source**: Google Fonts CDN
- **Configuration**: `app.json` includes Google Fonts CSS link
- **Fallback**: System fonts (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`)

### Mobile Platforms (iOS/Android)
- **iOS**: Uses system Inter font with `-apple-system` fallback
- **Android**: Uses Roboto as fallback to Inter
- **Configuration**: Platform-specific font families in `styles/global.ts`

## Font Weights Available

- `thin`: 100
- `light`: 300
- `regular`: 400 (default)
- `medium`: 500
- `semibold`: 600
- `bold`: 700
- `extrabold`: 800
- `black`: 900

## Usage

Import and use the `fontConfig` object in your components:

```typescript
import { fontConfig } from '../styles/global';

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    ...fontConfig.semibold,
    color: '#1F2937',
  },
  body: {
    fontSize: 14,
    ...fontConfig.regular,
    color: '#6B7280',
  },
});
```

## Files Modified

1. **`styles/global.ts`**: Updated fontConfig to return objects with fontFamily and fontWeight
2. **`app/_layout.tsx`**: Simplified font loading to rely on system fonts
3. **`app.json`**: Optimized Google Fonts configuration for web
4. **`styles/fonts.css`**: Added web-specific CSS for optimal font rendering

## Benefits

1. **Performance**: Uses system fonts on mobile, avoiding font file downloads
2. **Consistency**: Inter font across all platforms
3. **Fallbacks**: Proper system font fallbacks for each platform
4. **Online**: No local font files required
5. **Compatibility**: Works with existing code using spread operator