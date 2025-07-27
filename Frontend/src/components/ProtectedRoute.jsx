import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user); // Get user data from Redux

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user || !user.emailId) {
      navigate("/login");
    }
    setIsChecking(false);
  }, [navigate, user]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">
        Verifying session...
      </div>
    );
  }

  return user && user.emailId ? <Outlet /> : null;
};

export default ProtectedRoute;
