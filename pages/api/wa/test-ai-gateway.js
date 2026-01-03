// Test AI Gateway balance endpoint
export default async function handler(req, res) {
  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/billing/balance', {
      headers: {
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`
      }
    });
    
    const data = await response.json();
    
    res.status(200).json({
      status: response.status,
      ok: response.ok,
      data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}