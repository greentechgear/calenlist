/*
  # Add trigger for automatic profile creation
  
  1. Changes
    - Add function to handle profile creation on user signup
    - Create trigger to automatically create profile when user signs up
    
  2. Security
    - Function is owned by postgres to ensure it has necessary permissions
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();