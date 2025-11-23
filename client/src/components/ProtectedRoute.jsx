import { Navigate } from 'react-router-dom';
import { getAuth } from '../api';

export default function ProtectedRoute({ children, role }) {
  const { user } = getAuth();
  if (!user) return <Navigate to="/login" />;
  if (role === 'admin' && user.role !== 'admin' && user.role !== 'super') return <Navigate to="/" />;
  if (role === 'client' && user.role !== 'client') return <Navigate to="/admin" />;
  return children;
}