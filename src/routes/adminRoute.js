import { Router } from "express";
import {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
} from "../controllers/messageController.js";
import getAccountDetails from "../controllers/accountController.js";
const router = Router();

// get user data
router.get("/user", getUserData);
router.get("/templates", getMessageTemplates);
router.get("/account", getAccountDetails);
router.get("/phonenumbers", getPhoneNumbers);
router.post("/sendmessage", sendMessage);
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "YOUR_VERIFY_TOKEN") {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403); // Forbidden
  }
});

export default router;
