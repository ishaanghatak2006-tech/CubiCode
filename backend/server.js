const express = require("express");
const mongoose = require("mongoose");

const app = express();

app.get("/health", (req, res) => {
  res.send("Backend is running");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
