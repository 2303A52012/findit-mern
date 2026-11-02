
const mongoose = require("mongoose");

const itemReportSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reportType: {
      type: String,
      enum: ["lost", "found"],
      required: [true, "Report type is required"],
    },

    title: {
      type: String,
      required: [true, "Item title is required"],
      trim: true,
      minlength: [2, "Title must contain at least 2 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [60, "Category cannot exceed 60 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    eventDate: {
      type: Date,
      required: [true, "Lost/found date is required"],
      validate: {
        validator: (value) => value <= new Date(),
        message: "Lost/found date cannot be in the future",
      },
    },

    locationText: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [250, "Location cannot exceed 250 characters"],
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2048, "Image URL is too long"],
    },

    status: {
      type: String,
      enum: ["Under Review", "Resolved", "Removed"],
      default: "Under Review",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

itemReportSchema.index({ reportType: 1, category: 1, status: 1 });
itemReportSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("ItemReport", itemReportSchema);
