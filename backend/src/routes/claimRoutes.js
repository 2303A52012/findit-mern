
const express = require("express");

const router = express.Router();

const {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  reviewClaim,
} = require("../controllers/claimController");

const { protect } = require("../middleware/authMiddleware");

// Submit a claim
router.post("/items/:id/claims", protect, createClaim);

// Get all claims submitted by logged-in user
router.get("/me/claims", protect, getMyClaims);

// Get claims for a particular report (owner/moderator)
router.get("/items/:id/claims", protect, getClaimsForItem);

// Approve or reject a claim
router.patch("/claims/:id", protect, reviewClaim);

module.exports = router;
