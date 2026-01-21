import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, isGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      navigate('/auth');
    }
  }, [user, isLoading, isGuest, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated OR in guest mode
  return (user || isGuest) ? <>{children}</> : null;
};

export default ProtectedRoute;
