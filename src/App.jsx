import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout";
import Prueba from "./components/Common/Prueba";
import ProductosPage from "./components/Productos/ProductosPage";
import CategoryManager from "./components/Category/CategoryManager";

function App() {
  return (
    
      <Layout>
        <Routes>
          <Route path="/" element={<Prueba />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/categorias" element={<CategoryManager />} />
        </Routes>
      </Layout>
    
  );
}

export default App;