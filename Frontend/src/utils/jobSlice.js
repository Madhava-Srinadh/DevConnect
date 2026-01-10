import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  recommended: [],
  searched: [],
  featured: [],
  activeView: "recommended", // Tracks which category is currently displayed
};

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    // set recommended jobs (array of { job, matchedSkills, matchCount })
    setRecommendedJobs: (state, action) => {
      state.recommended = action.payload || [];
    },
    // set searched jobs (array of enriched results)
    setSearchedJobs: (state, action) => {
      state.searched = action.payload || [];
    },
    // set featured jobs
    setFeaturedJobs: (state, action) => {
      state.featured = action.payload || [];
    },
    // change active view (recommended | searched | featured)
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    // clear job-related state
    clearJobsState: () => {
      return initialState;
    },
  },
});

export const {
  setRecommendedJobs,
  setSearchedJobs,
  setFeaturedJobs,
  setActiveView,
  clearJobsState,
} = jobSlice.actions;

export default jobSlice.reducer;
