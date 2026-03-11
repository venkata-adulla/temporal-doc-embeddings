import { Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Lifecycles from "./pages/Lifecycles.jsx";
import Predictions from "./pages/Predictions.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/lifecycles/:lifecycleId?" element={<Lifecycles />} />
        <Route path="/predictions/:lifecycleId?" element={<Predictions />} />
      </Routes>
    </Layout>
  );
}
