// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Body from "./components/Body";
import Login from "./components/Login";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import Feed from "./components/Feed";
import Connections from "./components/Connections";
import Requests from "./components/Requests";
import Premium from "./components/Premium";
import Chat from "./components/Chat";
import ProtectedRoute from "./components/ProtectedRoute"; // Make sure this import is here

function App() {
  return (
    <>
      <BrowserRouter basename="/">
        <Routes>
          {/* Public Route: Login page (always accessible) */}
          <Route path="/login" element={<Login />} />

          {/* ------------------------------------------------------------- */}
          {/* Protected Routes: All routes that require a logged-in user    */}
          {/* The ProtectedRoute component will handle redirection if no user is found */}
          {/* ------------------------------------------------------------- */}
          <Route element={<ProtectedRoute />}>
            {/* The Body component and its children are now protected */}
            <Route path="/" element={<Body />}>
              <Route index element={<Feed />} /> {/* Render Feed at the root path */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/chat/:targetUserId" element={<Chat />} />
            </Route>
          </Route>

          {/* Optional: Add a catch-all for unmatched routes (e.g., a 404 page) */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;