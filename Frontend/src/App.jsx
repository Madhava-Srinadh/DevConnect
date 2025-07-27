// src/App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import appStore, { persistor } from "./utils/appStore";

// --- Redux Persist Import ---
import { PersistGate } from 'redux-persist/integration/react';

// Your component imports
import Body from "./components/Body";
import Login from "./components/Login";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile"; // Assuming you have this
import Feed from "./components/Feed";
import Connections from "./components/Connections";
import Requests from "./components/Requests";
import Premium from "./components/Premium";
import Chat from "./components/Chat";
import ProtectedRoute from "./components/ProtectedRoute"; // Your ProtectedRoute component

function App() {
  return (
    <>
      {/* The Redux Provider wraps your entire application, providing the store context. */}
      <Provider store={appStore}>
        {/*
          PersistGate wraps the BrowserRouter to delay rendering of your app's UI
          until the Redux store has been rehydrated from localStorage by redux-persist.
          'loading={null}' means no specific loading component is shown during rehydration,
          but you could replace 'null' with a custom loading spinner component.
        */}
        <PersistGate loading={null} persistor={persistor}>
          <BrowserRouter basename="/">
            <Routes>
              {/* Public Route: The Login page is always accessible */}
              <Route path="/login" element={<Login />} />

              {/* ------------------------------------------------------------- */}
              {/* Protected Routes: These routes require a logged-in user.      */}
              {/* ProtectedRoute acts as a gate, verifying authentication       */}
              {/* before rendering its child routes.                            */}
              {/* ------------------------------------------------------------- */}
              <Route element={<ProtectedRoute />}>
                {/* The Body component acts as a layout for all protected sub-routes,
                    including the NavBar and a common layout for content. */}
                <Route path="/" element={<Body />}>
                  {/* The 'index' prop makes Feed the default component for the "/" path
                      when Body is rendered (e.g., when you navigate to http://localhost:5173/) */}
                  <Route index element={<Feed />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/requests" element={<Requests />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/chat/:targetUserId" element={<Chat />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </PersistGate>
      </Provider>
    </>
  );
}

export default App;