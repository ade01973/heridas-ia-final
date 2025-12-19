'use client';
import { useState } from 'react';
import { Upload, FileText, Activity, AlertCircle, HeartPulse, User } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null); 
  const [model, setModel] = useState('chatgpt');
  const [idCode, setIdCode] = useState('');

  // --- NUEVOS DATOS DEL PACIENTE (Opcionales) ---
  const [patientData, setPatientData] = useState({
    edad: '',
    sexo: '',
    vascular: 'No',
    cardiaca: 'No',
    diabetico: 'No'
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setFile(reader.result as string);
      reader.readAsDataURL(f);
      setResult(null); 
      setError(null);
    }
  };

  const analyze = async () => {
    if (!file) return alert('Sube una imagen primero');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        // ENVIAMOS TAMBIÉN LOS DATOS DEL PACIENTE
        body: JSON.stringify({ 
          image: file, 
          modelId: model, 
          identificationCode: idCode,
          patientData: patientData 
        }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido en el servidor');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
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
            <div className="space-y-4">
              <img src={file} alt="Preview" className="w-full h-64 object-cover rounded-lg mt-4" />
              
              {/* --- AQUÍ ESTÁN LOS NUEVOS CAMPOS DE DATOS --- */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={18}/> Datos del Paciente (Opcional para mejorar IA)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="number" placeholder="Edad" 
                    className="p-2 border rounded"
                    value={patientData.edad}
                    onChange={(e) => setPatientData({...patientData, edad: e.target.value})}
                  />
                  <select 
                    className="p-2 border rounded"
                    value={patientData.sexo}
                    onChange={(e) => setPatientData({...patientData, sexo: e.target.value})}
                  >
                    <option value="">Sexo (Seleccionar)</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                  
                  <div className="flex items-center justify-between bg-white p-2 border rounded">
                    <span className="text-sm">¿Pat. Vascular?</span>
                    <select 
                      value={patientData.vascular}
                      onChange={(e) => setPatientData({...patientData, vascular: e.target.value})}
                      className="font-bold text-blue-600 bg-transparent"
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 border rounded">
                    <span className="text-sm">¿Pat. Cardiaca?</span>
                    <select 
                      value={patientData.cardiaca}
                      onChange={(e) => setPatientData({...patientData, cardiaca: e.target.value})}
                      className="font-bold text-blue-600 bg-transparent"
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>

                   <div className="flex items-center justify-between bg-white p-2 border rounded col-span-2">
                    <span className="text-sm">¿Diabético?</span>
                    <select 
                      value={patientData.diabetico}
                      onChange={(e) => setPatientData({...patientData, diabetico: e.target.value})}
                      className="font-bold text-blue-600 bg-transparent"
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={analyze}
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {loading ? 'Analizando...' : 'ANALIZAR IMAGEN'}
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5" />
            <p><strong>Fallo:</strong> {error}</p>
          </div>
        )}

        {/* Resultados */}
        {result && (
          <div className="bg-slate-50 p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText /> Resultados
            </h2>
            
            <div className={`text-sm mb-4 p-2 rounded ${result.sheetStatus?.includes('OK') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Estado Google Sheet: {result.sheetStatus || 'Desconocido'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(result).map(([key, value]) => {
                if(key === 'sheetStatus' || key === 'error' || key === 'recomendaciones_cuidados') return null;
                return (
                  <div key={key} className="bg-white p-3 rounded border shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">{key.replace('_', ' ')}</p>
                    <p className="font-medium text-gray-900">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                  </div>
                )
              })}
            </div>

            {/* CUADRO DE CUIDADOS VISUAL */}
            {result.recomendaciones_cuidados && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-4">
                <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2 mb-3">
                  <HeartPulse className="w-5 h-5" /> Sugerencias de Cuidados
                </h3>
                <div className="text-blue-900 whitespace-pre-line leading-relaxed">
                  {result.recomendaciones_cuidados}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </main>
  );
}
