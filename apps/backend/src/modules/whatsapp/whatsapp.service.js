import axios from 'axios';

const WHAPI_TOKEN = "z8wYhvNYSNprX6kDhLtUf6655VaM1HkS"; // Your token from the screenshot
const WHAPI_URL = "https://gate.whapi.cloud/messages/text";

export const sendOrderNotification = async (phoneNumber, productName) => {
  try {
    // Clean the phone number (remove +, spaces, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Ensure it starts with 91 for India if not already present
    const formattedNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;

    console.log(`[WhatsApp] Preparing message | raw: "${phoneNumber}" → formatted: "${formattedNumber}" | product: "${productName}"`);
    console.log(`[WhatsApp] POST ${WHAPI_URL}`);

    const response = await axios.post(WHAPI_URL, {
      to: formattedNumber,
      body: `🎉 *Order Confirmed!* \n\nHi! Your order for *${productName}* has been placed successfully on Scraphappens. 🌿\n\nThank you for choosing sustainable materials!`,
      typing_time: 2 // Makes it look like a human is typing
    }, {
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("[WhatsApp] API response status:", response.status);
    return response.data;
  } catch (error) {
    console.error("[WhatsApp] HTTP status:", error.response?.status);
  }
};