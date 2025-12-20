'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, Activity, AlertCircle, HeartPulse, User, CheckCircle2, ChevronRight, Stethoscope, Microscope, ShieldCheck, Zap, Database } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null); 
  const [model, setModel] = useState('gemini'); 
  const [idCode, setIdCode] = useState('');

  // Referencia para el scroll automático
  const toolSectionRef = useRef<HTMLDivElement>(null);

  const scrollToTool = () => {
    toolSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- SECCIÓN HERO (PORTADA) --- */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        {/* Fondo decorativo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-3/5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
              <Microscope size={14} /> Tecnología Asistencial v2.0
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              El Futuro del <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                Cuidado de Heridas
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
              Plataforma de investigación clínica que utiliza Inteligencia Artificial Generativa para asistir en la valoración, tipificación y sugerencia de cuidados en lesiones cutáneas.
            </p>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={scrollToTool}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2"
              >
                Iniciar Análisis <ChevronRight size={20} />
              </button>
              <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all border border-slate-700">
                Ver Documentación
              </button>
            </div>
          </div>
          
          {/* Ilustración abstracta derecha */}
          <div className="md:w-2/5 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Activity className="w-12 h-12 text-blue-400 mb-4" />
              <div className="space-y-3">
                <div className="h-2 w-32 bg-slate-600 rounded opacity-50"></div>
                <div className="h-2 w-48 bg-slate-600 rounded opacity-30"></div>
                <div className="h-2 w-40 bg-slate-600 rounded opacity-30"></div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-green-400" />
                </div>
                <span className="text-sm font-mono text-green-300">Análisis Completado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE CARACTERÍSTICAS (BENEFICIOS) --- */}
      <div className="bg-slate-50 py-16 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Análisis Instantáneo", text: "Procesamiento de imágenes en tiempo real mediante modelos Gemini 1.5 Flash y GPT-4o." },
            { icon: Database, title: "Registro Automatizado", text: "Sincronización directa con Google Sheets para mantener una base de datos estructurada." },
            { icon: ShieldCheck, title: "Soporte Clínico", text: "Sugerencias de tratamiento basadas en guías clínicas y adaptadas a las comorbilidades." }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- HERRAMIENTA PRINCIPAL (LO QUE YA TENÍAS) --- */}
      <div ref={toolSectionRef} className="py-20 px-4 bg-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
              <Stethoscope className="text-blue-600" /> Área de Trabajo
            </h2>
            <p className="text-slate-500 mt-2">Carga la imagen de la lesión para comenzar el procesamiento.</p>
          </div>

          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header de la herramienta */}
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Panel de Control</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-10">
              
              {/* DATOS DEL ESTUDIO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID de Sujeto / Paciente</label>
                  <input 
                    type="text" 
                    placeholder="Ej: SUJETO-A001"
                    className="w-full p-3 pl-4 bg-slate-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 outline-none uppercase font-mono text-slate-700"
                    value={idCode}
                    onChange={(e) => setIdCode(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo de Procesamiento</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-md border border-slate-200">
                    <button 
                      onClick={() => setModel('chatgpt')}
                      className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-all ${model === 'chatgpt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      ChatGPT
                    </button>
                    <button 
                      onClick={() => setModel('gemini')}
                      className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-all ${model === 'gemini' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      Gemini
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* ZONA DE CARGA Y DATOS */}
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-5/12">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Evidencia Fotográfica</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative h-72 flex flex-col items-center justify-center text-center group">
                    <input type="file" onChange={handleFile} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {file ? (
                      <img src={file} alt="Preview" className="w-full h-full object-contain p-2 rounded-lg" />
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:shadow-md transition-all">
                          <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-slate-700 font-medium">Cargar imagen</p>
                        <p className="text-slate-400 text-xs mt-2">JPG, PNG</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-7/12 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                    <User className="text-blue-600" size={20}/> Variables Clínicas
                  </h3>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="w-1/2">
                         <label className="text-xs text-slate-500 font-bold mb-1 block">Edad</label>
                         <input type="number" className="w-full p-2.5 text-sm border border-slate-300 rounded" value={patientData.edad} onChange={(e) => setPatientData({...patientData, edad: e.target.value})} />
                      </div>
                      <div className="w-1/2">
                        <label className="text-xs text-slate-500 font-bold mb-1 block">Sexo</label>
                        <select className="w-full p-2.5 text-sm border border-slate-300 rounded bg-white" value={patientData.sexo} onChange={(e) => setPatientData({...patientData, sexo: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          <option value="Hombre">Hombre</option>
                          <option value="Mujer">Mujer</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      {[
                        { label: "Patología Vascular", key: 'vascular' },
                        { label: "Insuficiencia Cardiaca", key: 'cardiaca' },
                        { label: "Diabetes Mellitus", key: 'diabetico' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                          <div className="flex bg-slate-100 rounded p-1">
                            {['No', 'Si'].map((opt) => (
                              <button key={opt} onClick={() => setPatientData({...patientData, [item.key]: opt})} className={`px-3 py-1 text-xs font-bold rounded transition-all ${(patientData as any)[item.key] === opt ? (opt === 'Si' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-400'}`}>{opt}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={analyze}
                disabled={loading || !file}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                {loading ? (
                  <> <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Procesando... </>
                ) : (
                  <> EJECUTAR ANÁLISIS <ChevronRight size={20} /> </>
                )}
              </button>

              {/* RESULTADOS */}
              {error && (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-red-700 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> <span className="font-medium">Error: {error}</span>
                </div>
              )}

              {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="text-blue-600" /> Resultados
                    </h2>
                    <div className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-2 font-mono ${result.sheetStatus?.includes('OK') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {result.sheetStatus?.includes('OK') ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      BD: {result.sheetStatus === 'Guardado OK' ? 'REGISTRO OK' : 'ERROR'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                    {Object.entries(result).map(([key, value]) => {
                      if(key === 'sheetStatus' || key === 'error' || key === 'recomendaciones_cuidados') return null;
                      return (
                        <div key={key} className="bg-white p-5 hover:bg-slate-50 transition-colors">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                          <p className="font-medium text-slate-800 text-sm md:text-base">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                        </div>
                      )
                    })}
                  </div>

                  {result.recomendaciones_cuidados && (
                    <div className="mt-6 bg-blue-50/50 border border-blue-100 rounded-lg p-6">
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-blue-200 pb-2">
                        <Stethoscope className="w-4 h-4" /> Recomendaciones Clínicas (IA)
                      </h3>
                      <div className="text-slate-700 whitespace-pre-line leading-relaxed text-sm font-medium font-serif">
                        {result.recomendaciones_cuidados}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-4 text-right">Generado por IA. Requiere validación clínica.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-center py-8 text-slate-500 text-xs font-mono border-t border-slate-800">
        <p>Proyecto de Investigación Científica v2.0 • Generative AI for Wound Care • © Alberto González</p>
      </div>
    </main>
  );
}
