# backend/app/services/liveness_service.py
import numpy as np

# Guarda temporalmente los últimos vectores recibidos en memoria
history_embeddings = []

def is_live_person(current_embedding: list) -> bool:
    """
    Si los últimos 3 embeddings son idénticos al 100% (variación casi 0),
    significa que están sosteniendo una foto fija frente a la cámara.
    """
    global history_embeddings
    
    if len(history_embeddings) >= 3:
        history_embeddings.pop(0)
    
    history_embeddings.append(current_embedding)
    
    if len(history_embeddings) < 3:
        return True # Espera a acumular fotogramas
        
    # Calcular diferencia entre fotogramas seguidos
    diff1 = np.linalg.norm(np.array(history_embeddings[0]) - np.array(history_embeddings[1]))
    diff2 = np.linalg.norm(np.array(history_embeddings[1]) - np.array(history_embeddings[2]))
    
    # Si no hay variación micro-facial (pantalla inmóvil o foto impresa)
    if diff1 < 0.005 and diff2 < 0.005:
        return False # Posible ataque con foto fija

    return True