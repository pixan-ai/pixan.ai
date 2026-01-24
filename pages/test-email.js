import { useState } from 'react';

export default function TestEmail() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const sendTestEmail = async () => {
    setLoading(true);
    setStatus('Enviando email de prueba...');
    setResponse(null);

    try {
      const visitData = {
        page: '/test-email',
        referrer: 'Manual test',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const res = await fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData),
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        setStatus('✅ Email enviado! Revisa aaaprosperi@gmail.com');
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px' }}>
      <h1 style={{ color: '#2C5F7C' }}>🧪 Test Email Notifications</h1>

      <button onClick={sendTestEmail} disabled={loading} style={{
        background: '#2C5F7C', color: 'white', padding: '15px 30px',
        border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%',
        fontSize: '16px', fontWeight: '600'
      }}>
        {loading ? '⏳ Enviando...' : '📧 Enviar Email de Prueba'}
      </button>

      {status && <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px',
        background: status.includes('✅') ? '#D1FAE5' : '#FEE2E2',
        color: status.includes('✅') ? '#065F46' : '#7F1D1D' }}>{status}</div>}

      {response && <pre style={{ marginTop: '20px', background: '#1d1d1d', color: '#00ff00',
        padding: '15px', borderRadius: '6px', overflow: 'auto' }}>
        {JSON.stringify(response, null, 2)}
      </pre>}
    </div>
  );
}
