
const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    itemReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemReport",
      required: true,
      index: true,
    },

    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: [true, "Claim message is required"],
      trim: true,
      minlength: [10, "Message must contain at least 10 characters"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate claims from the same user
claimSchema.index(
  { itemReportId: 1, claimantId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Claim", claimSchema);
