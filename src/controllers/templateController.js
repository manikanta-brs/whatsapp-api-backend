import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WHATSAPP_API_VERSION = process.env.VERSION || "v18.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const BASE_URL = process.env.BASEURL;
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const APP_ID = process.env.APP_ID;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const startUploadSession = async (fileName, fileSize, fileType) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${APP_ID}/uploads`,
      {
        file_name: fileName,
        file_length: fileSize,
        file_type: fileType,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Upload Session Response:", response.data);
    return response.data.id; // Return the upload_session_id
  } catch (error) {
    console.error(
      "Failed to start upload session:",
      error.response?.data || error.message
    );
    throw new Error("Failed to start upload session");
  }
};

const uploadFile = async (uploadSessionId, fileBuffer, fileType) => {
  try {
    console.log(fileType);
    const response = await axios.post(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${uploadSessionId}`,
      fileBuffer,
      {
        headers: {
          Authorization: `OAuth ${ACCESS_TOKEN}`,
          "Content-Type": fileType,
        },
        // Important: Ensure the request body is sent as binary data.
        transformRequest: [(data) => data], // Do not transform the data
      }
    );
    console.log("File uploaded successfully:", response.data);
    return response.data; // Return the response
  } catch (error) {
    console.error(
      "Failed to upload file:",
      error.response?.data || error.message
    );
    throw new Error("Failed to upload file");
  }
};

async function handleUpload(req, res) {
  const { appId, token } = req.body;
  console.log({ appId, token });

  if (!appId || !token) {
    return res.status(400).json({ error: "App ID and Token are required" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Extract file details
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  const fileType = req.file.mimetype;
  const fileBuffer = req.file.buffer;

  // Validate MIME type against *WhatsApp's* requirements
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "video/mp4", // WhatsApp only supports MP4 video
  ];

  if (!allowedTypes.includes(fileType)) {
    return res.status(400).json({
      error:
        "Invalid file type for WhatsApp. Supported types are: pdf, jpeg, jpg, png, mp4",
    });
  }

  try {
    // Start the upload session
    const uploadSessionId = await startUploadSession(
      fileName,
      fileSize,
      fileType
    );

    // Upload the file
    const uploadResponse = await uploadFile(
      uploadSessionId,
      fileBuffer,
      fileType
    );

    res.json({
      success: true,
      fileDetails: {
        fileName,
        fileSize,
        fileType,
        uploadDate: new Date().toISOString(),
      },
      uploadResponse,
    });
  } catch (error) {
    console.error("handleUpload error:", error.response?.status, error.message); //Log status
    res.status(500).json({ error: error.message });
  }
}

const createTemplate = async (req, res) => {
  try {
    console.log("Incoming Request:", req.body);

    // Validate templateData
    if (!req.body) {
      return res.status(400).json({ error: "templateData is required" });
    }

    let templateData;

    try {
      templateData = req.body;
    } catch (err) {
      return res
        .status(400)
        .json({ error: "Invalid JSON format in templateData" });
    }

    console.log("Parsed Template Data:", templateData);

    // Destructure template fields
    const {
      name,
      category,
      language,
      components,
      allow_category_change = false,
    } = templateData;

    // Validate required fields
    if (
      !name ||
      !category ||
      !language ||
      !components ||
      !Array.isArray(components)
    ) {
      return res.status(400).json({
        error:
          "Missing required fields. Ensure name, category, language, and components are provided.",
      });
    }

    // Construct API URL
    const apiUrlWithAccount = `${BASE_URL}/${WABA_ID}/message_templates`;

    // Send API request
    const response = await axios.post(
      apiUrlWithAccount,
      { name, category, allow_category_change, language, components },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      message: "Template created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Template creation failed:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      message: "Failed to create template",
      error: error.response?.data || error.message,
    });
  }
};

// Export all functions
export { upload, handleUpload, createTemplate };
