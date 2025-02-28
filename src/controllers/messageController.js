import express from "express";
import dotenv from "dotenv";
dotenv.config();

const getUserData = async (req, res) => {
  try {
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("API URL:", apiURL);
    console.log("Access Token:", accessToken);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    console.log("Headers:", headers);

    const response = await fetch(
      apiURL + `${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`,
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
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await fetch(
      apiURL + `${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers`,
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
    return;
    res.status(500).json({ message: "Internal server error" });
  }
};
const getMessageTemplates = async (req, res) => {
  try {
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;

    console.log("API URL:", apiURL);
    console.log("Access Token:", accessToken);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    console.log("Headers:", headers);

    // Set the correct URL path of /message_templates
    const response = await fetch(
      apiURL + `${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      { headers }
    );

    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }

    const responseData = await response.json();
    //Check if the response data has a data property
    if (responseData.hasOwnProperty("data")) {
      return res.json(responseData?.data); // Send the data property
    } else {
      return res.json(responseData);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const sendMessage = async (req, res) => {
//   try {
//     const apiURL = process.env.BASEURL;
//     const accessToken = process.env.ACCESS_TOKEN;
//     const { messaging_product, to, type, template, text, components } =
//       req.body;

//     console.log("body :", req.body);

//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//       "Content-Type": "application/json",
//     };

//     let body;

//     if (type === "template") {
//       if (!template || !template.name || !template.language) {
//         return res.status(400).json({
//           message:
//             "Template name and language are required for template messages",
//         });
//       }
//       body = {
//         messaging_product,
//         to,
//         type,
//         template: {
//           name: template.name,
//           language: template.language,
//         },
//       };

//       if (components && components.length > 0) {
//         body.template.components = components; // Add components array
//       }
//     } else {
//       if (!text || !text.body) {
//         return res
//           .status(400)
//           .json({ message: "Text body is required for text messages" });
//       }
//       body = {
//         messaging_product,
//         to,
//         type,
//         text,
//       };
//     }

//     const response = await fetch(
//       apiURL + `${process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
//       {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       }
//     );

//     console.log(response);

//     if (!response.ok) {
//       console.error("HTTP error:", response.status, response.statusText);

//       let errorData;
//       try {
//         errorData = await response.json();
//       } catch (jsonError) {
//         console.error("Failed to parse error response as JSON:", jsonError);
//         return res.status(response.status).json({
//           message: `HTTP error: ${response.status} ${response.statusText}.  Could not parse error details.`,
//         });
//       }

//       return res.status(response.status).json({
//         message: `HTTP error: ${response.status} ${response.statusText}`,
//         details: errorData,
//       });
//     }

//     const data = await response.json();
//     return res.json(data);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const sendMessage = async (req, res) => {
  try {
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;
    const { messaging_product, to, type, template, text, image } = req.body;

    console.log("body :", req.body);

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
        components: template.components || [], // Include components
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
      body.image = image; // { link: '...', caption: '...' }  or  { id: '...', caption: '...' }
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    const response = await fetch(
      apiURL + `${process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID}/messages`,
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
          message: `HTTP error: ${response.status} ${response.statusText}.  Could not parse error details.`,
        });
      }

      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export { getUserData, getMessageTemplates, getPhoneNumbers, sendMessage };
