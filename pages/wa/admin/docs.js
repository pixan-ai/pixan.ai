import { useState, useEffect } from 'react';
import { Upload, Trash2, Search, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DocsAdminPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wa/admin/docs');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        showMessage('error', 'Error cargando documentos: ' + data.error);
      }
    } catch (error) {
      showMessage('error', 'Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setDisplayName(file.name);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showMessage('error', 'Selecciona un archivo primero');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('displayName', displayName);

      const response = await fetch('/api/wa/admin/docs', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        setSelectedFile(null);
        setDisplayName('');
        document.getElementById('fileInput').value = '';
        await loadDocuments();
      } else {
        showMessage('error', 'Error: ' + data.error);
      }
    } catch (error) {
      showMessage('error', 'Error subiendo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docName) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wa/admin/docs?name=${encodeURIComponent(docName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        await loadDocuments();
      } else {
        showMessage('error', 'Error: ' + data.error);
      }
    } catch (error) {
      showMessage('error', 'Error eliminando: ' + error.message);
    }
  };

  const handleTest = async (e) => {
    e.preventDefault();
    
    if (!testQuery.trim()) {
      showMessage('error', 'Escribe una consulta para probar');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/wa/admin/test-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: testQuery })
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data);
      } else {
        showMessage('error', 'Error: ' + data.error);
      }
    } catch (error) {
      showMessage('error', 'Error en búsqueda: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const exampleQueries = [
    '¿Cuánto gano por vender shampoo?',
    'El cliente dice que está muy caro, ¿qué hago?',
    '¿Cuál es el precio de la crema facial?',
    '¿Cómo manejo la objeción "lo voy a pensar"?',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📚 Base de Conocimiento Pixan
              </h1>
              <p className="text-gray-600 mt-1">
                Administra documentos para el bot de WhatsApp con Gemini File Search
              </p>
            </div>
          </div>
        </div>

        {/* Alert Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Documents */}
          <div className="space-y-6">
            {/* Document List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Documentos Actuales</h2>
                <button
                  onClick={loadDocuments}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                  <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Recargar
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-3">Cargando documentos...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No hay documentos cargados aún</p>
                  <p className="text-sm text-gray-400 mt-1">Sube tu primer documento abajo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow border border-blue-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <p className="font-medium text-gray-900 truncate">
                            {doc.displayName || doc.name}
                          </p>
                        </div>
                        {doc.createTime && (
                          <p className="text-xs text-gray-500 mt-1 ml-6">
                            {new Date(doc.createTime).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(doc.name)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total: <strong className="text-gray-900">{documents.length}</strong> documentos
                </p>
              </div>
            </div>

            {/* Upload Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Subir Nuevo Documento</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.json,.csv,.md"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos: PDF, TXT, DOC, DOCX, XLS, XLSX, JSON, CSV, MD (max 100 MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre para mostrar
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Comisiones 2025"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    disabled={uploading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Subir Documento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel - Testing */}
          <div className="space-y-6">
            {/* Test Search */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🧪 Probar Búsqueda</h2>
              
              <form onSubmit={handleTest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consulta de prueba
                  </label>
                  <textarea
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Ej: ¿Cuánto gano por vender una crema?"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl h-24 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                    disabled={testing}
                  />
                </div>

                <button
                  type="submit"
                  disabled={testing || !testQuery.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </button>
              </form>

              {/* Test Result */}
              {testResult && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Respuesta:</p>
                    <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                      {testResult.response}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-green-200">
                    <span className={testResult.usedKnowledge ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {testResult.usedKnowledge ? '✅ Usó File Search' : 'ℹ️ Respuesta directa'}
                    </span>
                    <span>{testResult.duration}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Example Queries */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 Ejemplos de Consultas</h2>
              
              <div className="space-y-2">
                {exampleQueries.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTestQuery(example)}
                    className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-lg transition-all border border-transparent hover:border-blue-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Importante
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Los documentos se almacenan permanentemente en Gemini File Search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Solo Gemini puede consultar estos documentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>El bot detecta automáticamente cuándo usar la base de conocimiento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Los cambios están disponibles inmediatamente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
