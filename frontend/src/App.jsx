
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

// Temporary pages — we'll implement these in upcoming steps
import Home from "./pages/Home";
import CreateReport from "./pages/CreateReport";
import ItemDetails from "./pages/ItemDetails";
import Dashboard from "./pages/Dashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<ItemDetails />} />

          {/* Logged-in user routes */}
          <Route element={<ProtectedRoute allowedRoles={["user", "moderator"]} />}>
            <Route path="/report" element={<CreateReport />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Moderator routes */}
          <Route element={<ProtectedRoute allowedRoles={["moderator"]} />}>
            <Route path="/moderator" element={<ModeratorDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
