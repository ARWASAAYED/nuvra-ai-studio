-- Create public.users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Policy 1: Anyone can view user profiles
CREATE POLICY "Users can view all profiles"
  ON public.users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, bio, created_at, updated_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.profile->>'name', NEW.profile->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.profile->>'avatar_url',
    NEW.profile->>'bio',
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    bio = COALESCE(EXCLUDED.bio, public.users.bio),
    updated_at = NOW(),
    last_sign_in_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger on auth.users when a user is created or updated
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users from auth.users into public.users
INSERT INTO public.users (id, email, name, avatar_url, bio, created_at, updated_at, last_sign_in_at)
SELECT
  id,
  email,
  COALESCE(profile->>'name', profile->>'nickname', split_part(email, '@', 1)),
  profile->>'avatar_url',
  profile->>'bio',
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW()),
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;
