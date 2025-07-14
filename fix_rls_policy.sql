-- Signup sırasında profile creation için policy ekleme
-- (Eğer yukarıdaki test başarısız olursa bu kodu çalıştırın)

-- Mevcut signup policy'sini kontrol et
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'users_profiles' 
AND policyname = 'Enable insert for authenticated users during signup';

-- Eğer bu policy çalışmıyorsa, daha geniş bir policy ekle
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert their own profile"
ON public.users_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Veya signup sırasında geçici olarak RLS'i bypass eden policy
CREATE POLICY IF NOT EXISTS "Allow profile creation during signup"
ON public.users_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Mevcut policy'leri listele
SELECT tablename, policyname, cmd, permissive, with_check
FROM pg_policies 
WHERE tablename = 'users_profiles'
ORDER BY policyname;