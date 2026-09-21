import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginUser } from '../../services/api_login';

interface PasswordStepProps {
  email: string;
  onBack: () => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({ email, onBack }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const data = await loginUser(email, password);

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const userRole = data.user?.role;

      if (userRole === 'admin' || userRole === 'supplier') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const msg = typeof err.message === 'string' ? err.message : 'Credenciales inválidas o error de conexión';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
          Ingresando como: <strong style={{ color: '#111' }}>{email}</strong>
        </span>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#1e3a2f', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
        >
          Cambiar
        </button>
      </div>

      {errorMessage && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '1rem',
          borderRadius: '6px',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '0.8rem'
        }}>
          {errorMessage}
        </div>
      )}

      <label>
        Contraseña
        <div className="password-input">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      <a href="#forgot" className="text-button forgot" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        Olvidé mi contraseña
      </a>

      <button type="submit" className="button wide" disabled={loading}>
        {loading ? 'VERIFICANDO...' : 'Entrar a mi espacio'} <ArrowRight size={16} />
      </button>
    </form>
  );
};