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

export default router;
