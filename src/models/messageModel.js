import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  phoneNumberId: String, // Your WhatsApp Business number
  from: String, // Sender's phone number
  message: String, // Message text
  timestamp: { type: Date, default: Date.now }, // Auto-generated timestamp
});

const Message = mongoose.model("Message", messageSchema);

export default Message; // Exporting in ES6 module format
