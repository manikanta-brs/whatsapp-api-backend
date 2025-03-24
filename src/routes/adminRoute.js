import { Router } from "express";
import {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
  getMessages,
  getSessionStatus,
  uploadFile,
  deleteMedia,
  getMedia, // Import the new function
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
router.post("/uploadfile", upload.single("file"), uploadFile);
router.delete("/deletefile/:mediaId", deleteMedia);
router.get("/getfile/:mediaId", getMedia); // Add new route to get media
router.post("/messages", getMessages);
router.get("/app", getAppDetails);
// Add this route to your existing routes
router.get("/session/:phoneNumber", getSessionStatus);

export default router;
