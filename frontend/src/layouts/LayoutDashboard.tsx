import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Header } from '../components/dashboard/Header';
import '../components/dashboard/DashboardLayout.css';

export const LayoutDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      {/* Menú lateral */}
      <Sidebar />

      {/* Contenido dinámico superior e inferior */}
      <div className="dashboard-main">
        <Header />
        
        {/* Aquí es donde se va a pintar el contenido de dashboard.tsx y otras subrutas */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};