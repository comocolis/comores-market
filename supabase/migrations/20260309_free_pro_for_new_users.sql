-- MIGRATION SUPABASE : 1 AN PRO OFFERT POUR TOUS LES NOUVEAUX INSCRITS
-- Exécutez cette requête dans l'Éditeur SQL (SQL Editor) de votre tableau de bord Supabase

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    is_pro,
    subscription_end_date
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    true, -- 👑 1 AN PRO OFFERT
    NOW() + INTERVAL '1 year' -- Date d'expiration dans 12 mois
  )
  ON CONFLICT (id) DO UPDATE SET
    is_pro = true,
    subscription_end_date = COALESCE(public.profiles.subscription_end_date, NOW() + INTERVAL '1 year');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le trigger est bien attaché à la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
