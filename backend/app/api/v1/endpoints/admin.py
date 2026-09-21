import os
import jwt
import traceback
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Importar clientes de Supabase
from app.db.supabase import supabase

# Intentar usar cliente Admin para saltar políticas RLS si está definido
try:
    from app.db.supabase import supabase_admin
except ImportError:
    supabase_admin = supabase

router = APIRouter(tags=["Admin"])
security = HTTPBearer()

class SetBestSellerRequest(BaseModel):
    book_id: str

# ==========================================
# HELPER / DEPENDENCY: AUTENTICACIÓN HÍBRIDA ADMIN
# ==========================================

def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Valida que el token JWT sea válido (Supabase Auth o JWT Local Facial)
    y que el usuario posea rol de administrador ('admin').
    """
    token = credentials.credentials
    client = supabase_admin if supabase_admin else supabase
    user_id = None

    # 1. Intentar validar mediante la API de Supabase Auth (Login Tradicional)
    try:
        user_response = client.auth.get_user(token)
        if user_response and user_response.user:
            user_id = user_response.user.id
    except Exception:
        pass  # Si falla o es un JWT local, se continúa con la verificación PyJWT

    # 2. Si Supabase lo rechaza, decodificar el JWT localmente (Login Facial)
    if not user_id:
        try:
            secret_key = (
                os.getenv("SUPABASE_JWT_SECRET") 
                or os.getenv("JWT_SECRET") 
                or "super-secret-key-tiempooscuro"
            )
            
            payload = jwt.decode(
                token, 
                secret_key, 
                algorithms=["HS256"], 
                options={"verify_aud": False}
            )
            user_id = payload.get("sub")
        except Exception as jwt_err:
            print(f"❌ Error al decodificar JWT en admin: {jwt_err}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo verificar la identidad del usuario admin",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Consultar la tabla profiles para verificar que tenga el rol 'admin'
    try:
        profile_res = client.from_("profiles").select("*").eq("id", user_id).single().execute()
        
        if not profile_res.data or profile_res.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Se requieren privilegios de administrador"
            )
            
        return profile_res.data

    except HTTPException:
        raise
    except Exception as e:
        print("--- ERROR EN VERIFICACIÓN DE ROL EN PROFILES ---")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error consultando el perfil de administrador: {str(e)}"
        )

# ==========================================
# ENDPOINTS ADMINISTRATIVOS
# ==========================================

@router.post("/set-best-seller")
def set_best_seller(payload: SetBestSellerRequest, admin_user: dict = Depends(get_admin_user)):
    """Ejecuta la función RPC de PostgreSQL en Supabase"""
    client = supabase_admin if supabase_admin else supabase
    try:
        response = client.rpc("set_best_seller_book", {"p_book_id": payload.book_id}).execute()
        return {"message": "Libro más vendido actualizado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


import traceback
from fastapi import APIRouter, Depends, HTTPException, status

# Asegúrate de importar get_admin_user o get_current_user desde tu módulo de auth
# from app.api.v1.endpoints.auth import get_admin_user, supabase_admin, supabase

@router.get("/supplier-requests")
def get_supplier_requests(admin_user: dict = Depends(get_admin_user)):
    """Obtiene la lista de todas las solicitudes de proveedores (pendientes)"""
    client = supabase_admin if supabase_admin else supabase
    try:
        print(f"[DEBUG] Usuario autenticado accediendo a solicitudes: {admin_user.get('email', 'Sin Email')} (ID: {admin_user.get('id')})")

        # 1. Consultar solicitudes filtradas por estado 'pending' (o insensible a mayúsculas/minúsculas)
        response = client.from_("supplier_requests") \
            .select("*") \
            .in_("status", ["pending", "PENDING", "pendiente"]) \
            .order("created_at", desc=True) \
            .execute()

        # Si no trae resultados filtrados, hacer un fallback para traer todas si es necesario depurar
        requests_data = response.data if response.data else []
        print(f"[DEBUG] Solicitudes encontradas: {len(requests_data)}")

        return requests_data

    except Exception as e:
        print("--- ERROR EN get_supplier_requests ---")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener solicitudes de proveedores: {str(e)}"
        )


@router.post("/approve-supplier/{request_id}")
def approve_supplier_request(request_id: str, admin_user: dict = Depends(get_admin_user)):
    """Aprueba una solicitud de proveedor, crea o recupera el usuario en Auth, genera su perfil y su editorial"""
    client = supabase_admin if supabase_admin else supabase
    try:
        # 1. Obtener la solicitud pendiente de la tabla supplier_requests
        req_res = client.from_("supplier_requests").select("*").eq("id", request_id).single().execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
        supplier_data = req_res.data
        email = supplier_data["email"]
        company_name = supplier_data["company_name"]
        publisher_name = supplier_data["publishers_handled"]

        # 2. Contraseña fija asignada por el sistema
        fixed_password = "Password123*"
        new_user_id = None

        # 3. Crear el usuario en Supabase Auth mediante el cliente Admin
        try:
            auth_response = client.auth.admin.create_user({
                "email": email,
                "password": fixed_password,
                "email_confirm": True,
                "user_metadata": {"role": "supplier", "company_name": company_name}
            })
            if auth_response.user:
                new_user_id = auth_response.user.id
        except Exception as auth_err:
            # Si el usuario ya existe, lo buscamos y FORZAMOS la actualización de su contraseña temporal
            if "already been registered" in str(auth_err):
                users_list = client.auth.admin.list_users()
                existing_user = next((u for u in users_list if u.email == email), None)
                if existing_user:
                    new_user_id = existing_user.id
                    client.auth.admin.update_user_by_id(
                        new_user_id,
                        {
                            "password": fixed_password,
                            "user_metadata": {"role": "supplier", "company_name": company_name}
                        }
                    )
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail="El correo ya está registrado en Auth pero no se pudo obtener su identificador."
                    )
            else:
                raise auth_err

        # 4. Crear o actualizar el perfil en la tabla 'profiles'
        client.from_("profiles").upsert({
            "id": new_user_id,
            "email": email,
            "company_name": company_name,
            "role": "supplier",
            "is_active": True
        }).execute()

        # 5. Crear automáticamente la editorial (Publisher) vinculada al usuario
        client.from_("publishers").insert({
            "name": publisher_name,
            "supplier_id": new_user_id
        }).execute()

        # 6. Actualizar el estado de la solicitud a 'approved'
        client.from_("supplier_requests").update({
            "status": "approved"
        }).eq("id", request_id).execute()

        return {
            "message": "Proveedor aprobado con éxito",
            "email": email,
            "assigned_password": fixed_password
        }

    except HTTPException:
        raise
    except Exception as e:
        print("--- ERROR EN approve_supplier_request ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))