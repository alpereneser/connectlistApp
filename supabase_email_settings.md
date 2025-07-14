# Supabase Email Settings Düzeltmeleri

## 1. Site URL Settings
Supabase Dashboard → Settings → General → Site URL:

**Site URL:** `http://localhost:8081` (development için)
**Production:** `https://connectlist.me`

## 2. Redirect URLs
Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:

Şu URL'leri ekleyin:
- `http://localhost:8081/auth/callback`
- `https://connectlist.me/auth/callback`
- `connectlist://auth/callback` (mobile deep link)
- `exp://192.168.1.xxx:8081/--/auth/callback` (Expo Go için)

## 3. Email Templates
Authentication → Email Templates → Confirm signup:

**Subject:** Welcome to ConnectList! Confirm your email

**Body:** [Daha önce verdiğimiz email template'i kullanın]

**ÖNEMLI:** Redirect URL kısmını şu şekilde değiştirin:
`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`

Böylece email'deki link doğrudan uygulamanıza yönlendirecek.