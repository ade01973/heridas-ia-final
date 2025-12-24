import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from '@google/generative-ai'; // <--- IMPORTANTE: Importamos las categorías de seguridad
import { google } from 'googleapis';

// --- CONFIGURACIÓN DE MENÚS EXACTOS + CUIDADOS ---
const SYSTEM_PROMPT_BASE = `
Actúa como enfermera experta en heridas. Analiza la imagen y devuelve un JSON.
Debes elegir la opción que mejor encaje de las listas EXACTAS para los campos de selección.

IMPORTANTE:
Se te proporcionará contexto del paciente (Edad, Diabetes, etc.). USA ESE CONTEXTO para personalizar el campo "recomendaciones_cuidados".
Por ejemplo, si es diabético, enfócate en control glucémico y descargas. Si tiene patología vascular, adapta el vendaje, etc.

Listas EXACTAS:
- etiologia_probable: [
    "Lesión por presión (LPP)", 
    "Úlcera venosa (de extremidad inferior)", 
    "Úlcera arterial / isquémica", 
    "Úlcera de pie diabético (Neuropática/Neuroisquémica)", 
    "Herida quirúrgica (Dehiscencia o cierre por segunda intención)", 
    "Otro"
  ]
- tejido_predominante: [
    "Tejido necrótico", 
    "Tejido esfacelado", 
    "Tejido de granulación", 
    "Tejido de epitelización", 
    "Mezcla de tejidos (>50% sin predominio claro)"
  ]
- nivel_exudado: [
    "Seco / No visible", 
    "Húmedo óptimo", 
    "Mojado / saturado", 
    "Macerante"
  ]
- piel_perilesional: [
    "Sana / Intacta (Color y textura similar a la piel circundante normal)", 
    "Macerada (Color blanquecino, aspecto húmedo y frágil por exceso de exudado)", 
    "Eritematosa / Inflamada (Roja, con apariencia caliente o edematosa)", 
    "Hiperqueratósica / Callosa (Bordes engrosados, duros y secos)"
  ]
- signos_infeccion: [
    "No se observan signos de infección", 
    "Inflamación leve (eritema local)", 
    "Sospecha de infección local", 
    "Signos claros de infección local"
  ]
- aposito_primario: [
    "Ninguno (No aplicar pósito / Dejar al aire)", 
    "Hidrogel (Gel o placa)", 
    "Hidrocoloide", 
    "Espuma de poliuretano (Foam)", 
    "Alginato cálcico o Fibra gelificante (Hidrofibra)", 
    "Apósito con Plata u otro antimicrobiano (Yodo, DACC, Miel)", 
    "Malla de silicona o Tul graso (Interface neutra)"
  ]
- objetivo_aposito: [
    "Desbridar / Hidratar (Aportar humedad para ablandar necrosis seca; ej. Hidrogel)",
    "Gestionar exudado / Absorción (Controlar exceso de líquido; ej. Alginatos, Fibras, Espumas)",
    "Controlar carga bacteriana (Sospecha de infección local o biofilm; ej. Plata, DACC, Yodo)",
    "Proteger granulación / Epitelización (Mantener ambiente húmedo óptimo y evitar traumatismos)"
  ]

El campo "recomendaciones_cuidados" debe ser un texto breve (string) con saltos de línea o guiones.
Responde SOLO con el JSON válido.
`;

export async function POST(request: Request) {
  try {
    const { image, modelId, identificationCode, patientData } = await request.json();
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    if (!image) return NextResponse.json({ error: 'Falta imagen' }, { status: 400 });

    const patientContext = `
      CONTEXTO DEL PACIENTE:
      - Edad: ${patientData?.edad || 'No especificada'}
      - Sexo: ${patientData?.sexo || 'No especificado'}
      - Patología Vascular: ${patientData?.vascular || 'No'}
      - Patología Cardiaca: ${patientData?.cardiaca || 'No'}
      - Diabético: ${patientData?.diabetico || 'No'}
    `;

    const FINAL_PROMPT = SYSTEM_PROMPT_BASE + "\n" + patientContext;

    let result = null;

    // 1. ANÁLISIS IA
    try {
      if (modelId === 'gemini') {
        // --- CONFIGURACIÓN DE SEGURIDAD AÑADIDA ---
        // Esto desactiva los filtros para permitir ver heridas
        const safetySettings = [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ];

        // Usamos gemini-1.5-flash o gemini-1.5-pro (2.5 aun no es estable publicamente)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            safetySettings: safetySettings // <--- Aquí aplicamos los filtros
        });

        const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
        const response = await model.generateContent([
          FINAL_PROMPT,
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]);
        
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);

      } else {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: FINAL_PROMPT },
            { role: "user", content: [{ type: "image_url", image_url: { url: image } }] },
          ],
          response_format: { type: "json_object" },
        });
        result = JSON.parse(response.choices[0].message.content || '{}');
      }
    } catch (aiError: any) {
      console.error("Error IA:", aiError);
      // Mensaje más claro si bloquea
      if (aiError.message && aiError.message.includes("SAFETY")) {
         return NextResponse.json({ error: `La IA bloqueó la imagen por seguridad. Intenta recortar el fondo.` }, { status: 500 });
      }
      return NextResponse.json({ error: `Error en la IA: ${aiError.message}` }, { status: 500 });
    }

    // 2. GUARDAR EN SHEET
    let sheetStatus = 'No configurado';
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        const row = [
          new Date().toLocaleString(),          
          identificationCode,                   
          result.etiologia_probable,            
          result.tejido_predominante,           
          result.nivel_exudado,                 
          result.signos_infeccion,              
          result.piel_perilesional,             
          result.objetivo_aposito,              
          result.aposito_primario,              
          "Inteligencia Artificial",            
          modelId === 'chatgpt' ? 'ChatGPT' : 'Gemini', 
          "Prompt v1.0"                         
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Respuestas_IA!A:L',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [row] },
        });
        sheetStatus = 'Guardado OK';
      } catch (e: any) {
        console.error("Error Sheet:", e);
        sheetStatus = `Fallo Excel: ${e.message}`; 
      }
    }

    return NextResponse.json({ ...result, sheetStatus });

  } catch (error: any) {
    console.error("Error General:", error);
    return NextResponse.json({ error: `Error Interno: ${error.message}` }, { status: 500 });
  }
}
