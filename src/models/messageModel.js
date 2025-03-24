// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//   {
//     sender: { type: String, required: true, trim: true, index: true },
//     receiver: { type: String, required: true, trim: true, index: true },
//     to: { type: String, required: true, trim: true },
//     type: {
//       type: String,
//       required: true,
//       enum: ["text", "image", "video", "document", "template", "other"],
//       trim: true,
//     },
//     body: { type: String, trim: true }, // For non-template messages
//     template: {
//       name: { type: String, trim: true },
//       language: { type: String, trim: true },
//       status: { type: String, trim: true },
//       category: { type: String, trim: true },
//       components: [
//         {
//           type: { type: String, trim: true }, // HEADER, BODY, FOOTER, BUTTONS
//           format: { type: String, trim: true }, // TEXT, IMAGE, DOCUMENT, VIDEO
//           text: { type: String, trim: true },
//           example: { type: mongoose.Schema.Types.Mixed },
//           parameters: [
//             {
//               type: { type: String, trim: true }, // text, image, document, video
//               text: { type: String, trim: true },
//               image: {
//                 link: { type: String, trim: true }
//               },
//               document: {
//                 link: { type: String, trim: true }
//               },
//               video: {
//                 link: { type: String, trim: true }
//               }
//             }
//           ],
//           buttons: [
//             {
//               type: { type: String, trim: true },
//               text: { type: String, trim: true },
//               url: { type: String, trim: true },
//               phone_number: { type: String, trim: true },
//             },
//           ],
//         },
//       ],
//       // Store template parameters as key-value pairs for easier access
//       parameters: { type: Map, of: String },
//     },
//     // Store media content for non-template messages
//     media: {
//       type: { type: String, trim: true }, // image, document, video
//       url: { type: String, trim: true },
//       caption: { type: String, trim: true },
//       filename: { type: String, trim: true },
//     },
//     timestamp: { type: Date, default: Date.now, index: true },
//     direction: {
//       type: String,
//       enum: ["sent", "received"],
//       default: "sent",
//       trim: true,
//     },
//     // Add status field to track message delivery status
//     status: {
//       type: String,
//       enum: ["sent", "delivered", "read", "failed"],
//       default: "sent",
//     },
//     // Add metadata field for any additional information
//     metadata: { type: mongoose.Schema.Types.Mixed },
//   },
//   { timestamps: true }
// );

// const Message = mongoose.model("Message", messageSchema);

// export default Message;

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true, trim: true, index: true },
    receiver: { type: String, required: true, trim: true, index: true },
    to: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "image", "video", "document", "template", "other"],
      trim: true,
    },
    body: { type: String, trim: true }, // For non-template messages
    template: {
      // ... existing template fields ...
    },
    // Store media content for non-template messages
    media: {
      // ... existing media fields ...
    },
    timestamp: { type: Date, default: Date.now, index: true },
    direction: {
      type: String,
      enum: ["sent", "received"],
      default: "sent",
      trim: true,
    },
    // Add status field to track message delivery status
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    // Add status timestamp to track when status changed
    status_timestamp: { type: Date },
    // Add error information field
    error_info: {
      code: { type: Number },
      title: { type: String, trim: true },
      message: { type: String, trim: true },
      details: { type: String, trim: true },
    },
    // Add metadata field for any additional information
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
