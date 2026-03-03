import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import ActiveTrip from "./pages/ActiveTrip";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow p-4">
          <h1 className="text-xl font-bold">Travel Assistant</h1>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/active-trip" element={<ActiveTrip />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
