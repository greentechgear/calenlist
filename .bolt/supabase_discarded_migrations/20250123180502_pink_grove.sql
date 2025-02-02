-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
BEGIN
  -- Get display_name from metadata or fallback to email
  display_name := COALESCE(
    (new.raw_user_meta_data->>'display_name')::text,
    split_part(new.email, '@', 1)
  );

  -- Insert into profiles with proper error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      created_at
    )
    VALUES (
      new.id,
      new.email,
      display_name,
      now()
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- If profile already exists, update it
      UPDATE public.profiles
      SET
        email = new.email,
        display_name = display_name,
        updated_at = now()
      WHERE id = new.id;
    WHEN OTHERS THEN
      -- Log any other errors but don't fail
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
      RETURN new;
  END;

  RETURN new;
END;
$$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon;