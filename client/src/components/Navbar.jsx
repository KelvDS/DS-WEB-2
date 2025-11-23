import { Link, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../api';

export default function Navbar() {
  const { user } = getAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold gradient-text">Da'perfect Studios</Link>
          
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="hover:text-gold transition">Home</Link>
            <Link to="/about" className="hover:text-gold transition">About</Link>
            <Link to="/pricing" className="hover:text-gold transition">Pricing</Link>
            <Link to="/contact" className="hover:text-gold transition">Contact</Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'client' && <Link to="/gallery" className="hover:text-gold transition">My Gallery</Link>}
                {(user.role === 'admin' || user.role === 'super') && <Link to="/admin" className="hover:text-gold transition">Dashboard</Link>}
                <button onClick={handleLogout} className="btn-outline text-sm px-4 py-2">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-gold transition">Login</Link>
                <Link to="/signup" className="btn-primary text-sm px-4 py-2">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}