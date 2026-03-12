import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function HostRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkHost() {
      if (token && !user) {
        await fetchMe();
      }

      if (mounted) {
        setChecking(false);
      }
    }

    checkHost();

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

  if (user?.role !== "host" && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}