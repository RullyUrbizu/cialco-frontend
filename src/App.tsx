import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./components/Home";
import { Toros } from "./components/Toros";
import { Clientes } from "./components/Clientes";
import { ToroForm } from "./components/TorosForm";
import { ClienteForm } from "./components/ClienteForm";
import { ColectaDetalle } from "./components/ColectaDetalle";
import { ToroDetalle } from "./components/ToroDetalle";
import { ClienteDetalle } from "./components/ClienteDetalle";
import { TermosView } from "./components/TermosView";
import { RemitosView } from "./components/RemitosView";
import { HistorialView } from "./components/HistorialView";
import { Toaster } from "sonner";

export const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Toros" element={<Toros />} />
          <Route path="/toros/:id" element={<ToroDetalle />} />
          <Route path="/Clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/crear-toro" element={<ToroForm />} />
          <Route path="/editar-toro/:id" element={<ToroForm />} />
          <Route path="/crear-cliente" element={<ClienteForm />} />
          <Route path="/editar-cliente/:id" element={<ClienteForm />} />
          <Route path="/colectas/:id" element={<ColectaDetalle />} />
          <Route path="/termos" element={<TermosView />} />
          <Route path="/remitos" element={<RemitosView />} />
          <Route path="/historial" element={<HistorialView />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" richColors closeButton autoClose={5000} />
    </Router>
  );
};
