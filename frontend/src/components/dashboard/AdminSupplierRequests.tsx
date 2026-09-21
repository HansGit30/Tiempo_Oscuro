import React, { useState, useEffect } from 'react';

//const API_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = 'https://tiempo-oscuro.onrender.com/api/v1';

interface SupplierRequest {
  id: string;
  company_name: string;
  email: string;
  publishers_handled: string;
  created_at: string;
}

export const AdminSupplierRequests: React.FC = () => {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Obtener solicitudes pendientes
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log("Token enviado:", token);

      const response = await fetch(`${API_BASE_URL}/admin/supplier-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error("Error en la respuesta del servidor:", response.status);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 2. Aprobar solicitud
  const handleApprove = async (id: string, company: string) => {
    if (!window.confirm(`¿Estás seguro de aprobar a ${company}? Se creará su cuenta y su editorial automáticamente.`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/approve-supplier/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Error al aprobar solicitud');
      }

      setMessage(`¡Proveedor aprobado con éxito! Contraseña temporal asignada: ${result.assigned_password}`);
      fetchRequests();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Solicitudes de Acceso de Proveedores</h2>
      
      {message && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      {requests.length === 0 ? (
        <p>No hay solicitudes pendientes en este momento.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Empresa</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Correo</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Editorial Indicada</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.company_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.publishers_handled}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button
                    onClick={() => handleApprove(req.id, req.company_name)}
                    disabled={loading}
                    style={{ background: '#00e676', border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}
                  >
                    Aprobar y Crear Cuenta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};