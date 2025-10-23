-- Script to create missing profiles for existing users
-- Run this to fix any users who don't have profiles

-- Insert profiles for users who don't have them yet
INSERT INTO public.profiles (id, display_name, preferred_language)
SELECT 
    au.id,
    COALESCE(
        au.raw_user_meta_data ->> 'display_name',
        split_part(au.email, '@', 1),
        'Unknown User'
    ) as display_name,
    COALESCE(
        au.raw_user_meta_data ->> 'preferred_language',
        'en'
    ) as preferred_language
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check if the operation was successful
SELECT 
    'Total auth users' as type, 
    COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
    'Total profiles' as type, 
    COUNT(*) as count 
FROM public.profiles
UNION ALL
SELECT 
    'Users missing profiles' as type, 
    COUNT(*) as count 
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
