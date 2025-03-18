import mongoose from "mongoose";

const messageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["TRANSACTIONAL", "MARKETING", "UTILITY"],
  },
  allowCategoryChange: {
    type: Boolean,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  components: [
    {
      type: {
        type: String,
        required: true,
        enum: ["BODY", "FOOTER", "BUTTONS"],
      },
      text: {
        type: String,
        required: true,
      },
    },
  ],
});

const MessageTemplate = mongoose.model(
  "MessageTemplate",
  messageTemplateSchema
);

export default MessageTemplate;
