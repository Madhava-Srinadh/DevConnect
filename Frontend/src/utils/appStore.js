// src/utils/appStore.js

import { configureStore, combineReducers } from "@reduxjs/toolkit";
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
import storage from "redux-persist/lib/storage"; // Defaults to localStorage for web

// Your reducer imports
import userReducer from "./userSlice";
import feedReducer from "./feedSlice";
import connectionReducer from "./conectionSlice";
import requestReducer from "./requestSlice";

// Configure which parts of your Redux state to persist
const persistConfig = {
  key: "root", // Key for the localStorage entry
  version: 1, // Version of your persisted state schema (useful for migrations)
  storage, // The storage engine (localStorage)
  whitelist: ["user"], // Only the 'user' slice will be persisted
  // blacklist: ['feed', 'connections', 'requests'], // You could also explicitly blacklist if preferred
};

// Combine all your individual reducers
const rootReducer = combineReducers({
  user: userReducer,
  feed: feedReducer,
  connections: connectionReducer,
  requests: requestReducer,
});

// Create a persisted reducer that wraps your rootReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the Redux store with the persisted reducer
export const appStore = configureStore({
  reducer: persistedReducer, // Use the persisted reducer here
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Ignore these actions to prevent serializability warnings from redux-persist
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create a persistor object, which handles the saving and rehydrating of the store
export const persistor = persistStore(appStore);

export default appStore;
