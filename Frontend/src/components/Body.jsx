// src/components/Body.jsx

import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

const Body = () => {
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