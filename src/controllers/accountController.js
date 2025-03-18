import dotenv from "dotenv";
dotenv.config();

// const getAccountDetails = async (req, res) => {
//   try {
//     const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
//     const accessToken = process.env.ACCESS_TOKEN;

//     if (!apiURL || !accessToken || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
//       return res.status(500).json({ message: "Missing environment variables" });
//     }

//     const headers = {
//       Authorization: `Bearer ${accessToken}`,
//     };

//     const response = await fetch(
//       `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=name`,
//       { headers }
//     );

//     if (!response.ok) {
//       console.error("API Error:", response.status, response.statusText);
//       return res.status(response.status).json({
//         message: `HTTP error: ${response.status} ${response.statusText}`,
//       });
//     }

//     const data = await response.json();
//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("Error fetching account details:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
const getAccountDetails = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;
    const accountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!apiURL || !accessToken || !accountId) {
      console.error("🚨 Missing environment variables:", {
        apiURL,
        accessToken,
        accountId,
      });
      return res
        .status(500)
        .json({ message: "Configuration error: Missing env variables" });
    }

    const requestURL = `${apiURL}${accountId}?fields=name`;

    console.log("📌 Making request to:", requestURL);
    console.log("📌 Authorization Header:", `Bearer ${accessToken}`);

    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await fetch(requestURL, { headers });

    if (!response.ok) {
      const errorBody = await response.text(); // Get API error details
      console.error(
        "🚨 API Error:",
        response.status,
        response.statusText,
        errorBody
      );
      return res
        .status(response.status)
        .json({ message: `HTTP error: ${response.status}`, error: errorBody });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("🚨 Error fetching account details:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAppDetails = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;
    if (!apiURL || !accessToken || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
      return res.status(500).json({ message: "Missing environment variables" });
    }
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    // console.log(
    //   `${apiURL}${process.env.VERSION}/app?access_token=${accessToken}`
    // );
    // use this url GET https://graph.facebook.com/v22.0/app?access_token=<YOUR_ACCESS_TOKEN>
    const response = await fetch(
      `${process.env.BASEURL}/${process.env.VERSION}/app?access_token=${accessToken}`,
      { headers }
    );

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }
    const data = await response.json();
    return res.status(200).json({ data, accessToken });
  } catch (error) {
    console.error("Error fetching app details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { getAccountDetails, getAppDetails };
