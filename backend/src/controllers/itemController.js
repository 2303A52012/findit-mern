
const ItemReport = require("../models/ItemReport");
const mongoose = require("mongoose");

// Allowed report fields
const editableFields = [
  "reportType",
  "title",
  "category",
  "description",
  "eventDate",
  "locationText",
  "imageUrl",
];

const allowedStatuses = [
  "Under Review",
  "Resolved",
  "Removed",
];

// Escape special regex characters
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// CREATE ITEM REPORT
const createItem = async (req, res) => {
  try {
    const {
      reportType,
      title,
      category,
      description,
      eventDate,
      locationText,
      imageUrl,
    } = req.body;

    if (
      !reportType ||
      !title ||
      !category ||
      !description ||
      !eventDate ||
      !locationText
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required item details",
      });
    }

    if (!["lost", "found"].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: "Report type must be lost or found",
      });
    }

    if (
      typeof title !== "string" ||
      typeof category !== "string" ||
      typeof description !== "string" ||
      typeof locationText !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid field types",
      });
    }

    // Create report
    const item = await ItemReport.create({
      ownerId: req.user._id,
      reportType,
      title,
      category,
      description,
      eventDate,
      locationText,
      imageUrl: imageUrl || "",
    });

    return res.status(201).json({
      success: true,
      message: "Item report created successfully",
      item,
    });

  } catch (error) {
    console.error("Create item error:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid item details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create item report",
    });
  }
};


// GET ALL ITEM REPORTS + SEARCH + FILTERS
const getAllItems = async (req, res) => {
  try {
    const {
      search,
      reportType,
      category,
      location,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Public users cannot see removed reports
    filter.status = { $ne: "Removed" };

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      // Only moderators can request removed reports
      if (status === "Removed" && req.user?.role !== "moderator") {
        return res.status(403).json({
          success: false,
          message: "Moderator access required",
        });
      }

      filter.status = status;
    }

    if (reportType) {
      if (!["lost", "found"].includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
      }

      filter.reportType = reportType;
    }

    if (category) {
      filter.category = {
        $regex: escapeRegex(category.trim()),
        $options: "i",
      };
    }

    if (location) {
      filter.locationText = {
        $regex: escapeRegex(location.trim()),
        $options: "i",
      };
    }

    if (search) {
      const searchRegex = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { locationText: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(
      50,
      Math.max(1, Number(limit) || 10)
    );

    const skip = (pageNumber - 1) * limitNumber;

    const [items, totalItems] = await Promise.all([
      ItemReport.find(filter)
        .populate("ownerId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),

      ItemReport.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: items.length,
      totalItems,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalItems / limitNumber),
      items,
    });

  } catch (error) {
    console.error("Get items error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch item reports",
    });
  }
};


// GET SINGLE ITEM REPORT
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await ItemReport.findById(id)
      .populate("ownerId", "name");

    if (!item || (
      item.status === "Removed" &&
      req.user?.role !== "moderator" &&
      item.ownerId._id.toString() !== req.user?._id.toString()
    )) {
      return res.status(404).json({
        success: false,
        message: "Item report not found",
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });

  } catch (error) {
    console.error("Get item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch item",
    });
  }
};


// UPDATE ITEM REPORT
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
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
        message: "You cannot update another user's report",
      });
    }

    const requestedFields = Object.keys(req.body);

    if (requestedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update fields provided",
      });
    }

    // Moderators can update report status only
    if (isModerator && !isOwner) {
      if (
        requestedFields.length !== 1 ||
        requestedFields[0] !== "status"
      ) {
        return res.status(403).json({
          success: false,
          message: "Moderators can only update report status here",
        });
      }
    } else {
      const invalidFields = requestedFields.filter(
        (field) =>
          !editableFields.includes(field) &&
          field !== "status"
      );

      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "One or more fields cannot be updated",
          invalidFields,
        });
      }
    }

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid report status",
        });
      }

      // Only moderators can set Under Review or Removed
      if (
        !isModerator &&
        req.body.status !== "Resolved"
      ) {
        return res.status(403).json({
          success: false,
          message: "Only moderators can set this status",
        });
      }
    }

    if (
      req.body.reportType !== undefined &&
      !["lost", "found"].includes(req.body.reportType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid report type",
      });
    }

    // Prevent mass assignment
    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    }

    if (req.body.status !== undefined) {
      item.status = req.body.status;
    }

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item report updated successfully",
      item,
    });

  } catch (error) {
    console.error("Update item error:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid update details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update item report",
    });
  }
};


// DELETE ITEM REPORT
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
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
        message: "You cannot delete another user's report",
      });
    }

    // Soft delete: preserve record and its claim references
    item.status = "Removed";
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Item report removed successfully",
    });

  } catch (error) {
    console.error("Delete item error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to remove item report",
    });
  }
};


module.exports = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
