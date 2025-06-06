// src/utils/feedSlice.js

import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  // Initial state should be an object containing an array for your items,
  // making it easy to add other state properties later (e.g., loading, error).
  initialState: {
    items: [], // This array will hold the user objects for the feed
  },
  reducers: {
    // Replaces the entire feed array (useful for initial load or refreshing)
    setFeed: (state, action) => {
      state.items = action.payload; // Redux Toolkit allows direct mutation here
    },
    // Appends new users to the existing feed array (for pagination)
    addFeed: (state, action) => {
      state.items.push(...action.payload); // Append new users to the 'items' array
    },
    // Removes a single user from the feed by ID
    removeUserFromFeed: (state, action) => {
      state.items = state.items.filter((user) => user._id !== action.payload);
    },
    // Resets the feed (e.g., when user logs out or session changes)
    resetFeed: (state) => {
      state.items = [];
    },
  },
});

export const { setFeed, addFeed, removeUserFromFeed, resetFeed } =
  feedSlice.actions;
export default feedSlice.reducer;
