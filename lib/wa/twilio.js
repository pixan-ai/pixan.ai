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

/**
 * Split long messages into chunks that fit WhatsApp's limit
 * Twilio WhatsApp has a 1600 character limit per message
 */
const splitMessage = (text, maxLength = 1500) => {
  // Leave margin of 100 chars for safety
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    
    // Try to split at natural break points
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength);
    
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf('\n', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf('. ', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }
    
    chunks.push(remaining.substring(0, splitIndex + 1).trim());
    remaining = remaining.substring(splitIndex + 1).trim();
  }
  
  return chunks;
};

/**
 * Send WhatsApp message, automatically splitting if too long
 */
export const sendMessage = async (to, body) => {
  const chunks = splitMessage(body);
  
  for (let i = 0; i < chunks.length; i++) {
    let messageText = chunks[i];
    
    // Add part indicator if multiple chunks
    if (chunks.length > 1) {
      messageText = `(${i + 1}/${chunks.length})\n${messageText}`;
    }
    
    await getClient().messages.create({
      body: messageText,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to
    });
    
    // Small delay between messages to maintain order
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
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
