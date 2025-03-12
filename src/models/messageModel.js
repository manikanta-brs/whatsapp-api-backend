import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Identifier for the sender (e.g., phone number, user ID)
  receiver: { type: String, required: true }, // Identifier for the receiver
  to: { type: String, required: true },
  type: { type: String, required: true },
  body: { type: String },
  templateName: { type: String },
  templateParameters: { type: Object },
  timestamp: { type: Date, default: Date.now },
  direction: { type: String, enum: ["sent", "received"], default: "sent" }, // Include 'received'
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
