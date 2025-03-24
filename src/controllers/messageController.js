import express from "express";
import Message from "../models/messageModel.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

// Add a new function to check if a user is within the 24-hour window

const isWithin24HourWindow = async (phoneNumber) => {
  try {
    // Find the most recent message from this user (received messages only)
    const latestMessage = await Message.findOne({
      sender: phoneNumber,
      direction: "received",
    }).sort({ timestamp: -1 });

    if (!latestMessage) {
      return false; // No messages from this user, outside window
    }

    // Calculate time difference in hours
    const now = new Date();
    const lastMessageTime = new Date(latestMessage.timestamp);
    const hoursDifference = (now - lastMessageTime) / (1000 * 60 * 60);

    return hoursDifference < 24;
  } catch (error) {
    console.error("Error checking 24-hour window:", error);
    return false; // Default to false on error
  }
};

// Add a function to get session status for a user
const getSessionStatus = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    // Find the most recent message from this user
    const latestMessage = await Message.findOne({
      sender: phoneNumber,
      direction: "received",
    }).sort({ timestamp: -1 });

    if (!latestMessage) {
      return res.json({
        phoneNumber,
        hasActiveSession: false,
        sessionExpiresAt: null,
        timeRemaining: null,
      });
    }

    // Calculate session expiry time (24 hours after last message)
    const lastMessageTime = new Date(latestMessage.timestamp);
    const sessionExpiresAt = new Date(
      lastMessageTime.getTime() + 24 * 60 * 60 * 1000
    );
    const now = new Date();
    const hasActiveSession = now < sessionExpiresAt;

    // Calculate time remaining in minutes
    const timeRemaining = hasActiveSession
      ? Math.floor((sessionExpiresAt - now) / (1000 * 60))
      : 0;

    return res.json({
      phoneNumber,
      hasActiveSession,
      sessionExpiresAt,
      timeRemaining,
      lastMessageAt: lastMessageTime,
    });
  } catch (error) {
    console.error("Error getting session status:", error);
    return res.status(500).json({
      message: "Failed to get session status",
      error: error.message,
    });
  }
};

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

const getMessageTemplates = async (req, res) => {
  try {
    console.log("Entering getMessageTemplates route");

    const baseURL = process.env.BASEURL; // Shorten for readability and easier logging
    const version = process.env.VERSION; // Get version
    const accessToken = process.env.ACCESS_TOKEN;
    const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    console.log("baseURL:", baseURL); //Cruciacl: Verify it's set!
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

    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Define the body variable that will be sent to WhatsApp API
    const body = {
      messaging_product: messaging_product || "whatsapp",
      recipient_type: "individual",
      to: to,
      type: type,
    };

    // Check if this is a non-template message and if user is outside 24-hour window
    if (type !== "template") {
      const isInWindow = await isWithin24HourWindow(to);
      if (!isInWindow) {
        // Create a failed message record in the database
        const newMessage = new Message({
          sender: sender,
          receiver: to,
          to: to,
          type: type,
          body: type === "text" ? text?.body : "",
          direction: "sent",
          status: "failed",
          status_timestamp: new Date(),
          error_info: {
            code: 131047,
            title: "Message Outside Allowed Window",
            message: "24-hour session expired. Cannot send free-form messages.",
            details: "Use template messages instead.",
          },
          metadata: {
            timestamp: new Date(),
          },
        });

        await newMessage.save();

        return res.status(400).json({
          message:
            "Cannot send message: 24-hour customer service window expired",
          details: {
            error: "Outside 24-hour window",
            code: 131047,
            suggestion: "Use a template message instead",
          },
        });
      }
    }

    // Add message-type specific properties to the body
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

    // Rest of the function remains the same
    console.log("Sending to WhatsApp API:", JSON.stringify(body, null, 2));

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

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
    console.log("WhatsApp API response:", JSON.stringify(data, null, 2));

    try {
      // Create a new message document based on the message type
      let newMessage;

      if (type === "template") {
        // Extract parameters from components for easier access
        const parametersMap = new Map();

        if (template.components) {
          template.components.forEach((comp) => {
            if (comp.parameters) {
              comp.parameters.forEach((param, index) => {
                if (param.type === "text") {
                  parametersMap.set(`${comp.type}_${index}`, param.text);
                } else if (param.type === "image" && param.image) {
                  parametersMap.set(
                    `${comp.type}_${index}_image`,
                    param.image.link
                  );
                } else if (param.type === "document" && param.document) {
                  parametersMap.set(
                    `${comp.type}_${index}_document`,
                    param.document.link
                  );
                } else if (param.type === "video" && param.video) {
                  parametersMap.set(
                    `${comp.type}_${index}_video`,
                    param.video.link
                  );
                }
              });
            }
          });
        }

        newMessage = new Message({
          sender: sender,
          receiver: to,
          to: to,
          type: type,
          template: {
            name: template.name,
            language: template.language?.code || template.language,
            components: template.components || [],
            parameters: parametersMap,
          },
          direction: "sent",
          status: "sent",
          metadata: {
            whatsapp_message_id: data.messages?.[0]?.id,
            timestamp: new Date(),
          },
        });
      } else if (type === "image") {
        // For image messages
        newMessage = new Message({
          sender: sender,
          receiver: to,
          to: to,
          type: type,
          media: {
            type: "image",
            url: image.link || `image_id:${image.id}`,
            caption: image.caption || "",
          },
          direction: "sent",
          status: "sent",
          metadata: {
            whatsapp_message_id: data.messages?.[0]?.id,
            timestamp: new Date(),
          },
        });
      } else {
        // For text and other message types
        newMessage = new Message({
          sender: sender,
          receiver: to,
          to: to,
          type: type,
          body: type === "text" ? text.body : "",
          direction: "sent",
          status: "sent",
          metadata: {
            whatsapp_message_id: data.messages?.[0]?.id,
            timestamp: new Date(),
          },
        });
      }
      console.log({ newMessage });

      await newMessage.save();
      console.log("Message saved to database:", newMessage);
    } catch (dbError) {
      console.error("Error saving message to database:", dbError);
    }

    return res.json(data);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID;

    console.log(
      "Uploading file:",
      req.file.originalname,
      "Mimetype:",
      req.file.mimetype
    );

    // Create form data for the file upload
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");

    // Ensure the file has the correct mimetype instead of application/octet-stream
    // Get file extension and set appropriate mimetype
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
    let contentType = req.file.mimetype;

    // Map common extensions to their proper MIME types if needed
    if (contentType === "application/octet-stream") {
      const mimeTypeMap = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ppt: "application/vnd.ms-powerpoint",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        txt: "text/plain",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        mp4: "video/mp4",
        "3gp": "video/3gpp",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        amr: "audio/amr",
        aac: "audio/aac",
        opus: "audio/opus",
      };

      contentType = mimeTypeMap[fileExtension] || "application/octet-stream";
      console.log(
        `Detected file extension: ${fileExtension}, setting content type to: ${contentType}`
      );
    }

    // Create a blob with the correct content type
    const fileBlob = new Blob([req.file.buffer], { type: contentType });
    formData.append("file", fileBlob, req.file.originalname);

    // Determine file type based on content type
    let fileType = "document";
    if (contentType.startsWith("image/")) {
      fileType = "image";
    } else if (contentType.startsWith("video/")) {
      fileType = "video";
    } else if (contentType.startsWith("audio/")) {
      fileType = "audio";
    }

    formData.append("type", fileType);

    console.log(
      `Uploading as file type: ${fileType}, content type: ${contentType}`
    );

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      // FormData will set its own content-type with boundary
    };

    const response = await fetch(`${apiURL}${phoneNumberId}/media`, {
      method: "POST",
      headers,
      body: formData,
    });

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
    console.log("Media upload response:", JSON.stringify(data, null, 2));

    return res.status(200).json({
      message: "File uploaded successfully",
      mediaId: data.id,
      fileType: fileType,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};

// New function to delete uploaded media files
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId) {
      return res.status(400).json({
        message: "Media ID is required",
      });
    }

    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log(`Attempting to delete media with ID: ${mediaId}`);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiURL}${mediaId}`, {
      method: "DELETE",
      headers,
    });

    // Handle 200 OK response (successful deletion)
    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: "Media deleted successfully",
        mediaId: mediaId,
      });
    }

    // Handle other responses (usually errors)
    let errorData;
    try {
      // Try to parse error response as JSON
      errorData = await response.json();
    } catch (jsonError) {
      // If response isn't JSON, use status text
      return res.status(response.status).json({
        success: false,
        message: `Failed to delete media: ${response.status} ${response.statusText}`,
        mediaId: mediaId,
      });
    }

    // Return structured error response
    return res.status(response.status).json({
      success: false,
      message: `Failed to delete media: ${response.status} ${response.statusText}`,
      details: errorData,
      mediaId: mediaId,
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete media",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { receiver, sender } = req.body;

    // Validate required fields
    if (!receiver || !sender) {
      return res.status(400).json({
        message: "Both receiver and sender are required in the request body.",
      });
    }

    // Fetch messages between sender and receiver
    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender },
      ],
    })
      .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    console.log(
      `Found ${messages.length} messages between ${sender} and ${receiver}`
    );

    // Format the response to handle different message types
    const formattedMessages = messages.map((message) => {
      // Extract delivery and read status information
      const deliveryStatus = {
        delivered: message.status === "delivered" || message.status === "read",
        deliveredAt: message.status_timestamp || null,
        read: message.status === "read",
        readAt: message.status === "read" ? message.status_timestamp : null,
        status: message.status || "sent", // Default to "sent" if status is not defined
        error: message.error_info || null,
      };

      const baseMessage = {
        _id: message._id,
        sender: message.sender,
        receiver: message.receiver,
        to: message.to,
        type: message.type,
        timestamp: message.timestamp,
        direction: message.direction,
        status: message.status || "sent",
        deliveryInfo: deliveryStatus,
        metadata: message.metadata || {},
      };

      // Add type-specific fields
      if (message.type === "template") {
        // Safely handle template parameters conversion
        let parameters = {};

        // Check if parameters exist and is a Map-like object before converting
        if (message.template?.parameters) {
          try {
            // Handle both Map objects and regular objects
            if (typeof message.template.parameters.entries === "function") {
              // It's a Map-like object with entries method
              parameters = Object.fromEntries(
                message.template.parameters.entries()
              );
            } else if (typeof message.template.parameters === "object") {
              // It's already an object
              parameters = message.template.parameters;
            }
          } catch (err) {
            console.error("Error converting template parameters:", err);
            // Fallback to empty object if conversion fails
          }
        }

        return {
          ...baseMessage,
          body: undefined,
          template: {
            name: message.template?.name,
            language: message.template?.language,
            components: message.template?.components || [],
            parameters: parameters,
          },
        };
      } else if (
        message.type === "image" ||
        message.type === "document" ||
        message.type === "video"
      ) {
        return {
          ...baseMessage,
          body: undefined,
          media: message.media || {},
        };
      } else {
        // Text messages
        return {
          ...baseMessage,
          body: message.body || "",
          template: undefined,
        };
      }
    });

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
};

// Add this new function to retrieve media files

const getMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;

    if (!mediaId) {
      return res.status(400).json({
        message: "Media ID is required",
      });
    }

    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log(`Retrieving media with ID: ${mediaId}`);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // First, get the media URL
    const response = await fetch(`${apiURL}${mediaId}`, {
      method: "GET",
      headers,
    });

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

    const mediaData = await response.json();

    if (!mediaData.url) {
      return res.status(404).json({
        message: "Media URL not found in the response",
      });
    }

    // Now fetch the actual media file using the URL
    const mediaResponse = await fetch(mediaData.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mediaResponse.ok) {
      return res.status(mediaResponse.status).json({
        message: `Failed to fetch media file: ${mediaResponse.status} ${mediaResponse.statusText}`,
      });
    }

    // Get the content type from the response
    const contentType = mediaResponse.headers.get("content-type");

    // Get the file buffer
    const fileBuffer = await mediaResponse.buffer();

    // Set appropriate headers for the response
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="media_${mediaId}"`
    );

    // Send the file
    return res.send(fileBuffer);
  } catch (error) {
    console.error("Error retrieving media:", error);
    return res.status(500).json({
      message: "Failed to retrieve media",
      error: error.message,
    });
  }
};

// Export the new function along with existing ones
export {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  uploadFile,
  deleteMedia,
  getMedia, // Export the new function
  sendMessage,
  getMessages,
  getSessionStatus,
};
