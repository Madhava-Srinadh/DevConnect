// src/main.jsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";
// Import your store and persistor from appStore.js
import { appStore, persistor } from "./utils/appStore"; // Adjust path if appStore.js is elsewhere

// Import Provider from react-redux and PersistGate from redux-persist
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
axios.defaults.withCredentials = true;
createRoot(document.getElementById("root")).render(
  <StrictMode> {/* It's good practice to keep StrictMode */}
    <Provider store={appStore}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);