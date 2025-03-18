import { Router } from "express";
import {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
  getMessages,
} from "../controllers/messageController.js";

import {
  createTemplate,
  handleUpload,
  upload,
} from "../controllers/templateController.js"; // Fix import

import {
  getAccountDetails,
  getAppDetails,
} from "../controllers/accountController.js";
const router = Router();

// Define routes
router.get("/user", getUserData);
router.get("/templates", getMessageTemplates);
router.post("/templates", createTemplate); // Fixed import issue
router.get("/account", getAccountDetails);
router.get("/phonenumbers", getPhoneNumbers);
router.post("/sendmessage", sendMessage);
router.post("/upload", upload.single("file"), handleUpload);
router.post("/messages", getMessages);
router.get("/app", getAppDetails);

export default router;
