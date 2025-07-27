// src/components/Body.jsx

import { Outlet } from "react-router-dom"; // No longer need useNavigate, axios, or Redux imports for user data
import NavBar from "./NavBar";

const Body = () => {
  // All authentication and initial user data fetching is handled by ProtectedRoute.
  // Body simply renders its layout and the child route content via Outlet.
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 ">
        <Outlet /> 
      </main>
    </div>
  );
};
export default Body;