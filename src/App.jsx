import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout";
import Prueba from "./components/Common/Prueba";

function App() {
  return (
    
      <Layout>
        <Routes>
          <Route path="/" element={<Prueba />} />
        </Routes>
      </Layout>
    
  );
}

export default App;