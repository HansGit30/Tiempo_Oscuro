import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  BookOpen, 
  ClipboardList, 
  Users, 
  Scan, 
  Activity, 
  ShieldCheck, 
  LogOut,
  Package,
  CircleDollarSign
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const role = user?.role;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <BookOpen size={28} strokeWidth={1.5} color="#132a21" />
        </div>
        <div className="brand-text">
          <h2>TIEMPO OSCURO</h2>
        </div>
      </div>

      {/* Categoría / Contexto */}
      <div className="sidebar-section-title">
        {role === 'admin' ? 'ESPACIO DE ADMINISTRACIÓN' : 'ESPACIO DE PROVEEDOR'}
      </div>

      {/* Menú de Navegación */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutGrid size={20} strokeWidth={1.5} />
          <span>Vista general</span>
        </NavLink>

        {role === 'admin' && (
          <>
            <NavLink to="/dashboard/libros" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} strokeWidth={1.5} />
              <span>Catálogo e inventario</span>
            </NavLink>
            <NavLink to="/dashboard/approvals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} strokeWidth={1.5} />
              <span>Solicitudes</span>
            </NavLink>
            {/* <NavLink to="/dashboard/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={20} strokeWidth={1.5} />
              <span>Clientes</span>
            </NavLink> */}
            <NavLink to="/dashboard/prueba" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Scan size={20} strokeWidth={1.5} />
              <span>Laboratorio facial</span>
            </NavLink>
            {/* <NavLink to="/dashboard/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Activity size={20} strokeWidth={1.5} />
              <span>Actividad</span>
            </NavLink> */}
          </>
        )}

        {role === 'supplier' && (
          <>
            <NavLink to="/dashboard/my-books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} strokeWidth={1.5} />
              <span>Mi Catálogo</span>
            </NavLink>
            {/* <NavLink to="/dashboard/consignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Package size={20} strokeWidth={1.5} />
              <span>Mis Consignaciones</span>
            </NavLink>
            <NavLink to="/dashboard/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <CircleDollarSign size={20} strokeWidth={1.5} />
              <span>Ventas y Liquidaciones</span>
            </NavLink> */}
          </>
        )}

        {/* <NavLink to="/dashboard/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={20} strokeWidth={1.5} />
          <span>Mi cuenta y seguridad</span>
        </NavLink> */}
      </nav>

      {/* Tarjeta de Frase / Inspiración */}
      <div className="quote-card">
        <BookOpen size={24} strokeWidth={1.5} color="#3a4d39" />
        <p className="quote-text">Cada libro abre un mundo.</p>
      </div>

      {/* Botón Salir */}
      <button onClick={handleLogout} className="logout-btn">
        <LogOut size={18} strokeWidth={1.5} />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
};