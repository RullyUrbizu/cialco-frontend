import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./components/Home";
import { Toros } from "./components/Toros";
import { Clientes } from "./components/Clientes";
import { ToroForm } from "./components/TorosForm";
import { ClienteForm } from "./components/ClienteForm";
import { ColectaDetalle } from "./components/ColectaDetalle";
import { TermosView } from "./components/TermosView";

export const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Toros" element={<Toros />} />
          <Route path="/Clientes" element={<Clientes />} />
          <Route path="/crear-toro" element={<ToroForm />} />
          <Route path="/editar-toro/:id" element={<ToroForm />} />
          <Route path="/crear-cliente" element={<ClienteForm />} />
          <Route path="/editar-cliente/:id" element={<ClienteForm />} />
          <Route path="/colectas/:id" element={<ColectaDetalle />} />
          <Route path="/termos" element={<TermosView />} />
        </Routes>
      </Layout>
    </Router>
  );
};
