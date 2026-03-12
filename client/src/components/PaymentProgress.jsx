import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (token && !user) {
        await fetchMe();
      }

      if (mounted) {
        setChecking(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [token, user, fetchMe]);

  if (checking) {
    return <div className="p-6">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}