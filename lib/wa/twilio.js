/**
 * Twilio Service
 * WhatsApp messaging and media handling
 */

import twilio from 'twilio';

let twilioClient = null;

const getClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

export const sendMessage = async (to, body) => {
  return getClient().messages.create({
    body,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to
  });
};

export const downloadMedia = async (mediaUrl) => {
  const response = await fetch(mediaUrl, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64')
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  
  return { base64, mimeType };
};

export const getBalance = async () => {
  try {
    const balance = await getClient().balance.fetch();
    return {
      balance: Math.abs(parseFloat(balance.balance)),
      currency: balance.currency
    };
  } catch (error) {
    console.error('Twilio balance error:', error);
    return { balance: 0, currency: 'USD' };
  }
};
