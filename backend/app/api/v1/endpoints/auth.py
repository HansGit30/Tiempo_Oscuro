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

try:
    from app.db.supabase import supabase_admin
except ImportError:
    supabase_admin = supabase

router = APIRouter(tags=["Autenticación Facial & Tradicional"])
security = HTTPBearer()

# --- CONSTANTES DE AUTENTICACIÓN FACIAL ---
MIN_MATCH_PERCENTAGE = 82.0 
FACE_THRESHOLD = 0.50       
ADMIN_EMBEDDING_CACHE = None

# Modelo y detector estándar para TODOS los endpoints
DEFAULT_FACE_MODEL = "SFace"
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
    if distance <= 0.0:
        return 100.0
    if distance >= 0.85:
        return 0.0
    percentage = 100.0 - (distance * 36.0)
    return round(max(0.0, min(100.0, percentage)), 1)

def calculate_lab_similarity_percentage(distance: float) -> float:
    if distance <= 0.0:
        return 100.0
    max_threshold = 0.70
    if distance >= max_threshold:
        return 0.0
    normalized = distance / max_threshold
    similarity = (1.0 - (normalized ** 0.8)) * 100.0
    return round(max(0.0, min(100.0, similarity)), 1)

# ==========================================
# ENDPOINTS OPTIMIZADOS
# ==========================================

# Se utiliza 'def' estándar para que FastAPI ejecute las tareas intensivas en hilos separados (threadpool)
@router.post("/scan-live")
def scan_live(file: UploadFile = File(...)):
    try:
        image_bytes = file.file.read()

        # Se extrae usando el modelo estándar SFace
        current_embedding = FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_FACE_MODEL,          
            detector_backend=DEFAULT_DETECTOR,  
            enforce_detection=False
        )

        if not current_embedding or len(current_embedding) == 0:
            return {"detected": False, "match_percentage": 0, "distance": 1.0}

        admin_emb = get_cached_admin_embedding()
        if not admin_emb:
            return {"detected": True, "match_percentage": 0, "distance": 1.0}

        # Validar consistencia de dimensiones
        if len(current_embedding) != len(admin_emb):
            return {"detected": True, "match_percentage": 0, "distance": 1.0, "error": "Dimension mismatch"}

        distance = FaceService.calculate_distance(current_embedding, admin_emb)
        match_percentage = calculate_similarity_percentage(distance)

        return {
            "detected": True,
            "match_percentage": match_percentage,
            "distance": round(distance, 4)
        }
    except Exception as e:
        print(f"Error en /scan-live: {e}")
        return {"detected": False, "match_percentage": 0, "distance": 1.0}

@router.post("/register-face")
def register_face(file: UploadFile = File(...)):
    global ADMIN_EMBEDDING_CACHE
    try:
        image_bytes = file.file.read()
        
        # Guardar el perfil asegurando el mismo modelo SFace
        embedding = FaceService.extract_embedding(
            image_bytes, 
            model_name=DEFAULT_FACE_MODEL, 
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
        print(f"✅ Nuevo vector guardado en Caché. Longitud: {len(embedding)}")

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