import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // if token exists but user missing (after reload), fetch profile
      if (token && !user) await fetchMe();
      setChecking(false);
    })();
  }, [token]);

  if (checking) return <div className="p-6">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;

  return children;
}