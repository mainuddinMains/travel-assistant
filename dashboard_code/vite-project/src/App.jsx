import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}
