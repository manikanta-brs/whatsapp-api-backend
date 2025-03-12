import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true, trim: true, index: true }, // Index added for faster searches
    receiver: { type: String, required: true, trim: true, index: true }, // Index added
    to: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "image", "video", "document", "other"], // Ensure valid types
      trim: true,
    },
    body: { type: String, trim: true },
    templateName: { type: String, trim: true },
    templateParameters: { type: Map, of: String }, // Use Map for structured key-value pairs
    timestamp: { type: Date, default: Date.now, index: true }, // Indexed for sorting
    direction: {
      type: String,
      enum: ["sent", "received"],
      default: "sent",
      trim: true,
    },
  },
  { timestamps: true } // Adds createdAt & updatedAt fields automatically
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
