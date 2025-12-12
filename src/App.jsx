import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout";
import Prueba from "./components/Common/Prueba";
import ProductosPage from "./components/Productos/ProductosPage";
import UsersPage from "./components/Users/UserPage";
import ClientesPage from "./components/Clientes/ClientesPage";
import ClientDetailsPage from "./components/Clientes/ClientDetailsPage";
import AccountConfigPage from "./components/AccountConfig/AccountConfigPage";

function App() {
  return (

      <Layout>
        <Routes>
          <Route path="/" element={<Prueba />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClientDetailsPage />} />
          <Route path="/configuracion-cc" element={<AccountConfigPage />} />
        </Routes>
      </Layout>

  );
}

export default App;