'use client';
import { useState } from 'react';
import { Upload, FileText, Activity } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [model, setModel] = useState('chatgpt');
  const [idCode, setIdCode] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setFile(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const analyze = async () => {
    if (!file) return alert('Sube una imagen primero');
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: file, modelId: model, identificationCode: idCode }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      alert('Error al analizar');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 flex items-center gap-2">
          <Activity /> Evaluación de Heridas IA
        </h1>

        {/* Formulario */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Código Identificación</label>
            <input 
              type="text" 
              placeholder="Ej: PAC-001"
              className="w-full p-2 border rounded"
              value={idCode}
              onChange={(e) => setIdCode(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setModel('chatgpt')}
              className={`p-3 rounded border text-center ${model === 'chatgpt' ? 'bg-blue-100 border-blue-500 font-bold' : 'bg-gray-50'}`}
            >
              ChatGPT-4o
            </button>
            <button 
              onClick={() => setModel('gemini')}
              className={`p-3 rounded border text-center ${model === 'gemini' ? 'bg-blue-100 border-blue-500 font-bold' : 'bg-gray-50'}`}
            >
              Gemini Flash
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer relative">
            <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Haz clic para subir foto de la herida</p>
            </div>
          </div>

          {file && (
            <img src={file} alt="Preview" className="w-full h-64 object-cover rounded-lg mt-4" />
          )}

          <button 
            onClick={analyze}
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {loading ? 'Analizando...' : 'ANALIZAR IMAGEN'}
          </button>
        </div>

        {/* Resultados */}
        {result && (
          <div className="bg-slate-50 p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText /> Resultados
            </h2>
            <div className={`text-sm mb-4 p-2 rounded ${result.sheetStatus.includes('OK') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Estado Google Sheet: {result.sheetStatus}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result).map(([key, value]) => {
                if(key === 'sheetStatus') return null;
                return (
                  <div key={key} className="bg-white p-3 rounded border shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">{key.replace('_', ' ')}</p>
                    <p className="font-medium text-gray-900">{String(value)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
