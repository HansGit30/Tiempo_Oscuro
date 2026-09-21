import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, ShieldCheck, Scan } from 'lucide-react';
import { EmailStep } from '../components/login/EmailStep';
import { PasswordStep } from '../components/login/PasswordStep';
import { RegisterForm } from '../components/login/RegisterForm';
import '../components/login/Login.css';

export const Login: React.FC = () => {
  const [step, setStep] = useState<'email' | 'password' | 'register'>('email');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const handleNextStep = (email: string) => {
    setUserEmail(email);
    setStep('password');
  };

  return (
    <div className="auth-page">
      {/* Panel Izquierdo: Fondo Verde y Portadas Centradas */}
      <section className="auth-story">
        <Link className="brand" to="/">
          <BookOpen size={22} /> tiempo oscuro <span>LIBRERÍA</span>
        </Link>

        {/* Bloque centralizado verticalmente */}
        <div className="story-body">
          <span className="eyebrow">UN LUGAR PARA CADA HISTORIA</span>
          <h1>
            Tu próximo<br />
            capítulo<br />
            <em>empieza aquí.</em>
          </h1>
          <p>
            Libros que inspiran. Historias que se quedan.<br />
            Una experiencia pensada para ti.
          </p>

          <div className="art-books-wrapper" aria-hidden="true">
            <div className="art-book book-terracotta">
              <small>ANTOINE DE<br />SAINT-EXUPÉRY</small>
              <strong>El<br />principito</strong>
              <span className="star">✶</span>
              <small className="tag">TIEMPO OSCURO · CLÁSICOS</small>
            </div>

            <div className="art-book book-green">
              <small>VIRGINIA WOOLF</small>
              <strong>Una<br />habitación<br />propia</strong>
              <span className="circle">◯</span>
              <small className="tag">TIEMPO OSCURO · ENSAYO</small>
            </div>

            <div className="art-book book-beige">
              <small>JANE AUSTEN</small>
              <strong>Orgullo<br />y<br />prejuicio</strong>
              <span className="ornament">❧</span>
              <small className="tag">TIEMPO OSCURO · CLÁSICOS</small>
            </div>
          </div>
        </div>

        <div className="story-footer">
          <span>CURADURÍA CON PROPÓSITO</span>
          <span>
            Lima, Perú <ArrowUpRight size={14} />
          </span>
        </div>
      </section>

      {/* Panel Derecho: Formulario */}
      <section className="auth-form-side">
        <div className="auth-top-bar">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={15} /> <span>Regresar al inicio</span>
          </button>
          <div className="auth-top">
            Tu espacio de lectura <span>TIEMPO OSCURO / 01</span>
          </div>
        </div>

        <div className="auth-box">
          <span className="eyebrow">BIENVENIDO A TIEMPO OSCURO</span>
          <h2>
            {step === 'register'
              ? 'Únete a nuestra comunidad.'
              : 'Qué bueno volver a verte.'}
          </h2>
          <p>
            {step === 'register'
              ? 'Crea tu cuenta de lector. Nos encargamos del siguiente capítulo.'
              : 'Entra para explorar, reservar y seguir tus pedidos.'}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={step !== 'register' ? 'active' : ''}
              onClick={() => setStep('email')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={step === 'register' ? 'active' : ''}
              onClick={() => setStep('register')}
            >
              Crear cuenta
            </button>
          </div>

          <div className="form-container">
            {step === 'email' && (
              <EmailStep
                onNext={handleNextStep}
                onSwitchToRegister={() => setStep('register')}
              />
            )}

            {step === 'password' && (
              <PasswordStep
                email={userEmail}
                onBack={() => setStep('email')}
              />
            )}

            {step === 'register' && (
              <RegisterForm
                onSwitchToLogin={() => setStep('email')}
              />
            )}
          </div>

          {/* Bloque de Seguridad con Enlace al Escáner */}
          <div className="auth-security">
            <div className="security-info">
              <ShieldCheck size={18} />
              <p>
                El acceso facial se solicita únicamente a la cuenta administradora. Los clientes
                ingresan con su correo y contraseña.
              </p>
            </div>

            <Link to="/LoginScanner" className="facial-btn">
              <Scan size={18} />
              <span>Ingresar con Reconocimiento Facial</span>
            </Link>
          </div>
        </div>

        <footer>
          <span>© 2026 Tiempo Oscuro Librería</span>
          <span>Demostración académica</span>
        </footer>
      </section>
    </div>
  );
};

export default Login;