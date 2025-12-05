import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isAdmin } from './utils/adminUsers';
import ReservaPage from './pages/ReservaPage';
import AdminPage from './pages/AdminPage';
import TabletPage from './pages/TabletPage';
import LoginPage from './pages/LoginPage';
import CancelarReserva from './pages/CancelarReserva';
import MisReservas from './pages/MisReservas';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Página de Reservas (Usuario Normal) */}
        <Route path="/" element={<ReservaPage />} />
        
        {/* Panel de Administración - Solo Admins */}
        <Route 
          path="/admin" 
          element={isAdmin(user.email) ? <AdminPage /> : <Navigate to="/" />} 
        />
        
        {/* Dashboard para Tablet */}
        <Route path="/tablet" element={<TabletPage />} />
        
        {/* Redirigir rutas desconocidas a inicio */}
        <Route path="*" element={<Navigate to="/" />} />

        {/* Página de Cancelación de Reservas */}
        <Route path="/cancelar-reserva/:id" element={<CancelarReserva />} />

        <Route path="/mis-reservas" element={<MisReservas />} />
      
      </Routes>
    </BrowserRouter>
  );
}