const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const autocompleteRoutes = require("./Routes/autocomplete");
const questRoutes = require("./Routes/quest");
const submitRoutes = require("./Routes/submit");
const userDashboardRoutes = require("./Routes/user_dashboard");
const userRoutes = require("./Routes/user");
const adminRoutes = require("./Routes/admin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.get("/health", (req, res) => {
  res.send("Backend is running");
});

app.use("/autocomplete", autocompleteRoutes);
app.use("/quest", questRoutes);
app.use("/submit", submitRoutes);
app.use("/user", userRoutes);
app.use("/user-dashboard", userDashboardRoutes);
app.use("/admin", adminRoutes);

app.listen(5000, () => {
  console.log("Server started on port 5000");
  console.log("Server started:");
  console.log("http://localhost:5000/health");
});
