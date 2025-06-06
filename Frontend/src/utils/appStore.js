// src/appStore.js (or store/index.js or similar)

import { configureStore, combineReducers } from "@reduxjs/toolkit"; // Import combineReducers
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage"; // Defaults to localStorage

// Import your existing reducers
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import connectionReducer from "./conectionSlice"; // Typo in original: 'conectionSlice' should be 'connectionSlice'
import requestReducer from "./requestSlice";

// -------------------------------------------------------------
// 1. Configure Redux Persist
// -------------------------------------------------------------
const persistConfig = {
  key: "root", // The key for your persisted state in localStorage
  storage, // Use localStorage by default
  // Specify which reducers you want to persist.
  // It's generally good practice to whitelist only the necessary ones.
  // For example, you likely want to persist user data, but maybe not dynamic feed data.
  // Let's assume you want to persist 'user' and 'connections' for now.
  whitelist: ["user", "connections"],
  // blacklist: ['feed', 'requests'], // You could use blacklist too
};

// -------------------------------------------------------------
// 2. Combine your reducers into a root reducer
// -------------------------------------------------------------
const rootReducer = combineReducers({
  user: userReducer,
  feed: feedReducer,
  connections: connectionReducer,
  requests: requestReducer,
});

// -------------------------------------------------------------
// 3. Create a persisted version of your root reducer
// -------------------------------------------------------------
const persistedReducer = persistReducer(persistConfig, rootReducer);

// -------------------------------------------------------------
// 4. Configure the Redux store with the persisted reducer
// -------------------------------------------------------------
export const appStore = configureStore({
  reducer: persistedReducer, // Use the persisted reducer here
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // This is crucial for Redux-Persist to avoid serializability warnings
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// -------------------------------------------------------------
// 5. Create a persistor for your store
// -------------------------------------------------------------
export const persistor = persistStore(appStore);

// Note: You no longer export `default appStore;` but rather `export const appStore`
// and `export const persistor` because you'll need both in your root React component.
