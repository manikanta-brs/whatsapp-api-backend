import { Router } from "express";
import {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
  getMessages, // Corrected typo here
} from "../controllers/messageController.js"; // Use messageController
import createTemplate from "../controllers/templateController.js";
import getAccountDetails from "../controllers/accountController.js";

const router = Router();

// get user data
router.get("/user", getUserData);
router.get("/templates", getMessageTemplates);
router.post("/templates", createTemplate);
router.get("/account", getAccountDetails);
router.get("/phonenumbers", getPhoneNumbers);
router.post("/sendmessage", sendMessage);
router.get("/messages", getMessages);

export default router;
