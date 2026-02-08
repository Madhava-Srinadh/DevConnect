import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "groups",
  initialState: {
    myGroups: [],
    activeGroup: null,
  },
  reducers: {
    setMyGroups: (state, action) => {
      state.myGroups = action.payload;
    },
    setActiveGroup: (state, action) => {
      state.activeGroup = action.payload;
    },
    clearGroups: (state) => {
      state.myGroups = [];
      state.activeGroup = null;
    },
  },
});

export const { setMyGroups, setActiveGroup, clearGroups } = groupSlice.actions;

export default groupSlice.reducer;
