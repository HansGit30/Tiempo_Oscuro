import os

# 1. Limitar hilos y logs de TensorFlow ANTES de importar otras librerías
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import tensorflow as tf
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace

# Importación de routers limpia
from app.api.v1.endpoints import auth as auth_router
from app.api.v1.endpoints import admin as admin_router
from app.api.v1.endpoints import books as books_router


# Evento de inicio/cierre para precargar el modelo liviano en memoria
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Precargar el modelo SFace en lugar de Facenet para optimizar la RAM en Render
        DeepFace.build_model("SFace")
        print("Modelo SFace precargado exitosamente en memoria.")
    except Exception as e:
        print(f"Advertencia al precargar el modelo DeepFace: {e}")
    yield


app = FastAPI(
    title="API de Reconocimiento Facial (DeepFace) & Librería",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración de CORS
origins = [
    "https://tiempo-oscuro-5ck5-kappa.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "*"  # Permite todos los orígenes durante pruebas
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Captura global de errores
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno en el servidor: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"}
    )


# Registro de Routers
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(books_router.router, prefix="/api/v1/books", tags=["Books"])


@app.get("/")
def read_root():
    return {"status": "Servidor backend activo."}