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

// const sendMessage = async (req, res) => {
//   try {
//     const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
//     const accessToken = process.env.ACCESS_TOKEN;
//     const {
//       messaging_product,
//       to,
//       type,
//       template,
//       text,
//       image,
//       receiver,
//       sender,
//     } = req.body;

//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//       "Content-Type": "application/json",
//     };

//     let body = { messaging_product, to, type };

//     if (type === "template") {
//       if (!template || !template.name || !template.language) {
//         return res.status(400).json({
//           message:
//             "Template name and language are required for template messages",
//         });
//       }

//       body.template = {
//         name: template.name,
//         language: template.language,
//         components: template.components || [],
//       };
//     } else if (type === "text") {
//       if (!text || !text.body) {
//         return res
//           .status(400)
//           .json({ message: "Text body is required for text messages" });
//       }
//       body.text = text;
//     } else if (type === "image") {
//       if (!image || (!image.link && !image.id)) {
//         return res
//           .status(400)
//           .json({ message: "Image link or ID is required for image messages" });
//       }
//       body.image = image;
//     } else {
//       return res.status(400).json({ message: "Invalid message type" });
//     }

//     const response = await fetch(
//       `${apiURL}${process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       }
//     );

//     if (!response.ok) {
//       let errorData;
//       try {
//         errorData = await response.json();
//       } catch (jsonError) {
//         return res.status(response.status).json({
//           message: `HTTP error: ${response.status} ${response.statusText}. Could not parse error details.`,
//         });
//       }

//       return res.status(response.status).json({
//         message: `HTTP error: ${response.status} ${response.statusText}`,
//         details: errorData,
//       });
//     }

//     const data = await response.json();

//     try {
//       const newMessage = new Message({
//         sender: sender,
//         receiver: to,
//         to: to,
//         type: type,
//         body:
//           type === "text"
//             ? text.body
//             : template
//             ? template.components?.find((comp) => comp.type === "body")?.text
//             : "",
//         templateName: type === "template" ? template.name : null,
//         templateParameters: type === "template" ? template.components : null,
//         direction: "sent",
//       });

//       await newMessage.save();
//     } catch (dbError) {}

//     return res.json(data);
//   } catch (error) {
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
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

    console.log("Sending to WhatsApp API:", JSON.stringify(body, null, 2));

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

// const getMessages = async (req, res) => {
//   try {
//     const { receiver, sender } = req.body;

//     // Validate required fields
//     if (!receiver || !sender) {
//       return res.status(400).json({
//         message: "Both receiver and sender are required in the request body.",
//       });
//     }

//     // Fetch messages between sender and receiver
//     const messages = await Message.find({
//       $or: [
//         { sender: sender, receiver: receiver },
//         { sender: receiver, receiver: sender },
//       ],
//     })
//       .sort({ timestamp: 1 }) // Sort by timestamp in ascending order
//       .lean(); // Convert Mongoose documents to plain JavaScript objects

//     console.log(
//       `Found ${messages.length} messages between ${sender} and ${receiver}`
//     );

//     // Format the response to handle different message types
//     const formattedMessages = messages.map((message) => {
//       const baseMessage = {
//         _id: message._id,
//         sender: message.sender,
//         receiver: message.receiver,
//         to: message.to,
//         type: message.type,
//         timestamp: message.timestamp,
//         direction: message.direction,
//         status: message.status || "sent",
//       };

//       // Add type-specific fields
//       if (message.type === "template") {
//         // Safely handle template parameters conversion
//         let parameters = {};

//         // Check if parameters exist and is a Map-like object before converting
//         if (message.template?.parameters) {
//           try {
//             // Handle both Map objects and regular objects
//             if (typeof message.template.parameters.entries === "function") {
//               // It's a Map-like object with entries method
//               parameters = Object.fromEntries(
//                 message.template.parameters.entries()
//               );
//             } else if (typeof message.template.parameters === "object") {
//               // It's already an object
//               parameters = message.template.parameters;
//             }
//           } catch (err) {
//             console.error("Error converting template parameters:", err);
//             // Fallback to empty object if conversion fails
//           }
//         }

//         return {
//           ...baseMessage,
//           template: {
//             name: message.template?.name,
//             language: message.template?.language,
//             components: message.template?.components || [],
//             parameters: parameters,
//           },
//         };
//       } else if (
//         message.type === "image" ||
//         message.type === "document" ||
//         message.type === "video"
//       ) {
//         return {
//           ...baseMessage,
//           media: message.media || {},
//         };
//       } else {
//         // Text messages
//         return {
//           ...baseMessage,
//           body: message.body || "",
//         };
//       }
//     });

//     res.status(200).json(formattedMessages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to fetch messages", error: error.message });
//   }
// };
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
      const baseMessage = {
        _id: message._id,
        sender: message.sender,
        receiver: message.receiver,
        to: message.to,
        type: message.type,
        timestamp: message.timestamp,
        direction: message.direction,
        status: message.status || "sent",
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

export {
  getUserData,
  getMessageTemplates,
  getPhoneNumbers,
  sendMessage,
  getMessages,
};
