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
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

app.use("/api/admin", adminRoute);

// 🔹 Webhook Verification (WhatsApp API)
// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];
//   console.log(mode, token, challenge);

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     res.status(200).send(challenge);
//   } else {
//     res.sendStatus(403); // Forbidden
//   }
// });
app.get("/webhook", (req, res) => {
  console.log("Verification Request:", req.query);
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🔹 Webhook Message Handling (Store in DB)
// app.post("/webhook", async (req, res) => {
//   console.log("Incoming Request:", req.body);
//   res.status(200).send("Message Received");
// });

app.post("/webhook", async (req, res) => {
  console.log("Incoming Request:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0]; // Get the first entry
    const changes = entry?.changes?.[0]; // Get the first change
    const message = changes?.value?.messages?.[0]; // Extract message

    if (!message) {
      return res.status(200).send("No messages found");
    }

    const sender = message.from; // User's WhatsApp number
    const receiver = process.env.WA_PHONE_NUMBER; // Your business number
    const type = message.type; // Message type (text, image, etc.)
    const body = message.text?.body || null; // Extract text message (if available)

    // Save to MongoDB
    const newMessage = new Message({
      sender,
      receiver,
      to: receiver, // For consistency
      type,
      body,
      timestamp: new Date(parseInt(message.timestamp) * 1000), // Convert WhatsApp timestamp
      direction: "received",
    });

    await newMessage.save();
    console.log("📩 Message Saved to DB:", newMessage);

    res.status(200).send("Message Saved");
  } catch (error) {
    console.error("❌ Error Processing Webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
