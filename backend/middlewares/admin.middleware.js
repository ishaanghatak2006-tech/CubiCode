const User = require("../schemas/User");

const isAdmin = async (req, res, next) => {
    try {
        const adminId = req.headers.userid;
        if (!adminId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const user = await User.findById(adminId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (user.Role !== "admin") {
            return res.status(403).json({
                message: "Admin access required"
            });
        }
        next();
    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};
module.exports = isAdmin;