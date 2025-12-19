import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';

// --- CONFIGURACIÓN DE LOS MENÚS EXACTOS DEL EXCEL ---
// Es vital que esto coincida letra por letra con tus desplegables
const SYSTEM_PROMPT = `
Actúa como enfermera experta en heridas. Analiza la imagen y devuelve un JSON.
Debes elegir la opción que mejor encaje de las siguientes listas EXACTAS:

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
    "Fuga de exudado"
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

Responde SOLO con el JSON válido.
`;

export async function POST(request: Request) {
  try {
    const { image, modelId, identificationCode } = await request.json();
    
    // Inicializar clientes IA
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    if (!image) return NextResponse.json({ error: 'Falta imagen' }, { status: 400 });

    let result = null;

    // 1. ANÁLISIS IA
    try {
      if (modelId === 'gemini') {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");
        const response = await model.generateContent([
          SYSTEM_PROMPT,
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]);
        const text = response.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        result = JSON.parse(text);
      } else {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: [{ type: "image_url", image_url: { url: image } }] },
          ],
          response_format: { type: "json_object" },
        });
        result = JSON.parse(response.choices[0].message.content || '{}');
      }
    } catch (aiError: any) {
      console.error("Error IA:", aiError);
      return NextResponse.json({ error: `Error en la IA: ${aiError.message}` }, { status: 500 });
    }

    // 2. GUARDAR EN SHEET (Protegido para que no cuelgue la app)
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
        
        // ORDEN DE COLUMNAS (Asegúrate que tu Excel sigue este orden):
        // A: ID, B: Fecha, C: Modelo IA, D: Etiología, E: Tejido, F: Exudado, G: Piel, H: Infección, I: Apósito, J: Objetivo, K: Fuente, L: Prompt
        const row = [
          identificationCode,                 // Columna A
          new Date().toLocaleString(),        // Columna B
          modelId === 'chatgpt' ? 'ChatGPT' : 'Gemini', // Columna C (Ajustado a tu menú)
          result.etiologia_probable,          // Columna D
          result.tejido_predominante,         // Columna E
          result.nivel_exudado,               // Columna F
          result.piel_perilesional,           // Columna G
          result.signos_infeccion,            // Columna H
          result.aposito_primario,            // Columna I
          result.objetivo_aposito,            // Columna J
          "Inteligencia Artificial",          // Columna K (Fuente)
          "Prompt v1.0"                       // Columna L (Versión Prompt)
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Hoja 1!A:L', // Abarca hasta la columna L
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
        sheetStatus = 'Guardado OK';
      } catch (e: any) {
        console.error("Error Sheet:", e);
        // Si falla el Excel, guardamos el mensaje pero devolvemos el resultado de la IA
        sheetStatus = `Fallo Excel: ${e.message}`; 
      }
    }

    return NextResponse.json({ ...result, sheetStatus });

  } catch (error: any) {
    console.error("Error General:", error);
    return NextResponse.json({ error: `Error Interno: ${error.message}` }, { status: 500 });
  }
}
