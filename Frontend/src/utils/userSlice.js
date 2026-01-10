// src/utils/userSlice.js (Example - adjust if yours is different)

import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: null, // User is initially null when not logged in
  reducers: {
    addUser: (state, action) => {
      return action.payload; // Set the user data
    },
    removeUser: () => {
      return null; // Clear user data
    },
  },
});

export const { addUser, removeUser } = userSlice.actions;
export default userSlice.reducer;
