import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';

// --- CONFIGURACIÓN ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- PROMPT MAESTRO ---
const SYSTEM_PROMPT = `
Actúa como enfermera experta en heridas. Analiza la imagen y devuelve un JSON.
Usa EXACTAMENTE estas opciones:
- etiologia_probable: ["Lesión por presión (LPP)", "Úlcera venosa", "Úlcera arterial", "Úlcera de pie diabético", "Herida quirúrgica", "Otro"]
- tejido_predominante: ["Tejido necrótico", "Tejido esfacelado", "Tejido de granulación", "Tejido de epitelización", "Mezcla de tejidos"]
- nivel_exudado: ["Seco / No visible", "Húmedo óptimo", "Mojado / saturado", "Fuga de exudado"]
- piel_perilesional: ["Sana / Intacta", "Macerada", "Eritematosa / Inflamada", "Hiperqueratósica / Callosa"]
- signos_infeccion: ["No se observan signos", "Inflamación leve", "Sospecha de infección", "Signos claros de infección"]
- aposito_primario: ["Ninguno", "Hidrogel", "Hidrocoloide", "Espuma (Foam)", "Alginato", "Plata", "Silicona"]
- objetivo_aposito: ["Desbridar", "Gestionar exudado", "Controlar infección", "Proteger"]

Responde SOLO con el JSON válido.
`;

export async function POST(request: Request) {
  try {
    const { image, modelId, identificationCode } = await request.json();
    if (!image) return NextResponse.json({ error: 'Falta imagen' }, { status: 400 });

    let result = null;

    // 1. ANÁLISIS IA
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

    // 2. GUARDAR EN SHEET
    let sheetStatus = 'No guardado (Faltan credenciales)';
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_CLIENT_EMAIL) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Ajusta el orden del array según tus columnas del Excel
        const row = [
          identificationCode,
          new Date().toLocaleString(),
          modelId,
          result.etiologia_probable,
          result.tejido_predominante,
          result.nivel_exudado,
          result.piel_perilesional,
          result.signos_infeccion,
          result.aposito_primario,
          result.objetivo_aposito
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'Hoja 1!A:J', 
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [row] },
        });
        sheetStatus = 'Guardado OK';
      } catch (e) {
        console.error(e);
        sheetStatus = 'Error al guardar';
      }
    }

    return NextResponse.json({ ...result, sheetStatus });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
