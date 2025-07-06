import config from "../../config";
import { PaymentPlan, User } from "../db/types";
import { OpenAI } from "openai";
import axios from 'axios';
import { ServicesFireBase } from "../db/ServicesFireBase";
import { Timestamp as FirebaseTimestamp, FieldValue } from 'firebase/firestore';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Convierte URL de imagen a base64 con autenticación Meta (función helper mejorada)
 */
async function getImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`🔄 Descargando imagen desde: ${imageUrl}`);
    
    // 🔑 Agregar autenticación Meta para URLs de WhatsApp Business
    const headers: any = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    // Si es URL de Facebook/WhatsApp, agregar token de autorización
    if (imageUrl.includes('lookaside.fbsbx.com') || imageUrl.includes('whatsapp_business')) {
      headers['Authorization'] = `Bearer ${config.META_JWT_TOKEN}`;
      console.log(`🔑 Usando autenticación Meta para WhatsApp Business`);
    }
    
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000, // 30 segundos timeout
      headers
    });
    
    console.log(`✅ Imagen descargada - Tamaño: ${response.data.byteLength} bytes`);
    
    const base64 = Buffer.from(response.data).toString('base64');
    console.log(`✅ Conversión a base64 completada - Longitud: ${base64.length} caracteres`);
    
    return base64;
  } catch (error) {
    console.error(`❌ Error al descargar/convertir imagen:`, error);
    
    // 🔍 Mensaje de error más específico para problemas de autenticación
    if (error.response?.status === 401) {
      throw new Error(`Error de autenticación: Verifica que META_JWT_TOKEN esté configurado correctamente`);
    }
    
    throw new Error(`No se pudo procesar la imagen: ${error.message}`);
  }
}

/**
 * Valida imagen Yape - VERSIÓN MEJORADA
 */
export async function validateYapeImage(imageUrl: string, expectedAmount: number): Promise<YapeValidationResult> {
  try {
    console.log(`🔍 Iniciando validación de Yape - URL: ${imageUrl}, Monto esperado: ${expectedAmount}`);
    
    // 1. Convertir imagen a base64
    const imageBase64 = await getImageAsBase64(imageUrl);
    console.log(`✅ Imagen convertida a base64 exitosamente`);
    
    // 2. Analizar con OpenAI con prompt mejorado
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un experto analizando comprobantes de pago de Yape. Extrae EXACTAMENTE el nombre del destinatario y el monto. Responde SOLO en formato JSON válido."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analiza este comprobante de Yape y extrae:
1. El nombre COMPLETO del destinatario (la persona que RECIBE el dinero)
2. El monto EXACTO transferido (solo el número, sin símbolos)

Busca el texto que dice "S/" seguido del monto.
Busca el nombre que aparece como destinatario del pago.

Responde ÚNICAMENTE en este formato JSON: {"nombre":"Nombre Completo Aquí", "monto":123}

IMPORTANTE: 
- NO incluyas símbolos en el monto
- Busca el nombre del DESTINATARIO (quien recibe), NO del remitente
- Si ves "Francesco Lucchesi" ese es el destinatario correcto`
            },
            {
              type: "image_url",
              image_url: { 
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    });

    // 3. Extraer y procesar datos
    const content = response.choices[0]?.message?.content || "";
    console.log(`🤖 Respuesta de OpenAI: ${content}`);
    
    // Buscar JSON en la respuesta
    const jsonMatch = content.match(/\{[^}]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No se encontró JSON válido en la respuesta: ${content}`);
      throw new Error("OpenAI no devolvió un JSON válido");
    }
    
    const data = JSON.parse(jsonMatch[0]);
    console.log(`📊 Datos extraídos:`, data);
    
    // 4. Validar datos extraídos
    const nombre = (data.nombre || "").toLowerCase().trim();
    const monto = Number(data.monto);
    
    console.log(`🔍 Validando - Nombre: "${nombre}", Monto: ${monto}`);
    
    // Validación más flexible para el nombre
    const nameVariations = [
      "francesco lucchesi",
      "francesco",
      "lucchesi",
      "francesco l",
      "f lucchesi"
    ];
    
    const recipientNameMatch = nameVariations.some(variation => 
      nombre.includes(variation.toLowerCase())
    );
    
    const amountMatch = monto === expectedAmount;
    const isValid = recipientNameMatch && amountMatch;
    
    console.log(`✅ Resultado validación:`);
    console.log(`   📝 Nombre detectado: "${data.nombre}"`);
    console.log(`   💰 Monto detectado: ${monto}`);
    console.log(`   ✓ Nombre válido: ${recipientNameMatch}`);
    console.log(`   ✓ Monto válido: ${amountMatch}`);
    console.log(`   🎯 Resultado final: ${isValid}`);
    
    return {
      isValid,
      detectedAmount: monto,
      detectedRecipient: data.nombre || "No detectado",
      detectedStatus: isValid ? "valid" : "invalid",
      confidence: isValid ? 0.99 : 0.5,
      errorMessage: !isValid ? 
        `${!recipientNameMatch ? 'Nombre del destinatario no coincide. ' : ''}${!amountMatch ? `Monto no coincide (detectado: ${monto}, esperado: ${expectedAmount}). ` : ''}`.trim() 
        : undefined
    };
    
  } catch (e) {
    console.error("❌ Error completo en validateYapeImage:", e);
    return {
      isValid: false,
      detectedAmount: 0,
      detectedRecipient: "Error al procesar",
      detectedStatus: "error",
      confidence: 0,
      errorMessage: `Error técnico: ${e.message || "No se pudo procesar la imagen"}`
    };
  }
}

/**
 * Acredita créditos al usuario tras recarga validada
 */
export async function creditUser(userId: string, credits: number, db: ServicesFireBase) {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("Usuario no encontrado");

  const updatedCredits = (user.credits || 0) + credits;

  await db.updateUser(userId, {
    credits: updatedCredits,
    updatedAt: FirebaseTimestamp.now(),
  });
}

// Ajustar la función consumeCredit para trabajar con credits como número
export async function consumeCredit(userId: string, db: ServicesFireBase): Promise<boolean> {
  const user = await db.getUserById(userId);
  if (!user) throw new Error("Usuario no encontrado");

  if ((user.credits || 0) <= 0) return false;

  const updatedCredits = (user.credits || 0) - 1;

  await db.updateUser(userId, {
    credits: updatedCredits,
    updatedAt: FirebaseTimestamp.now(),
  });

  return true;
}

// Definición de YapeValidationResult
interface YapeValidationResult {
  isValid: boolean;
  detectedAmount: number;
  detectedRecipient: string;
  detectedStatus: "valid" | "invalid" | "error";
  confidence: number;
  errorMessage?: string;
}

// Configuración de YAPE_CONFIG
const YAPE_CONFIG = {
  recipientName: config.YAPE_RECIPIENT_NAME,
};

// Definición de PAYMENT_PLANS
const PAYMENT_PLANS: PaymentPlan[] = [
  { id: "single", name: "Básico", credits: 1, price: 4, description: "1 crédito por 4 soles" },
  { id: "triple", name: "Estándar", credits: 3, price: 7, description: "3 créditos por 7 soles" },
  { id: "six", name: "Premium", credits: 6, price: 10, description: "6 créditos por 10 soles" },
];