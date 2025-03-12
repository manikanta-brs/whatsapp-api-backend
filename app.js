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
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log(mode, token, challenge);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403); // Forbidden
  }
});

// 🔹 Webhook Message Handling (Store in DB)
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    console.log("Webhook payload:", JSON.stringify(body, null, 2));

    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const from = body.entry[0].changes[0].value.messages[0].from; // User's WhatsApp number
      const to = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID; // Admin's number
      const msgBody =
        body.entry[0].changes[0].value.messages[0].text?.body ||
        "Media Message";
      const msgType = body.entry[0].changes[0].value.messages[0].type || "text";

      console.log("From:", from);
      console.log("To:", to);
      console.log("Message:", msgBody);

      // Save received message to MongoDB
      await Message.create({
        sender: from,
        receiver: to,
        body: msgBody,
        type: msgType,
        timestamp: new Date(),
        direction: "received",
      });

      console.log("✅ Received message saved to DB!");
    }

    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("❌ Error saving received message:", error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
