const env = require("../config/env");

const backendOnly = (req, res, next) => {
  try {
    const backendToken = req.headers["x-backend-token"];
    if (!backendToken) {
      return res.status(401).json({
        message: "Backend access only - no token provided"
      });
    }
    // Check if token matches the backend secret
    if (backendToken !== env.BACKEND_TOKEN) {
      return res.status(403).json({
        message: "Invalid backend token"
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};
module.exports = backendOnly;
