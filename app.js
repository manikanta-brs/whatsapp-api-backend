import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import adminRoute from "./src/routes/adminRoute.js";
import Message from "./src/models/messageModel.js";
dotenv.config();
const app = express();

app.use(express.json());

// Allow requests from frontend ports
const allowedOrigins = [
  "http://localhost:4000",
  "http://localhost:5174",
  "http://localhost:5173",
  "*",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses form-data

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

app.use("/api/admin", adminRoute);

// 🔹 Webhook Verification (WhatsApp API) - GET method
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403); // Forbidden
  }
});

// Webhook Message Handling (Store in DB) - POST method
app.post("/webhook", async (req, res) => {
  // console.log("Incoming Request (Webhook):", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];

    if (!changes) {
      return res.status(200).send("No changes found in webhook.");
    }

    const value = changes.value;

    if (value.messages) {
      // Handle incoming messages
      const message = value.messages[0];
      const metadata = value.metadata;
      console.log("Metadata:", metadata);

      if (!message) {
        return res.status(200).send("No messages found in webhook.");
      }

      const sender = message.from;
      const receiver = metadata?.display_phone_number || "unknown";
      const to = receiver;
      const type = message.type;
      const body = message.text?.body || null;

      const newMessage = new Message({
        sender,
        receiver,
        to,
        type,
        body,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        direction: "received",
      });

      await newMessage.save();
      // console.log("Message Saved to DB (Webhook):", newMessage);
    } else if (value.statuses) {
      // Handle message status updates (sent, delivered, read)
      const status = value.statuses[0];
      console.log(
        "Message Status Update (Raw):",
        JSON.stringify(status, null, 2)
      );

      // Process status updates (including read receipts)
      if (status && status.status) {
        const messageId = status.id;
        const statusType = status.status; // "sent", "delivered", "read", etc.
        const timestamp = status.timestamp
          ? new Date(parseInt(status.timestamp) * 1000)
          : new Date();
        const recipientId = status.recipient_id;

        // Extract error information if available
        const errorInfo =
          status.errors && status.errors.length > 0
            ? {
                code: status.errors[0].code,
                title: status.errors[0].title,
                message: status.errors[0].message,
                details: status.errors[0].error_data?.details || null,
              }
            : null;

        console.log(
          `Status Update Details - ID: ${messageId}, Type: ${statusType}, Recipient: ${recipientId}`
        );

        // Check for 24-hour window error specifically
        if (errorInfo && errorInfo.code === 131047) {
          console.log(
            `⚠️ 24-HOUR WINDOW EXPIRED: Cannot send free-form message to ${recipientId}. Must use template messages.`
          );
          // You could implement notification to business manager here
        }

        // Update the message status in your database
        try {
          // Look for the message using the whatsapp_message_id in metadata
          const updateResult = await Message.findOneAndUpdate(
            { "metadata.whatsapp_message_id": messageId },
            {
              $set: {
                status: errorInfo ? "failed" : statusType,
                status_timestamp: timestamp,
                error_info: errorInfo, // Store error information
              },
            },
            { new: true }
          );

          if (updateResult) {
            if (errorInfo) {
              console.log(
                `Message ${messageId} failed with error: ${errorInfo.message}`
              );
            } else {
              console.log(
                `Message ${messageId} status updated to: ${statusType}`
              );
            }
          } else {
            console.log(`No message found with ID: ${messageId}. This might be because:
              1. The message was not stored with this ID
              2. The message ID format doesn't match what's in your database
              3. The message was sent through a different channel`);

            // Additional debugging to help identify the issue
            console.log("Looking for message with partial ID match...");
            const partialId = messageId.split(".")[1] || messageId;
            const similarMessages = await Message.find({
              "metadata.whatsapp_message_id": {
                $regex: partialId,
                $options: "i",
              },
            });

            if (similarMessages.length > 0) {
              console.log(
                `Found ${similarMessages.length} messages with similar ID pattern`
              );
              console.log("First match:", {
                id: similarMessages[0]._id,
                whatsapp_id: similarMessages[0].metadata?.whatsapp_message_id,
                status: similarMessages[0].status,
              });
            } else {
              console.log("No messages found with similar ID pattern");
            }
          }
        } catch (err) {
          console.error("Error updating message status:", err);
        }
      } else {
        console.log(
          "Status update received but missing required fields:",
          status
        );
      }
    }

    res.status(200).send("Message Processed (Webhook)");
  } catch (error) {
    console.error("Error Processing Webhook:", error);
    res.status(500).send("Internal Server Error (Webhook)");
  }
});

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
