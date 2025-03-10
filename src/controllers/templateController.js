import dotenv from "dotenv";
dotenv.config();

const createTemplate = async (req, res) => {
  try {
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;
    const whatsappBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID; // Get the account ID

    const { name, category, allow_category_change, language, components } =
      req.body;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const requestBody = JSON.stringify({
      // Serialize the data to JSON
      name,
      category,
      allow_category_change,
      language,
      components,
    });

    const apiUrlWithAccount = `${apiURL}/${whatsappBusinessAccountId}/message_templates`; // Construct the full URL
    console.log("API URL:", apiUrlWithAccount); // Log the full API URL
    console.log("Request Headers:", headers);
    console.log("Request Body:", requestBody);

    const response = await fetch(apiUrlWithAccount, {
      method: "POST",
      headers: headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorBody = await response.text(); // or response.json() if the API returns JSON errors
      console.error(
        "API error:",
        response.status,
        response.statusText,
        errorBody
      );
      return res.status(response.status).json({
        message: `Failed to create template. API error: ${response.status} ${response.statusText}`,
        error: errorBody,
      });
    }

    const responseData = await response.json();
    console.log("API Response:", responseData);
    return res
      .status(200)
      .json({ message: "Template created successfully", data: responseData });
  } catch (error) {
    console.error("Fetch Error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export default createTemplate;
