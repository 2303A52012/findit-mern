
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// Protected profile endpoint
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful!",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
