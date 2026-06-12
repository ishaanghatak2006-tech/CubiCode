const express = require("express");
const router = express.Router();

const User = require("../schemas/User");
const Question = require("../schemas/Question");
const Submission = require("../schemas/Submission");

const isAdmin = require("../middlewares/admin.middleware");
const backendOnly = require("../middlewares/backendOnly.middleware");

// Apply backend-only middleware to all admin routes
router.use(backendOnly);//protected from frontedn acess only can be acessed directly via backedn
router.use(isAdmin);

//create a user....//registering .....user....iss eparat this is for the admin only
router.post("/CreateUser", async (req, res) => {
    try {

        const { Username,Email,Password,Role} = req.body;

        if (!Username || !Email || !Password) {
            return res.status(400).json({
                message: "Username, Email and Password are required"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { Username },
                { Email }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const user = await User.create({
            Username,
            Email,
            Password,
            Role: Role || "user"
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user._id,
                Username: user.Username,
                Email: user.Email,
                Role: user.Role
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
});

// Get all users
router.get("/users", async (req, res) => {

    try {

        const users = await User.find()
            .select("-Password");

        return res.status(200).json(users);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Get one user
router.get("/users/:id", async (req, res) => {

    try {

        const user = await User.findById(req.params.id)
            .select("-Password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json(user);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Delete user
router.delete("/users/:id", async (req, res) => {

    try {

        const user = await User.findByIdAndDelete(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User deleted successfully"
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Get all questions
router.get("/questions", async (req, res) => {

    try {

        const questions = await Question.find();

        return res.status(200).json(questions);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Delete question
router.delete("/questions/:id", async (req, res) => {

    try {

        const question = await Question.findByIdAndDelete(
            req.params.id
        );

        if (!question) {
            return res.status(404).json({
                message: "Question not found"
            });
        }

        return res.status(200).json({
            message: "Question deleted"
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Get all submissions
router.get("/submissions", async (req, res) => {

    try {
        const submissions = await Submission.find();

        return res.status(200).json(submissions);

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

// Site statistics
router.get("/stats", async (req, res) => {

    try {

        const users = await User.countDocuments();
        const questions = await Question.countDocuments();
        const submissions = await Submission.countDocuments();

        return res.status(200).json({
            users,
            questions,
            submissions
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;