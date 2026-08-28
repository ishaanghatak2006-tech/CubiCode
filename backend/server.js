const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("./config/env");

const connectDB = require("./config/db");
const autocompleteRoutes = require("./Routes/autocomplete");
const questRoutes = require("./Routes/quest");
const submitRoutes = require("./Routes/submit");
const userDashboardRoutes = require("./Routes/user_dashboard");
const userRoutes = require("./Routes/user");
const adminRoutes = require("./Routes/admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Share io with express routes
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// WebSocket connection handling & authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error("Authentication error: token missing"));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Authentication error: token invalid"));
  }
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id} (User: ${socket.user.id})`);

  socket.on("join_job", (jobId) => {
    socket.join(`job_${jobId}`);
    console.log(`👤 Client ${socket.id} joined room job_${jobId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

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

server.listen(5000, () => {
  console.log("Server started on port 5000");
  console.log("Server started:");
  console.log("http://localhost:5000/health");
});
