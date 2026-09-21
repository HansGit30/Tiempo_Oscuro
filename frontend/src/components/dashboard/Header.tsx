import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Header.css';

export const Header: React.FC = () => {
  const location = useLocation();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // Formato simple para mapear rutas a nombres legibles
  const getBreadcrumbName = (pathname: string) => {
    if (pathname.includes('/approvals')) return 'Solicitudes';
    if (pathname.includes('/users')) return 'Clientes';
    if (pathname.includes('/books')) return 'Catálogo e inventario';
    if (pathname.includes('/facial-lab')) return 'Laboratorio facial';
    if (pathname.includes('/reports')) return 'Actividad';
    if (pathname.includes('/account')) return 'Mi cuenta y seguridad';
    return 'Vista general';
  };

  // Formatear la fecha actual ej: "18 de setiembre"
  const formattedDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  const initial = user?.full_name 
    ? user.full_name.charAt(0).toUpperCase() 
    : (user?.email ? user.email.charAt(0).toUpperCase() : 'E');

  return (
    <header className="top-header">
      {/* Breadcrumb estilo imagen de referencia */}
      <div className="breadcrumb-container">
        <span className="breadcrumb-root">Mi espacio</span>
        <ChevronRight size={14} className="breadcrumb-separator" />
        <span className="breadcrumb-active">{getBreadcrumbName(location.pathname)}</span>
      </div>

      {/* Info derecha (Fecha + Estado de verificación + Avatar de Iniciales) */}
      <div className="header-right-info">
        <span className="header-date">{formattedDate}</span>
        <span className="header-divider">|</span>
        
        <div className="verification-badge">
          <span className="status-dot"></span>
          <span>Identidad verificada</span>
        </div>

        <div className="user-avatar-circle">
          {initial}
        </div>
      </div>
    </header>
  );
};