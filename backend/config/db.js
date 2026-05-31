const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    const connection = await mongoose.connect(env.MONGO_URI);

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;