// models/Job.js
const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    adId: { type: String, index: true }, // ad id from source if available
    title: String,
    company: String,
    description: String,
    skills: { type: [String], default: [] }, // normalized, lowercase
    location: {
      display_name: String,
      area: [String],
      latitude: Number,
      longitude: Number,
    },
    salary_min: Number,
    salary_max: Number,
    redirect_url: { type: String, index: true },
    contract_time: String,
    fetchedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // createdAt will be used for TTL
  }
);

// TTL: remove job documents after 1 day (86400 seconds)
JobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Avoid exact-duplicate redirect_url inserts (sparse in case a job lacks redirect_url)
JobSchema.index({ redirect_url: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Job", JobSchema);
