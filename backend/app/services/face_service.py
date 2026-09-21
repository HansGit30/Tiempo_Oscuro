import io
import asyncio
import cv2
import numpy as np
from PIL import Image
from deepface import DeepFace
from fastapi import HTTPException

class FaceService:
    @staticmethod
    def _extract_sync(img_np: np.ndarray, enforce_detection: bool) -> list[float]:
        try:
            # Convertir de RGB (PIL) a BGR (OpenCV)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            # Redimensionar si la imagen es muy pequeña para evitar errores de recorte
            height, width = img_bgr.shape[:2]
            if height < 200 or width < 200:
                img_bgr = cv2.resize(img_bgr, (640, 480), interpolation=cv2.INTER_CUBIC)

            # Extraer embedding con Facenet y fastmtcnn
            results = DeepFace.represent(
                img_path=img_bgr, 
                model_name="Facenet", 
                detector_backend="fastmtcnn",
                enforce_detection=enforce_detection
            )
            
            if not results or len(results) == 0:
                return []
            
            return results[0]["embedding"]

        except Exception:
            # Respaldo seguro si falla la detección rígida
            try:
                results = DeepFace.represent(
                    img_path=img_bgr,
                    model_name="Facenet",
                    detector_backend="opencv",
                    enforce_detection=False
                )
                if results and len(results) > 0:
                    return results[0]["embedding"]
            except Exception:
                pass
            return []

    @staticmethod
    async def extract_embedding(image_bytes: bytes, enforce_detection: bool = True) -> list[float]:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)

            if img_np.size == 0 or np.mean(img_np) < 10:
                if enforce_detection:
                    raise HTTPException(status_code=400, detail="La imagen está muy oscura o vacía.")
                return []

            embedding = await asyncio.to_thread(FaceService._extract_sync, img_np, enforce_detection)
            
            if not embedding and enforce_detection:
                raise HTTPException(
                    status_code=400, 
                    detail="No se detectó un rostro claro. Centra tu cara frente a la cámara."
                )

            return embedding

        except HTTPException:
            raise
        except Exception as e:
            if enforce_detection:
                raise HTTPException(status_code=500, detail=f"Error procesando rostro: {str(e)}")
            return []

    @staticmethod
    def calculate_distance(embedding1: list[float], embedding2: list[float]) -> float:
        if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
            return 1.0
        
        vec1 = np.array(embedding1, dtype=np.float32)
        vec2 = np.array(embedding2, dtype=np.float32)
        
        # Normalización L2 imprescindible para Facenet
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 1.0

        vec1 = vec1 / norm1
        vec2 = vec2 / norm2
        
        return float(np.linalg.norm(vec1 - vec2))