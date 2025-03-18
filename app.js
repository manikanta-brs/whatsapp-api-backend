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
      // console.log(" Message Status Update:", status);
      // You might want to update the corresponding message in your database based on this status.
      // For example, mark a message as "delivered" or "read".
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
