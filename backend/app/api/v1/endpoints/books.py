import traceback
from fastapi import APIRouter, HTTPException, Depends, status
from app.db.supabase import supabase, supabase_admin
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter(tags=["Books"])

@router.get("")
@router.get("/")
def get_all_books():
    try:
        response = supabase.from_("books").select("*").execute()
        return response.data
    except Exception as e:
        print("\n================ ERROR DE SUPABASE ================")
        traceback.print_exc()
        print("===================================================\n")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/best-seller")
def get_best_seller():
    try:
        response = supabase.from_("books").select("*").eq("is_best_seller", True).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="No se encontró libro más vendido")

@router.get("/supplier")
def get_supplier_books(current_user: dict = Depends(get_current_user)):
    try:
        # Usamos supabase_admin si está disponible, de lo contrario supabase normal
        client = supabase_admin if 'supabase_admin' in globals() and supabase_admin else supabase
        
        user_id = current_user.get("id")
        print(f"\n[DEBUG /supplier] Buscando libros para el user_id: {user_id}")

        if not user_id:
            return []

        # 1. Obtener las editoriales vinculadas a este proveedor
        publishers_res = client.from_("publishers").select("id").eq("supplier_id", user_id).execute()
        
        print(f"[DEBUG /supplier] Editoriales encontradas: {publishers_res.data}")

        if not publishers_res.data:
            return []

        publisher_ids = [p["id"] for p in publishers_res.data]

        # 2. Consultar los libros asociados a esas editoriales
        books_res = client.from_("books").select("*, publishers(id, name)").in_("publisher_id", publisher_ids).execute()

        print(f"[DEBUG /supplier] Libros encontrados: {len(books_res.data) if books_res.data else 0}")
        return books_res.data if books_res.data else []

    except Exception as e:
        print("\n================ ERROR EN /supplier ================")
        traceback.print_exc()
        print("===================================================\n")
        raise HTTPException(status_code=500, detail=str(e))