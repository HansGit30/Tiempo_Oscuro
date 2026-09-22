import json
import ast
import traceback
import os
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import numpy as np

# Servicios e importaciones del proyecto principal
from app.services.face_service import FaceService
from app.db.supabase import supabase

# Importar cliente admin (Service Role Key) para bypass de RLS
try:
    from app.db.supabase import supabase_admin
except ImportError:
    supabase_admin = supabase

router = APIRouter(tags=["Autenticación Facial & Tradicional"])
security = HTTPBearer()

# --- CONSTANTES DE AUTENTICACIÓN FACIAL ---
MIN_MATCH_PERCENTAGE = 82.0  # Porcentaje mínimo requerido para dar acceso
FACE_THRESHOLD = 0.52        # Umbral adaptado para SFace (hasta ~0.52 L2)
ADMIN_EMBEDDING_CACHE = None

# Forzamos modelo y detector estándar en TODOS los endpoints para evitar descuadre de vectores (128 dims)
DEFAULT_MODEL = "SFace"
DEFAULT_DETECTOR = "opencv"

# --- SCHEMAS PYDANTIC ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SupplierRequestSchema(BaseModel):
    company_name: str
    email: EmailStr
    publishers_handled: str

# ==========================================
# HELPER FUNCTIONS & CACHÉ FACIAL
# ==========================================

def parse_embedding(raw_embedding) -> list:
    if isinstance(raw_embedding, list):
        return [float(x) for x in raw_embedding]
    if isinstance(raw_embedding, str):
        cleaned = raw_embedding.strip()
        try:
            return [float(x) for x in json.loads(cleaned)]
        except Exception:
            return [float(x) for x in ast.literal_eval(cleaned)]
    raise ValueError("Formato de embedding no válido")

def get_cached_admin_embedding():
    global ADMIN_EMBEDDING_CACHE
    if ADMIN_EMBEDDING_CACHE is None:
        try:
            client = supabase_admin if supabase_admin else supabase
            result = client.table("admin_face_profile").select("face_embedding").execute()
            if result.data and len(result.data) > 0:
                parsed = parse_embedding(result.data[0]["face_embedding"])
                if parsed and len(parsed) > 0:
                    ADMIN_EMBEDDING_CACHE = parsed
                    print("✅ Vector de Administrador cargado exitosamente en Caché RAM.")
        except Exception as e:
            print(f"❌ Error leyendo Supabase en caché: {e}")
    return ADMIN_EMBEDDING_CACHE

def calculate_similarity_percentage(distance: float) -> float:
    """
    SFace con Distancia Coseno:
    - Distancia <= 0.20 -> 90% a 100% match
    - Distancia == 0.38 -> ~82% match (Umbral de corte)
    - Distancia >= 0.65 -> 0% match
    """
    if distance <= 0.0:
        return 100.0
    
    max_threshold = 0.65
    if distance >= max_threshold:
        return 0.0

    # Conversión lineal/exponencial suave basada en distancia coseno
    similarity = (1.0 - (distance / max_threshold)) * 100.0
    return round(max(0.0, min(100.0, similarity)), 1)

# ==========================================
# HELPER / DEPENDENCY (JWT USER VALIDATION)
# ==========================================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    client = supabase_admin if supabase_admin else supabase
    user_id = None
    user_email = None

    try:
        response = client.auth.get_user(token)
        if response and response.user:
            user_id = response.user.id
            user_email = response.user.email
    except Exception:
        pass

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
            user_email = payload.get("email")
        except Exception as jwt_err:
            print(f"❌ Error al decodificar JWT local: {jwt_err}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo autenticar la identidad del usuario",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        profile_response = client.from_("profiles").select("*").eq("id", user_id).execute()
        profile_data = profile_response.data[0] if profile_response.data else {}

        return {
            "id": user_id,
            "email": user_email or profile_data.get("email"),
            "role": profile_data.get("role", "customer"),
            "company_name": profile_data.get("company_name"),
            "publisher_id": profile_data.get("publisher_id"),
            "full_name": profile_data.get("full_name")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener el perfil de usuario: {str(e)}"
        )

# ==========================================
# ENDPOINTS DE RECONOCIMIENTO FACIAL
# ==========================================

# Usamos 'def' síncrono para delegar el cálculo CPU-bound al threadpool de FastAPI
@router.post("/scan-live")
async def scan_live(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        current_embedding = await FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_MODEL, 
            detector_backend=DEFAULT_DETECTOR, 
            enforce_detection=False
        )

        if not current_embedding or len(current_embedding) == 0:
            return {
                "detected": False, 
                "match_percentage": 0, 
                "similarity": 0, 
                "similarity_percentage": 0,
                "distance": 1.0
            }

        admin_emb = get_cached_admin_embedding()
        if not admin_emb:
            return {
                "detected": True, 
                "match_percentage": 0, 
                "similarity": 0, 
                "similarity_percentage": 0,
                "distance": 1.0
            }

        if len(current_embedding) != len(admin_emb):
            print(f"⚠️ Descuadre de vectores: Detección={len(current_embedding)}, Registrado={len(admin_emb)}")
            return {
                "detected": True, 
                "match_percentage": 0, 
                "similarity": 0, 
                "similarity_percentage": 0,
                "distance": 1.0
            }

        distance = FaceService.calculate_distance(current_embedding, admin_emb)
        match_percentage = calculate_similarity_percentage(distance)

        return {
            "detected": True,
            "match_percentage": match_percentage,
            "similarity": match_percentage,
            "similarity_percentage": match_percentage,
            "distance": round(float(distance), 4)
        }
    except Exception as e:
        print(f"❌ Error interno en scan_live: {e}")
        return {
            "detected": False, 
            "match_percentage": 0, 
            "similarity": 0, 
            "similarity_percentage": 0,
            "distance": 1.0
        }
    finally:
        await file.close()


@router.post("/login-face")
async def login_face(file: UploadFile = File(...)):
    try:
        # 1. Lectura del archivo enviado
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail="El archivo enviado está vacío."
            )
        
        # 2. Extracción del embedding facial (OBLIGATORIO 'await')
        current_embedding = await FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_MODEL, 
            detector_backend=DEFAULT_DETECTOR, 
            enforce_detection=False
        )
        
        if not current_embedding or len(current_embedding) == 0:
            raise HTTPException(
                status_code=400, 
                detail="No se detectó un rostro claro. Centra tu cara y mejora la iluminación."
            )

        client = supabase_admin if supabase_admin else supabase
        admin_emb = get_cached_admin_embedding()
        user_id = None
        
        # 3. Obtener el perfil facial y el ID de usuario registrado
        if not admin_emb:
            response = client.table("admin_face_profile").select("face_embedding, user_id").execute()
            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=404, 
                    detail="No hay ningún rostro registrado en la base de datos."
                )
            
            first_row = response.data[0]
            admin_emb = parse_embedding(first_row.get("face_embedding"))
            user_id = first_row.get("user_id")
        else:
            response = client.table("admin_face_profile").select("user_id").limit(1).execute()
            if response.data:
                user_id = response.data[0].get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=404,
                detail="El registro facial no está vinculado a ningún usuario administrador."
            )

        # 4. Validar dimensiones del modelo de vectores
        if len(current_embedding) != len(admin_emb):
            raise HTTPException(
                status_code=400, 
                detail="El modelo detectado no coincide con las dimensiones del rostro registrado."
            )
        
        # 5. Cálculo de similitud
        distance = FaceService.calculate_distance(current_embedding, admin_emb)
        match_percentage = calculate_similarity_percentage(distance)

        # 6. Validar contra el umbral (acceso concedido)
        if distance <= FACE_THRESHOLD and match_percentage >= MIN_MATCH_PERCENTAGE:
            profile_response = client.from_("profiles").select("*").eq("id", user_id).single().execute()
            
            if not profile_response.data:
                raise HTTPException(
                    status_code=404,
                    detail="No se encontró el perfil de usuario para este administrador."
                )

            profile = profile_response.data
            user_email = profile.get("email")

            secret_key = (
                os.getenv("SUPABASE_JWT_SECRET") 
                or os.getenv("JWT_SECRET") 
                or "super-secret-key-tiempooscuro"
            )

            now = datetime.now(timezone.utc)
            payload = {
                "sub": str(profile.get("id")),
                "aud": "authenticated",
                "role": "authenticated",
                "email": user_email,
                "app_metadata": {
                    "provider": "email",
                    "providers": ["email"]
                },
                "user_metadata": {
                    "full_name": profile.get("full_name", profile.get("company_name", "Administrador")),
                    "role": profile.get("role", "admin")
                },
                "iat": int(now.timestamp()),
                "exp": int((now + timedelta(hours=24)).timestamp())
            }

            access_token = jwt.encode(payload, secret_key, algorithm="HS256")

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "authenticated": True,
                "message": "Autenticación facial exitosa",
                "match_percentage": match_percentage,
                "similarity": match_percentage,
                "similarity_percentage": match_percentage,
                "user": {
                    "id": profile.get("id"),
                    "email": user_email,
                    "full_name": profile.get("full_name", profile.get("company_name", "Administrador Principal")),
                    "role": profile.get("role", "admin")
                }
            }
        else:
            raise HTTPException(
                status_code=401, 
                detail=f"Acceso denegado: Similitud insuficiente ({match_percentage}%)."
            )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno procesando la autenticación facial: {str(e)}"
        )
    finally:
        await file.close()

@router.post("/register-face")
async def register_face(file: UploadFile = File(...)):
    global ADMIN_EMBEDDING_CACHE
    
    try:
        image_bytes = await file.read()
        
        # Debe llevar 'await' porque FaceService.extract_embedding es asíncrona
        embedding = await FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_MODEL, 
            detector_backend=DEFAULT_DETECTOR, 
            enforce_detection=True
        )
        
        if not embedding or len(embedding) == 0:
            raise HTTPException(
                status_code=400, 
                detail="No se pudo detectar un rostro claro en la imagen."
            )

        embedding_json = json.dumps(embedding)

        admin_data = {
            "user_id": "11111111-1111-1111-1111-111111111111",
            "face_embedding": embedding_json
        }

        client = supabase_admin if supabase_admin else supabase
        response = client.table("admin_face_profile").upsert(admin_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=500, 
                detail="Error al guardar el vector en Supabase."
            )

        ADMIN_EMBEDDING_CACHE = embedding
        print(f"✅ Nuevo vector guardado en Caché. Longitud del vector: {len(embedding)}")

        return {
            "message": "Rostro de administrador registrado exitosamente",
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno procesando el registro: {str(e)}"
        )
    finally:
        await file.close()

# ==========================================
# ENDPOINTS DE AUTENTICACIÓN TRADICIONAL
# ==========================================

@router.post("/login")
def login(credentials: LoginRequest):
    try:
        client = supabase_admin if supabase_admin else supabase
        
        auth_response = client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Credenciales inválidas"
            )

        user_id = auth_response.user.id

        profile_response = client.from_("profiles").select("*").eq("id", user_id).execute()
        profile_data = profile_response.data[0] if (profile_response.data and len(profile_response.data) > 0) else {}

        return {
            "access_token": auth_response.session.access_token,
            "user": {
                "id": user_id,
                "email": auth_response.user.email,
                "role": profile_data.get("role", "customer"),
                "company_name": profile_data.get("company_name"),
                "full_name": profile_data.get("full_name")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"⚠️ Error detallado de Autenticación: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Credenciales inválidas: {str(e)}"
        )

@router.get("/user-profile/{user_id}")
def get_user_profile(user_id: str):
    try:
        client = supabase_admin if supabase_admin else supabase
        response = client.from_("profiles").select("id, email, role, company_name, full_name").eq("id", user_id).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        return response.data[0]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/request-supplier")
def request_supplier(data: SupplierRequestSchema):
    try:
        client = supabase_admin if supabase_admin else supabase
        response = client.from_("supplier_requests").insert({
            "company_name": data.company_name,
            "email": data.email,
            "publishers_handled": data.publishers_handled,
            "status": "pending"
        }).execute()
        return {"message": "Solicitud enviada correctamente"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/facial-lab/compare-admin")
async def compare_admin_face(file: UploadFile = File(...)):  # <--- 1. Agregar 'async'
    global ADMIN_EMBEDDING_CACHE
    try:
        image_bytes = await file.read()  # <--- 2. Usar 'await file.read()'
        
        # 3. AGREGAR 'await' AQUÍ:
        current_embedding = await FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_MODEL, 
            detector_backend=DEFAULT_DETECTOR, 
            enforce_detection=False
        )
        
        if not current_embedding or len(current_embedding) == 0:
            return {
                "similarity": 0.0,
                "match_percentage": 0.0,
                "distance": 1.0,
                "matches": False,
                "threshold": FACE_THRESHOLD,
                "similarity_threshold": MIN_MATCH_PERCENTAGE,
                "status": "no_face_detected"
            }

        admin_emb = get_cached_admin_embedding()
        if not admin_emb:
            response = supabase.table("admin_face_profile").select("face_embedding").execute()
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="No hay ningún rostro de administrador registrado en la base de datos."
                )
            admin_emb = parse_embedding(response.data[0]["face_embedding"])
            ADMIN_EMBEDDING_CACHE = admin_emb

        distance = FaceService.calculate_distance(current_embedding, admin_emb)
        match_percentage = calculate_similarity_percentage(distance)

        return {
            "similarity": float(match_percentage),
            "match_percentage": float(match_percentage),
            "similarity_percentage": float(match_percentage),
            "distance": round(float(distance), 4),
            "matches": distance <= FACE_THRESHOLD and match_percentage >= MIN_MATCH_PERCENTAGE,
            "threshold": FACE_THRESHOLD,
            "similarity_threshold": MIN_MATCH_PERCENTAGE,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en escaneo continuo del laboratorio: {str(e)}"
        )
    finally:
        await file.close()