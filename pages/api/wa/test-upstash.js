// Test endpoint to diagnose Upstash connection
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  console.log('🔍 Testing Upstash connection...');
  console.log('URL exists:', !!url);
  console.log('URL starts with https:', url?.startsWith('https://'));
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length);
  
  try {
    const redis = new Redis({ url, token });
    
    // Test 1: Simple PING
    console.log('Test 1: PING');
    const pingResult = await redis.ping();
    console.log('PING result:', pingResult);
    
    // Test 2: SET/GET
    console.log('Test 2: SET/GET');
    await redis.set('test:key', 'test-value');
    const getValue = await redis.get('test:key');
    console.log('GET result:', getValue);
    
    // Test 3: Check memory keys
    console.log('Test 3: Check memory keys');
    const recentKeys = await redis.keys('recent:*');
    const logsKeys = await redis.keys('logs:*');
    console.log('Recent keys:', recentKeys?.length || 0);
    console.log('Logs keys:', logsKeys?.length || 0);
    
    return res.status(200).json({
      success: true,
      tests: {
        ping: pingResult,
        setGet: getValue === 'test-value',
        recentKeys: recentKeys?.length || 0,
        logsKeys: logsKeys?.length || 0
      },
      config: {
        urlValid: url?.startsWith('https://'),
        tokenValid: token?.length > 20,
        urlPrefix: url?.substring(0, 30) + '...'
      }
    });
  } catch (error) {
    console.error('❌ Upstash test failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        urlValid: url?.startsWith('https://'),
        tokenValid: token?.length > 20,
        urlPrefix: url?.substring(0, 30) + '...'
      }
    });
  }
}