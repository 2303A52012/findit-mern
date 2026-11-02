
const Claim = require("../models/Claim");
const ItemReport = require("../models/ItemReport");
const mongoose = require("mongoose");

// CREATE CLAIM
const createClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // Validate report ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item report ID",
      });
    }

    // Validate message
    if (
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Claim message must contain 10 to 1000 characters",
      });
    }

    // Find report
    const item = await ItemReport.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item report not found",
      });
    }

    // Only found items can be claimed
    if (item.reportType !== "found") {
      return res.status(400).json({
        success: false,
        message: "Claims can only be submitted for found items",
      });
    }

    // Check report availability
    if (item.status !== "Under Review") {
      return res.status(400).json({
        success: false,
        message: "This item is no longer available for claims",
      });
    }

    // Prevent owner from claiming their own report
    if (item.ownerId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot claim your own report",
      });
    }

    // Create claim
    const claim = await Claim.create({
      itemReportId: id,
      claimantId: req.user._id,
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      claim,
    });

  } catch (error) {
    // Duplicate claim protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a claim for this item",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid claim details",
      });
    }

    console.error("Create claim error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to submit claim",
    });
  }
};


// GET CLAIMS SUBMITTED BY LOGGED-IN USER
const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({
      claimantId: req.user._id,
    })
      .populate({
        path: "itemReportId",
        select: "title reportType category locationText imageUrl status ownerId",
        populate: {
          path: "ownerId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });

  } catch (error) {
    console.error("Get my claims error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your claims",
    });
  }
};


// GET ALL CLAIMS FOR A PARTICULAR ITEM
const getClaimsForItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item report ID",
      });
    }

    const item = await ItemReport.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item report not found",
      });
    }

    const isOwner =
      item.ownerId.toString() === req.user._id.toString();

    const isModerator = req.user.role === "moderator";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view these claims",
      });
    }

    const claims = await Claim.find({
      itemReportId: id,
    })
      .populate("claimantId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });

  } catch (error) {
    console.error("Get item claims error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch item claims",
    });
  }
};


// APPROVE OR REJECT CLAIM
const reviewClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid claim ID",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    const item = await ItemReport.findById(claim.itemReportId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Associated item report not found",
      });
    }

    const isOwner =
      item.ownerId.toString() === req.user._id.toString();

    const isModerator = req.user.role === "moderator";

    // Only report owner or moderator can review
    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: "You cannot review this claim",
      });
    }

    // Prevent claimant from reviewing their own claim
    if (claim.claimantId.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot review your own claim",
      });
    }

    // Only pending claims can be reviewed
    if (claim.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This claim has already been reviewed",
      });
    }

    if (item.status !== "Under Review") {
      return res.status(400).json({
        success: false,
        message: "This item is no longer accepting claim decisions",
      });
    }

    claim.status = status;
    await claim.save();

    return res.status(200).json({
      success: true,
      message: `Claim ${status.toLowerCase()} successfully`,
      claim,
    });

  } catch (error) {
    console.error("Review claim error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to review claim",
    });
  }
};


module.exports = {
  createClaim,
  getMyClaims,
  getClaimsForItem,
  reviewClaim,
};
