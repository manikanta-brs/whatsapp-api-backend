// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import adminRoute from "./src/routes/adminRoute.js";

// dotenv.config();

// const app = express();

// app.use(express.json());

// // Allow requests from both frontend ports (4000 and 5173)
// const allowedOrigins = [
//   "http://localhost:4000",
//   "http://localhost:5174",
//   "http://localhost:5173",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // Allow cookies if needed
//   })
// );

// app.get("/", (req, res) => {
//   res.json({ message: "Welcome to the API!" });
// });

// app.use("/api/admin", adminRoute);
// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === "YOUR_VERIFY_TOKEN") {
//     res.status(200).send(challenge);
//   } else {
//     res.sendStatus(403); // Forbidden
//   }
// });

// app.listen(3000, () => {
//   console.log("Server is running on port 3000");
// });

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import adminRoute from "./src/routes/adminRoute.js";

dotenv.config();

const app = express();

app.use(express.json());

// Allow requests from both frontend ports (4000 and 5173)
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
    credentials: true, // Allow cookies if needed
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

app.use("/api/admin", adminRoute);

// Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403); // Forbidden
  }
});

// Webhook Message Handling
app.post("/webhook", (req, res) => {
  const body = req.body;

  console.log("Webhook payload:", JSON.stringify(body, null, 2));

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumberId =
        body.entry[0].changes[0].value.metadata.phone_number_id;
      const from = body.entry[0].changes[0].value.messages[0].from;
      const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

      console.log("Phone Number ID:", phoneNumberId);
      console.log("From:", from);
      console.log("Message Body:", msgBody);

      // Process the message (e.g., store it, send a reply)
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
