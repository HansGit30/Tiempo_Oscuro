import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudioNPage from '../pages/Inicio';
import Login from '../pages/Login';
import CameraScanner from '../components/CameraScanner';
import { LayoutDashboard } from '../layouts/LayoutDashboard';
import { CatalogPage } from '../pages/CatalogPage';
import { AdminSupplierRequests } from '../components/dashboard/AdminSupplierRequests';
// import Login from '../pages/Login';
// import { LayoutDashboard } from '../layouts/LayoutDashboard';
 import DashboardPage from '../pages/dashboard';
import {CompareWithAdmin} from '../components/dashboard/CompareWithAdmin';
import MyBooks from '../components/dashboard/MyBooks';
// import { CatalogPage } from '../pages/CatalogPage';
// import MyBooks from '../components/dashboard/MyBooks';
// import UsersManagement from '../components/dashboard/UsersManagement';
// import { AdminSupplierRequests } from '../components/dashboard/AdminSupplierRequests'
// import { CatalogPage } from '../pages/CatalogPage';
// import { PosPage } from '../pages/PosPage';
// import { PublisherDashboardPage } from '../pages/PublisherDashboardPage';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<StudioNPage />} />
        <Route path="/libros" element={<CatalogPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/LoginScanner" element={<CameraScanner />} />


        <Route path="/dashboard" element={<LayoutDashboard />}>

          <Route index element={<DashboardPage  />} />

          <Route path="approvals" element={<AdminSupplierRequests />} />
          <Route path="prueba" element={<CompareWithAdmin />} />
          <Route path="my-books" element={<MyBooks />} />
          <Route path="libros" element={<CatalogPage />} />
          
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
};