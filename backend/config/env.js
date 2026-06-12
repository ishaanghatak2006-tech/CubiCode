const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "BACKEND_TOKEN"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  JWT_SECRET: process.env.JWT_SECRET,
  BACKEND_TOKEN: process.env.BACKEND_TOKEN,
};

module.exports = env;
