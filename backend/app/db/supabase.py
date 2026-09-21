# backend/app/db/supabase.py
from supabase import create_client, Client
from app.core.config import settings

# Verificar que las credenciales básicas estén presentes
if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    raise ValueError("Faltan las credenciales de Supabase en el archivo .env")

# Cliente estándar (usando la Anon Key)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Cliente Admin que ignora RLS (usando Service Role Key o fallback a Supabase Key)
service_key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", settings.SUPABASE_KEY)
supabase_admin: Client = create_client(settings.SUPABASE_URL, service_key)