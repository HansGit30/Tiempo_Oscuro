const API_BASE_URL = 'https://tiempo-oscuro.onrender.com/api/v1';

// --- Tipos de Autenticación y Usuario ---
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'supplier' | 'customer';
  company_name?: string;
  full_name?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// --- Tipos para el modelo de Libros ---
export interface Book {
  id: string;
  title: string;
  author?: string;
  price: number;
  stock: number;
  cover_url: string;
  is_best_seller: boolean;
  publishers?: { id: string; name: string };
  book_authors?: { authors: { id: string; name: string } }[];
  book_categories?: { categories: { id: string; name: string; slug: string } }[];
}

// --- Autenticación Tradicional ---
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = 'Error al iniciar sesión';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // En caso de que la respuesta de error no sea un JSON válido
    }
    throw new Error(errorMessage);
  }

  const data: LoginResponse = await response.json();

  // Guardar token y usuario en el almacenamiento local
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
};

// --- Autenticación por Reconocimiento Facial ---
export const loginFace = async (imageFile: File): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch(`${API_BASE_URL}/auth/login-face`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Acceso facial denegado';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // En caso de que la respuesta de error no sea un JSON válido
    }
    throw new Error(errorMessage);
  }

  const data: LoginResponse = await response.json();

  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
};

// --- Catálogo y Libros ---

// Obtener todos los libros del catálogo
export const fetchBooks = async (): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books`);
  if (!response.ok) {
    throw new Error('Error al obtener la lista de libros');
  }
  return await response.json();
};

// Obtener el libro Best Seller actual
export const fetchBestSeller = async (): Promise<Book> => {
  const response = await fetch(`${API_BASE_URL}/books/best-seller`);
  if (!response.ok) {
    throw new Error('Error al obtener el libro más vendido');
  }
  return await response.json();
};

// Establecer el libro más vendido (Admin)
export const setBestSeller = async (bookId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/set-best-seller`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ book_id: bookId }),
  });
  if (!response.ok) {
    throw new Error('Error al actualizar el libro más vendido');
  }
};

// Obtener libros del proveedor autenticado
export const fetchSupplierBooks = async (token: string): Promise<Book[]> => {
  const response = await fetch(`${API_BASE_URL}/books/supplier`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener el catálogo del proveedor');
  }

  return await response.json();
};

export interface FaceComparisonResult {
  similarity: number;
  distance: number;
  matches: boolean;
  threshold: number;
  similarity_threshold: number;
}

export const compareFaceWithAdmin = async (imageFile: File | Blob): Promise<FaceComparisonResult> => {
  const formData = new FormData();
  formData.append('file', imageFile, 'capture.jpg');

  const response = await fetch(`${API_BASE_URL}/auth/facial-lab/compare-admin`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Error al procesar la comparación facial';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Manejo de error si la respuesta no es un JSON válido
    }
    throw new Error(errorMessage);
  }

  return await response.json();
};