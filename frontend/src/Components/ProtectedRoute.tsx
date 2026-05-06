import { Navigate } from "react-router-dom"; 
import { useEffect, useState, type JSX } from "react"; 

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/profile', {
                    method: 'GET',
                });
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuth();
    }, []);

    if (checkingAuth) {
        return <div>Loading...</div>;
    }   

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
  