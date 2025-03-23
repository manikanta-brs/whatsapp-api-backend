// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//   {
//     sender: { type: String, required: true, trim: true, index: true }, // Index added for faster searches
//     receiver: { type: String, required: true, trim: true, index: true }, // Index added
//     to: { type: String, required: true, trim: true },
//     type: {
//       type: String,
//       required: true,
//       enum: ["text", "image", "video", "document", "template", "other"], // Added "template" as a valid type
//       trim: true,
//     },
//     body: { type: String, trim: true }, // For non-template messages
//     template: {
//       // For template-based messages
//       name: { type: String, trim: true }, // Template name
//       language: { type: String, trim: true }, // Template language (e.g., "en_US")
//       status: { type: String, trim: true }, // Template status (e.g., "APPROVED", "REJECTED")
//       category: { type: String, trim: true }, // Template category (e.g., "MARKETING", "UTILITY")
//       components: [
//         {
//           type: { type: String, trim: true }, // Component type (e.g., "HEADER", "BODY", "FOOTER", "BUTTONS")
//           format: { type: String, trim: true }, // Format (e.g., "TEXT", "IMAGE", "DOCUMENT")
//           text: { type: String, trim: true }, // Text content for the component
//           example: { type: mongoose.Schema.Types.Mixed }, // Example data (can be dynamic)
//           buttons: [
//             {
//               type: { type: String, trim: true }, // Button type (e.g., "URL", "PHONE_NUMBER", "QUICK_REPLY")
//               text: { type: String, trim: true }, // Button text
//               url: { type: String, trim: true }, // URL for URL buttons
//               phone_number: { type: String, trim: true }, // Phone number for PHONE_NUMBER buttons
//             },
//           ],
//         },
//       ],
//       parameters: { type: Map, of: String }, // Template parameters (key-value pairs)
//     },
//     timestamp: { type: Date, default: Date.now, index: true }, // Indexed for sorting
//     direction: {
//       type: String,
//       enum: ["sent", "received"],
//       default: "sent",
//       trim: true,
//     },
//   },
//   { timestamps: true } // Adds createdAt & updatedAt fields automatically
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
      name: { type: String, trim: true },
      language: { type: String, trim: true },
      status: { type: String, trim: true },
      category: { type: String, trim: true },
      components: [
        {
          type: { type: String, trim: true }, // HEADER, BODY, FOOTER, BUTTONS
          format: { type: String, trim: true }, // TEXT, IMAGE, DOCUMENT, VIDEO
          text: { type: String, trim: true },
          example: { type: mongoose.Schema.Types.Mixed },
          parameters: [
            {
              type: { type: String, trim: true }, // text, image, document, video
              text: { type: String, trim: true },
              image: {
                link: { type: String, trim: true }
              },
              document: {
                link: { type: String, trim: true }
              },
              video: {
                link: { type: String, trim: true }
              }
            }
          ],
          buttons: [
            {
              type: { type: String, trim: true },
              text: { type: String, trim: true },
              url: { type: String, trim: true },
              phone_number: { type: String, trim: true },
            },
          ],
        },
      ],
      // Store template parameters as key-value pairs for easier access
      parameters: { type: Map, of: String },
    },
    // Store media content for non-template messages
    media: {
      type: { type: String, trim: true }, // image, document, video
      url: { type: String, trim: true },
      caption: { type: String, trim: true },
      filename: { type: String, trim: true },
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
    // Add metadata field for any additional information
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;