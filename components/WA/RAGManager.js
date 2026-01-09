/**
 * RAG Manager Component
 * Upload, manage, and search documents with embeddings
 */

import { useState, useEffect } from 'react';
import { Upload, Trash2, Search, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function RAGManager() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState(null);

  // Fetch documents on load
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wa/rag/list');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      showMessage('Error cargando documentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showMessage('El archivo es demasiado grande (máx. 10MB)', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      showMessage('Tipo de archivo no soportado', 'error');
      return;
    }

    try {
      setUploading(true);
      showMessage('Procesando documento...', 'info');

      // Read file as base64
      const reader = new FileReader();
      const fileContent = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      // Upload to server
      const response = await fetch('/api/wa/rag/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content: fileContent,
          category
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage(`✅ ${file.name} cargado exitosamente`, 'success');
        fetchDocuments();
        e.target.value = ''; // Reset input
      } else {
        throw new Error(data.error || 'Error uploading');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('Error al cargar el documento', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId, filename) => {
    if (!confirm(`¿Eliminar "${filename}"?`)) return;

    try {
      const response = await fetch('/api/wa/rag/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('Documento eliminado', 'success');
        fetchDocuments();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showMessage('Error al eliminar', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch('/api/wa/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          topK: 5,
          category: category === 'all' ? null : category
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      showMessage('Error en búsqueda', 'error');
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos RAG</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sube documentos para que el bot pueda consultar información específica
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{stats.vectorCount || 0}</div>
            <div className="text-xs text-gray-500">vectores almacenados</div>
          </div>
        )}
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
           <Loader className="w-5 h-5 animate-spin" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.csv"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            PDF, DOCX, TXT, MD, CSV (máx. 10MB)
          </p>
          
          {/* Category Selector */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <label className="text-sm text-gray-600">Categoría:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="general">General</option>
              <option value="productos">Productos</option>
              <option value="politicas">Políticas</option>
              <option value="ventas">Ventas</option>
              <option value="faq">FAQ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar en documentos..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-700">Resultados:</h3>
            {searchResults.map((result, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {result.filename} (Chunk {result.chunkIndex + 1}/{result.totalChunks})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Score: {(result.score * 100).toFixed(1)}% • {result.category}
                    </div>
                    <div className="text-sm text-gray-700 mt-2 line-clamp-3">
                      {result.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Documentos ({documents.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay documentos cargados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{doc.filename}</div>
                    <div className="text-xs text-gray-500 mt-1 flex gap-3">
                      <span>📁 {doc.category}</span>
                      <span>📄 {doc.fileType}</span>
                      <span>📊 {doc.chunksCount} chunks</span>
                      <span>📝 {doc.wordCount} palabras</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(doc.uploadedAt).toLocaleString('es-MX')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
