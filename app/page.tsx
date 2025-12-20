'use client';
import { useState } from 'react';
import { Upload, FileText, Activity, AlertCircle, HeartPulse, User, CheckCircle2, ChevronRight, Stethoscope, Microscope } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null); 
  const [model, setModel] = useState('gemini'); // Por defecto Gemini
  const [idCode, setIdCode] = useState('');

  // --- DATOS DEL PACIENTE ---
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
    <main className="min-h-screen bg-slate-50 py-10 px-4 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* ENCABEZADO ACADÉMICO / CIENTÍFICO */}
        <div className="bg-slate-900 p-8 text-white flex items-center justify-between border-b-4 border-blue-500">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 tracking-tight">
              <Microscope className="text-blue-400 w-8 h-8" /> 
              Valoración de Heridas Guiada por IA
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 font-light">
              Sistema de Apoyo a la Decisión Clínica mediante Visión Computacional
            </p>
          </div>
          <div className="hidden md:block opacity-20">
            <Activity className="w-16 h-16 text-white" />
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          
          {/* SECCIÓN 1: DATOS DEL ESTUDIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID de Sujeto / Paciente</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej: SUJETO-A001"
                  className="w-full p-3 pl-4 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none uppercase font-mono text-slate-700"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo de Procesamiento</label>
              <div className="flex bg-slate-100 p-1.5 rounded-md border border-slate-200">
                <button 
                  onClick={() => setModel('chatgpt')}
                  className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-all ${model === 'chatgpt' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ChatGPT
                </button>
                <button 
                  onClick={() => setModel('gemini')}
                  className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-all ${model === 'gemini' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Gemini
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* SECCIÓN 2: DATOS CLÍNICOS E IMAGEN */}
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* ZONA DE SUBIDA */}
            <div className="w-full lg:w-5/12">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Evidencia Fotográfica</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative h-72 flex flex-col items-center justify-center text-center group">
                <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                
                {file ? (
                  <img src={file} alt="Preview" className="w-full h-full object-contain p-2 rounded-lg" />
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:shadow-md transition-all">
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="text-slate-700 font-medium">Cargar imagen de la lesión</p>
                    <p className="text-slate-400 text-xs mt-2">Formatos admitidos: JPG, PNG</p>
                  </>
                )}
              </div>
            </div>

            {/* VARIABLES CLÍNICAS */}
            <div className="w-full lg:w-7/12 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <User className="text-blue-600" size={20}/> Variables Clínicas del Paciente
              </h3>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-1/2">
                     <label className="text-xs text-slate-500 font-bold mb-1 block">Edad</label>
                     <input 
                      type="number" 
                      className="w-full p-2.5 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      value={patientData.edad}
                      onChange={(e) => setPatientData({...patientData, edad: e.target.value})}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs text-slate-500 font-bold mb-1 block">Sexo</label>
                    <select 
                      className="w-full p-2.5 text-sm border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      value={patientData.sexo}
                      onChange={(e) => setPatientData({...patientData, sexo: e.target.value})}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                    </select>
                  </div>
                </div>

                {/* Toggles estilo investigación */}
                <div className="space-y-3 pt-2">
                  {[
                    { label: "Patología Vascular Periférica", key: 'vascular' },
                    { label: "Insuficiencia Cardiaca", key: 'cardiaca' },
                    { label: "Diabetes Mellitus", key: 'diabetico' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                      <div className="flex bg-slate-100 rounded p-1">
                        {['No', 'Si'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setPatientData({...patientData, [item.key]: opt})}
                            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                              (patientData as any)[item.key] === opt 
                                ? (opt === 'Si' ? 'bg-red-100 text-red-700 shadow-sm' : 'bg-white text-slate-800 shadow-sm')
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button 
            onClick={analyze}
            disabled={loading || !file}
            className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Procesando Algoritmo...
              </>
            ) : (
              <>
                EJECUTAR ANÁLISIS <ChevronRight size={20} />
              </>
            )}
          </button>

          {/* ZONA DE MENSAJES DE ERROR */}
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error de Ejecución: {error}</span>
            </div>
          )}

          {/* RESULTADOS */}
          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="text-blue-600" /> Resultados del Análisis
                </h2>
                
                {/* Estado Sheet */}
                <div className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-mono ${result.sheetStatus?.includes('OK') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {result.sheetStatus?.includes('OK') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  BASE DE DATOS: {result.sheetStatus === 'Guardado OK' ? 'REGISTRO COMPLETADO' : 'ERROR REGISTRO'}
                </div>
              </div>

              {/* Grid de Datos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {Object.entries(result).map(([key, value]) => {
                  if(key === 'sheetStatus' || key === 'error' || key === 'recomendaciones_cuidados') return null;
                  return (
                    <div key={key} className="bg-white p-5 hover:bg-slate-50 transition-colors">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-medium text-slate-800 text-sm md:text-base">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* CUADRO DE CUIDADOS - DISEÑO ACADÉMICO */}
              {result.recomendaciones_cuidados && (
                <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-6">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-blue-200 pb-2">
                    <Stethoscope className="w-4 h-4" /> 
                    Recomendaciones Clínicas Sugeridas (IA)
                  </h3>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed text-sm font-medium font-serif">
                    {result.recomendaciones_cuidados}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 text-right">
                    Nota: Los resultados generados son probabilísticos y requieren validación por parte del equipo investigador.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
     <div className="text-center mt-8 text-slate-400 text-xs font-mono">
        <p>Proyecto de Investigación Científica v1.0 • Generative AI for Wound Care • © Alberto González</p>
      </div>
    </main>
  );
}
