from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Importación de routers
from app.api.v1.endpoints import auth as auth_router
from app.api.v1.endpoints import admin as admin_router
from app.api.v1.endpoints import books as books_router

from app.api.v1.endpoints.auth import router as auth_router



app = FastAPI(
    title="API de Reconocimiento Facial (DeepFace) & Librería",
    version="1.0.0"
)

# 1. Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # O ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Captura global de errores
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno en el servidor: {str(exc)}"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# 3. Registro de Routers
# Como auth.router ya contiene prefix="/auth", al agregar prefix="/api/v1"
# la ruta final para todos los endpoints de auth será: /api/v1/auth/...
#app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(books_router.router, prefix="/api/v1/books", tags=["Books"])
app.include_router(auth_router, prefix="/api/v1/auth")

@app.get("/")
def read_root():
    return {"status": "Servidor backend activo."}