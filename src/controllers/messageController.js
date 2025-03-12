import express from "express";
import Message from "../models/messageModel.js";
import WhatsApp from "whatsapp";
import dotenv from "dotenv";
dotenv.config();

const getUserData = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("API URL:", apiURL);
    console.log("Access Token:", accessToken);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    console.log("Headers:", headers);

    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`,
      { headers }
    );
    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    console.log("API Response Data:", data);
    return res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPhoneNumbers = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers`,
      { headers }
    );
    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }
    const data = await response.json();
    console.log("API Response Data:", data);
    return res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessageTemplates = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("API URL:", apiURL);
    console.log("Access Token:", accessToken);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    console.log("Headers:", headers);

    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      { headers }
    );

    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }

    const responseData = await response.json();
    if (responseData.hasOwnProperty("data")) {
      return res.json(responseData.data);
    } else {
      return res.json(responseData);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const sendMessage = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;
    const { messaging_product, to, type, template, text, image } = req.body;

    console.log("body :", req.body);
    const sender = "Admin"; // Or get from user session, etc.
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let body = { messaging_product, to, type };

    if (type === "template") {
      if (!template || !template.name || !template.language) {
        return res.status(400).json({
          message:
            "Template name and language are required for template messages",
        });
      }

      body.template = {
        name: template.name,
        language: template.language,
        components: template.components || [],
      };
    } else if (type === "text") {
      if (!text || !text.body) {
        return res
          .status(400)
          .json({ message: "Text body is required for text messages" });
      }
      body.text = text;
    } else if (type === "image") {
      if (!image || (!image.link && !image.id)) {
        return res
          .status(400)
          .json({ message: "Image link or ID is required for image messages" });
      }
      body.image = image;
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    console.log(response);

    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);

      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse error response as JSON:", jsonError);
        return res.status(response.status).json({
          message: `HTTP error: ${response.status} ${response.statusText}. Could not parse error details.`,
        });
      }

      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    const data = await response.json();

    // **Store the message in the database**
    try {
      const newMessage = new Message({
        sender: sender,
        receiver: to, // Use the 'to' field as the receiver
        to: to,
        type: type,
        body:
          type === "text"
            ? text.body
            : template
            ? template.components?.find((comp) => comp.type === "body")?.text
            : "", // Store text or template content
        templateName: type === "template" ? template.name : null,
        templateParameters: type === "template" ? template.components : null,
        direction: "sent", //Mark as sent message
      });

      await newMessage.save();
      console.log("Message saved to database");
    } catch (dbError) {
      console.error("Error saving message to database:", dbError);
      // Consider how to handle DB errors - maybe log them and continue?
    }

    return res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const { receiver } = req.query; // Get receiver from query parameters

    if (!receiver) {
      return res.status(400).json({ message: "Receiver is required" });
    }
    const sender = "Admin";
    // Find messages where either (sender is A and receiver is B) OR (sender is B and receiver is A)
    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};
export {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
  getMessages,
};
