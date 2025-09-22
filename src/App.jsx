import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout";
import Prueba from "./components/Common/Prueba";
import ProductosPage from "./components/Productos/ProductosPage";

function App() {
  return (
    
      <Layout>
        <Routes>
          <Route path="/" element={<Prueba />} />
          <Route path="/productos" element={<ProductosPage />} />
        </Routes>
      </Layout>
    
  );
}

export default App;