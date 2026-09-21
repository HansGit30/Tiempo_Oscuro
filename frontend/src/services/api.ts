// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'https://tiempo-oscuro.onrender.com/api/v1';

export const registerFace = async (userId: string, imageBlob: Blob) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('file', imageBlob, 'admin_face.jpg');

  const response = await axios.post(`${API_BASE_URL}/auth/register-face`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const loginFace = async (imageBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'login_face.jpg');

  const response = await axios.post(`${API_BASE_URL}/auth/login-face`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};