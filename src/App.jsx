import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "./components/Login/LoginPage";
import Prueba from "./components/Common/Prueba";
import ProductosPage from "./components/Productos/ProductosPage";
import UsersPage from "./components/Users/UserPage";
import ClientesPage from "./components/Clientes/ClientesPage";
import ClientDetailsPage from "./components/Clientes/ClientDetailsPage";
import OverdueClientsPage from "./components/Clientes/OverdueClientsPage";
import AccountConfigPage from "./components/AccountConfig/AccountConfigPage";
import CategoryPage from "./components/Category/CategoryPage";
import AuditPage from "./components/Audit/AuditPage";
import Sales from "./components/Sales/Sales";
import ProveedoresPage from "./components/Proveedores/ProveedoresPage";
import ComprasPage from "./components/Compras/ComprasPage";
import ProveedorDetailsPage from "./components/Proveedores/ProveedorDetailsPage";
import ReportesPage from "./components/Reportes/ReportesPage";
import { isAuthenticated } from "@/services/AuthService";

function App() {
  return (
    <>
      <Routes>
        {/* Ruta de Login - Sin Layout y sin protección */}
        <Route
          path="/login"
          element={
            isAuthenticated() ? <Navigate to="/" replace /> : <LoginPage />
          }
        />

        {/* Rutas protegidas - Con Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Prueba />} />
                  <Route path="/productos" element={<ProductosPage />} />
                  <Route path="/usuarios" element={<UsersPage />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/clientes/morosos" element={<OverdueClientsPage />} />
                  <Route path="/clientes/:id" element={<ClientDetailsPage />} />
                  <Route path="/configuracion-cc" element={<AccountConfigPage />} />
                  <Route path="/categorias" element={<CategoryPage />} />
                  <Route path="/auditoria" element={<AuditPage />} />
                  <Route path="/ventas" element={<Sales />} />
                  <Route path="/proveedores" element={<ProveedoresPage />} />
                  <Route path="/proveedores/:id" element={<ProveedorDetailsPage />} />
                  <Route path="/compras" element={<ComprasPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Toaster global para todas las páginas */}
      <Toaster position="top-right" richColors expand theme="system" />
    </>
  );
}

export default App;