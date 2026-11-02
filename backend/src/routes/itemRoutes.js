
const express = require("express");

const router = express.Router();

const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllItems);
router.get("/:id", getItemById);

// Protected routes
router.post("/", protect, createItem);
router.patch("/:id", protect, updateItem);
router.delete("/:id", protect, deleteItem);

module.exports = router;
