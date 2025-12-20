'use client';
import { useState } from 'react';
import { Upload, FileText, Activity, AlertCircle, HeartPulse, User, CheckCircle2, ChevronRight, Stethoscope } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null); 
  const [model, setModel] = useState('gemini'); // Por defecto Gemini que te va bien
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
    if (!file) return alert('Por favor, sube una imagen primero.');
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ENCABEZADO */}
        <div className="bg-blue-900 p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Activity className="text-blue-300" /> Evaluación de Heridas IA
            </h1>
            <p className="text-blue-200 text-sm mt-1">Asistente clínico inteligente</p>
          </div>
          <div className="hidden md:block">
            <Stethoscope className="w-10 h-10 text-blue-700 opacity-50" />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          
          {/* SECCIÓN 1: DATOS BÁSICOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Código de Paciente</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej: PAC-2024-001"
                  className="w-full p-3 pl-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none uppercase tracking-wider font-medium"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Modelo de IA</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setModel('chatgpt')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${model === 'chatgpt' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ChatGPT-4o
                </button>
                <button 
                  onClick={() => setModel('gemini')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${model === 'gemini' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Gemini Flash
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SUBIDA DE IMAGEN Y DATOS CLÍNICOS */}
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* ZONA DE SUBIDA */}
            <div className="w-full md:w-1/2">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Imagen de la lesión</label>
              <div className="border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer relative h-64 flex flex-col items-center justify-center text-center group">
                <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                
                {file ? (
                  <img src={file} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-blue-900 font-medium">Sube una foto</p>
                    <p className="text-blue-400 text-xs mt-1">JPG, PNG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* DATOS CLÍNICOS */}
            <div className="w-full md:w-1/2 bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User size={18} className="text-blue-500"/> Contexto Clínico
                <span className="text-xs font-normal text-slate-400 ml-auto">(Opcional)</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input 
                    type="number" placeholder="Edad" 
                    className="w-1/2 p-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    value={patientData.edad}
                    onChange={(e) => setPatientData({...patientData, edad: e.target.value})}
                  />
                  <select 
                    className="w-1/2 p-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    value={patientData.sexo}
                    onChange={(e) => setPatientData({...patientData, sexo: e.target.value})}
                  >
                    <option value="">Sexo</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>

                {/* Toggles simples */}
                {[
                  { label: "¿Patología Vascular?", key: 'vascular' },
                  { label: "¿Patología Cardiaca?", key: 'cardiaca' },
                  { label: "¿Paciente Diabético?", key: 'diabetico' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border border-slate-100 shadow-sm">
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <select 
                      value={(patientData as any)[item.key]}
                      onChange={(e) => setPatientData({...patientData, [item.key]: e.target.value})}
                      className={`text-sm font-bold bg-transparent outline-none cursor-pointer ${(patientData as any)[item.key] === 'Si' ? 'text-red-500' : 'text-slate-400'}`}
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button 
            onClick={analyze}
            disabled={loading || !file}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analizando Herida...
              </>
            ) : (
              <>
                ANALIZAR IMAGEN <ChevronRight size={20} />
              </>
            )}
          </button>

          {/* ZONA DE MENSAJES DE ERROR */}
          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Error en el análisis</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* RESULTADOS */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Resultados del Informe</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              {/* Estado Sheet */}
              <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${result.sheetStatus?.includes('OK') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                {result.sheetStatus?.includes('OK') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span className="font-medium">Estado guardado: {result.sheetStatus || 'Desconocido'}</span>
              </div>

              {/* Grid de Datos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(result).map(([key, value]) => {
                  if(key === 'sheetStatus' || key === 'error' || key === 'recomendaciones_cuidados') return null;
                  return (
                    <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-1 flex items-center gap-1">
                        <Activity size={12} className="text-blue-400" />
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-semibold text-slate-800 text-base leading-snug">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* CUADRO DE CUIDADOS - DISEÑO DESTACADO */}
              {result.recomendaciones_cuidados && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <HeartPulse size={100} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2 mb-4 relative z-10">
                    <HeartPulse className="w-6 h-6 text-indigo-600" /> 
                    Plan de Cuidados Sugerido
                  </h3>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-indigo-100/50">
                    <div className="text-indigo-900 whitespace-pre-line leading-relaxed text-sm md:text-base font-medium">
                      {result.recomendaciones_cuidados}
                    </div>
                  </div>
                  
                  <p className="text-xs text-indigo-400 mt-3 text-center italic">
                    * Sugerencia generada por IA. Validar siempre con criterio clínico profesional.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      <p className="text-center text-slate-400 text-xs mt-8">
        Herramienta de Investigación - v1.0
      </p>
    </main>
  );
}
