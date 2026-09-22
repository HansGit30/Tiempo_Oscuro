import io
import asyncio
import cv2
import numpy as np
from PIL import Image
from deepface import DeepFace
from fastapi import HTTPException

class FaceService:
    @staticmethod
    def _extract_sync(
        img_np: np.ndarray, 
        enforce_detection: bool, 
        model_name: str = "SFace", 
        detector_backend: str = "opencv"
    ) -> list[float]:
        try:
            # 1. Convertir de RGB (PIL) a BGR (OpenCV)
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            # 2. Reducir resolución para ahorrar RAM y CPU en Render
            h, w = img_bgr.shape[:2]
            max_dim = 320
            if max(h, w) > max_dim:
                scale = max_dim / float(max(h, w))
                new_w = int(w * scale)
                new_h = int(h * scale)
                img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

            # 3. Extraer embedding usando 'SFace' (Ultraliviano para el plan Free de Render)
            results = DeepFace.represent(
                img_path=img_bgr, 
                model_name=model_name, 
                detector_backend=detector_backend,  # Consume < 50MB de RAM por request
                enforce_detection=enforce_detection
            )
            
            if not results or len(results) == 0:
                return []
            
            return results[0]["embedding"]

        except Exception:
            # Respaldo seguro con detección forzada en False por si el encuadre es difícil
            try:
                results = DeepFace.represent(
                    img_path=img_bgr,
                    model_name=model_name,
                    detector_backend=detector_backend,
                    enforce_detection=False
                )
                if results and len(results) > 0:
                    return results[0]["embedding"]
            except Exception:
                pass
            return []

    @staticmethod
    async def extract_embedding(
        image_bytes: bytes, 
        enforce_detection: bool = True,
        model_name: str = "SFace",
        detector_backend: str = "opencv"
    ) -> list[float]:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)

            if img_np.size == 0 or np.mean(img_np) < 10:
                if enforce_detection:
                    raise HTTPException(status_code=400, detail="La imagen está muy oscura o vacía.")
                return []

            embedding = await asyncio.to_thread(
                FaceService._extract_sync, 
                img_np, 
                enforce_detection, 
                model_name, 
                detector_backend
            )
            
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
    def calculate_distance(source_representation, test_representation) -> float:
        a = np.array(source_representation, dtype=np.float32)
        b = np.array(test_representation, dtype=np.float32)
        
        # Normalización L2
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 1.0
            
        a = a / norm_a
        b = b / norm_b
        
        # Distancia Coseno = 1 - Similaridad Coseno
        cosine_similarity = np.dot(a, b)
        cosine_distance = 1.0 - cosine_similarity
        
        return float(cosine_distance)