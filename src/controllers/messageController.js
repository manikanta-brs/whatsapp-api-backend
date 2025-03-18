import express from "express";
import Message from "../models/messageModel.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const getUserData = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`,
      { headers }
    );
    if (!response.ok) {
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
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
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const getMessageTemplates = async (req, res) => {
//   try {
//     const baseURL = `${process.env.BASEURL}${process.env.VERSION}/`;
//     const accessToken = process.env.ACCESS_TOKEN;
//     const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//       "Content-Type": "application/json",
//     };

//     let allTemplates = [];
//     let nextURL = `${baseURL}${whatsappBusinessAccountId}/message_templates`;

//     while (nextURL) {
//       console.log(`Fetching from: ${nextURL}`);

//       const response = await axios.get(nextURL, { headers });

//       if (response.status !== 200) {
//         throw new Error(
//           `HTTP error: ${response.status} ${response.statusText}`
//         );
//       }

//       const templates = response.data.data;
//       allTemplates = allTemplates.concat(templates); // Add current batch to results

//       if (response.data.paging && response.data.paging.next) {
//         nextURL = response.data.paging.next;
//       } else {
//         nextURL = null; // No more pages
//       }
//     }

//     console.log("Total Templates:", allTemplates.length);
//     return res.json(allTemplates);
//   } catch (error) {
//     console.error("Error fetching templates:", error); //Better error logging
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message }); //Include error message in response
//   }
// };
const getMessageTemplates = async (req, res) => {
  try {
    console.log("Entering getMessageTemplates route");

    const baseURL = process.env.BASEURL; // Shorten for readability and easier logging
    const version = process.env.VERSION; // Get version
    const accessToken = process.env.ACCESS_TOKEN;
    const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    console.log("baseURL:", baseURL); //Crucial: Verify it's set!
    console.log("version:", version); // Verify this too
    console.log(
      "accessToken (first 5 chars):",
      accessToken ? accessToken.substring(0, 5) : null
    ); //Security: Show only a few chars
    console.log("whatsappBusinessAccountId:", whatsappBusinessAccountId); //Verify this is set

    if (!baseURL || !version || !accessToken || !whatsappBusinessAccountId) {
      console.error("Missing environment variables!"); // Very Important: Check this first
      return res.status(500).json({
        message: "Internal server error",
        error: "Missing required environment variables",
      });
    }
    const fullBaseURL = `${baseURL}${version}/`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let allTemplates = [];
    let nextURL = `${fullBaseURL}${whatsappBusinessAccountId}/message_templates`;

    while (nextURL) {
      console.log(`Fetching from: ${nextURL}`);

      try {
        //Wrap axios.get in try/catch
        const response = await axios.get(nextURL, { headers });

        if (response.status !== 200) {
          console.error(
            "HTTP error details:",
            response.status,
            response.statusText,
            response.data
          ); // Log more details
          throw new Error(
            `HTTP error: ${response.status} ${response.statusText}`
          );
        }

        const templates = response.data.data;

        if (!Array.isArray(templates)) {
          //Check if templates is an array!
          console.error(
            "Templates is not an array. Response data:",
            response.data
          );
          throw new Error("Templates data is not an array");
        }

        allTemplates = allTemplates.concat(templates); // Add current batch to results

        if (response.data.paging && response.data.paging.next) {
          nextURL = response.data.paging.next;
        } else {
          nextURL = null; // No more pages
        }
      } catch (axiosError) {
        //Handle axios errors specifically
        console.error("Axios error:", axiosError);
        if (axiosError.response) {
          console.error("Axios error response data:", axiosError.response.data);
          console.error(
            "Axios error response status:",
            axiosError.response.status
          );
          console.error(
            "Axios error response headers:",
            axiosError.response.headers
          );
        } else if (axiosError.request) {
          console.error(
            "Axios error: No response received",
            axiosError.request
          );
        } else {
          console.error("Axios error: Request setup error", axiosError.message);
        }
        throw axiosError; //Re-throw to be caught in outer catch
      }
    }

    console.log("Total Templates:", allTemplates.length);
    return res.json(allTemplates);
  } catch (error) {
    console.error("Error in getMessageTemplates route:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;
    const {
      messaging_product,
      to,
      type,
      template,
      text,
      image,
      receiver,
      sender,
    } = req.body;

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

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
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

    try {
      const newMessage = new Message({
        sender: sender,
        receiver: to,
        to: to,
        type: type,
        body:
          type === "text"
            ? text.body
            : template
            ? template.components?.find((comp) => comp.type === "body")?.text
            : "",
        templateName: type === "template" ? template.name : null,
        templateParameters: type === "template" ? template.components : null,
        direction: "sent",
      });

      await newMessage.save();
    } catch (dbError) {}

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const { receiver, sender } = req.body;

    if (!receiver || !sender) {
      return res.status(400).json({
        message: "Both receiver and sender are required in the request body.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
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
