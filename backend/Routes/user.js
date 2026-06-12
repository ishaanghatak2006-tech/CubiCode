const express = require("express");
const router = express.Router();
const User = require("../schemas/User");

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { Username, Email, Password } = req.body ?? {};
    if (!Username || !Email || !Password) {
      return res.status(400).json({
        message: "Username, Email and Password are required",
      });
    }
    const existingUser = await User.findOne({
      $or: [{ Username }, { Email }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "Username or Email already exists",
      });
    }
    const user = await User.create({
      Username,
      Email,
      Password,
      Role: "user",
    });
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        Username: user.Username,
        Email: user.Email,
        Role: user.Role,
      },
    });
    }catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
