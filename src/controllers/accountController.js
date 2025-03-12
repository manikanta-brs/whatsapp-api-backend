import dotenv from "dotenv";
dotenv.config();

const getAccountDetails = async (req, res) => {
  try {
    const apiURL = `${process.env.BASEURL}${process.env.VERSION}/`;
    const accessToken = process.env.ACCESS_TOKEN;

    if (!apiURL || !accessToken || !process.env.WHATSAPP_BUSINESS_ACCOUNT_ID) {
      return res.status(500).json({ message: "Missing environment variables" });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await fetch(
      `${apiURL}${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=name`,
      { headers }
    );

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching account details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getAccountDetails;
