// API endpoint to fetch Vercel function logs
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get deployment ID from environment or latest
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || 'latest';
    const projectId = 'prj_xzAhrTgB81JI2fHTuGpuFPIa7mEl'; // pixan-ai
    const teamId = 'team_pnMXtCPH2f6x4jqjxsInUqAV';
    
    // Fetch logs from Vercel API
    const response = await fetch(
      `https://api.vercel.com/v2/deployments/${deploymentId}/events?projectId=${projectId}&teamId=${teamId}&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN || process.env.AUTH_BEARER_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and format logs for webhook function
    const webhookLogs = (data.events || [])
      .filter(event => 
        event.payload?.path?.includes('/api/wa/webhook') ||
        event.text?.includes('webhook')
      )
      .map(event => ({
        timestamp: event.created,
        level: event.type === 'stderr' ? 'error' : 'info',
        message: event.text || event.payload?.text || 'No message',
        details: event.payload
      }))
      .slice(0, 50);

    res.status(200).json({ 
      logs: webhookLogs,
      total: webhookLogs.length
    });
  } catch (error) {
    console.error('Error fetching Vercel logs:', error);
    res.status(500).json({ 
      error: error.message,
      logs: []
    });
  }
}