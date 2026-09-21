import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const API_BASE_URL = 'https://tiempo-oscuro.onrender.com/api/v1';

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [publishers, setPublishers] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-supplier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: company,
          email: email,
          publishers_handled: publishers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const detail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
        throw new Error(detail || 'Error al enviar la solicitud');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '0.9rem', color: '#166534', backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
          ¡Solicitud enviada con éxito para <strong>{email}</strong>! Revisaremos la información y te avisaremos por correo.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="button wide"
        >
          Volver a Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMsg && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '1rem',
          borderRadius: '6px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '0.8rem'
        }}>
          {errorMsg}
        </div>
      )}

      <label>
        Nombre de la empresa
        <input
          type="text"
          placeholder="Ej. Distribuidora Lima S.A.C."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
        />
      </label>

      <label>
        Correo electrónico
        <input
          type="email"
          placeholder="contacto@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label>
        Editoriales que maneja
        <input
          type="text"
          placeholder="Ej. Editorial Norma, Panini, Bruño"
          value={publishers}
          onChange={(e) => setPublishers(e.target.value)}
          required
        />
      </label>

      <button type="submit" className="button wide" disabled={loading}>
        {loading ? 'ENVIANDO...' : 'Enviar solicitud'} <ArrowRight size={16} />
      </button>
    </form>
  );
};