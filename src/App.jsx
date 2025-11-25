import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout";
import Prueba from "./components/Common/Prueba";
import ProductosPage from "./components/Productos/ProductosPage";
import UsersPage from "./components/Users/UserPage";
import ClientesPage from "./components/Clientes/ClientesPage";

function App() {
  return (
    
      <Layout>
        <Routes>
          <Route path="/" element={<Prueba />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
        </Routes>
      </Layout>
    
  );
}

export default App;