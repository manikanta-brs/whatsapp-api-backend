import dotenv from "dotenv";
dotenv.config();

const getAccountDetails = async (req, res) => {
  try {
    const apiURL = process.env.BASEURL;
    const accessToken = process.env.ACCESS_TOKEN;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const response = await fetch(
      `${apiURL}/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=name`,
      { headers }
    );
    if (!response.ok) {
      console.error("HTTP error:", response.status, response.statusText);
      return res.status(response.status).json({
        message: `HTTP error: ${response.status} ${response.statusText}`,
      });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getAccountDetails;
