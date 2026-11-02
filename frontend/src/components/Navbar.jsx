
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, PlusCircle, LogOut, User } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Search size={24} />
        <span>FindIt</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Explore</Link>

        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>

            <Link to="/report" className="report-link">
              <PlusCircle size={17} />
              Report Item
            </Link>

            {user.role === "moderator" && (
              <Link to="/moderator">Moderator</Link>
            )}

            <span className="nav-user">
              <User size={16} />
              {user.name}
            </span>

            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </>
        )}

        {!user && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="report-link">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
