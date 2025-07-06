import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import config from "../../config";
import OpenAI from "openai";
import path from "path";
import { createWriteStream, createReadStream } from "fs";
import * as fs from "fs";
import * as fsPromises from "fs/promises";
import { Client } from 'basic-ftp'; 
import fsExtra from 'fs-extra'; 


// Interfaces para tipado
interface InterviewQuestion {
  question: string;
  type: string;
  originalType: string;
  timestamp: Date;
}

interface InterviewAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface CvAnalysisResult {
  [key: string]: any; // Permite flexibilidad para la respuesta de la API externa
}

export class ServicesWorki {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private UrlJobs: string;
  private openai: OpenAI | null = null;

  constructor(baseUrl: string, UrlJobs: string) {
    this.baseUrl = baseUrl;
    this.UrlJobs = UrlJobs;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 180000, // 3 minutos de timeout
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Inicializar OpenAI si la API key está disponible
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    if (config.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
      console.log("OpenAI inicializado correctamente");
    } else {
      console.warn("OPENAI_API_KEY no encontrada en la configuración");
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = "GET",
    data?: any,
    config?: AxiosRequestConfig,
    UrlJobs?: boolean
  ): Promise<T> {
    const requestConfig = { ...config };

    if (UrlJobs) {
      requestConfig.baseURL = this.UrlJobs;
    }

    const response = await this.axiosInstance({
      url: endpoint,
      method,
      data,
      ...requestConfig,
    });

    return response.data;
  }

  async analyzeCv(
    pdfUrl: string,
    puestoPostular: string,
    originalName?: string
  ): Promise<CvAnalysisResult> {
    try {
      const formattedPuesto = puestoPostular.replace(/\s+/g, "_");
      const endpoint = `/analizar-cv/?pdf_url=${pdfUrl}&puesto_postular=${formattedPuesto}&original_name=${originalName}`;

      console.log("Iniciando análisis de CV...");
      console.log("Endpoint:", endpoint);

      const result = await this.makeRequest<CvAnalysisResult>(
        endpoint,
        "GET",
        null,
        {},
        false
      );
      console.log("Análisis completado exitosamente");
      return result;
    } catch (error: any) {
      console.error("Error al analizar CV:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "El análisis del CV tardó demasiado tiempo. La API externa no respondió en 3 minutos."
        );
      }
      if (error.response?.status === 404) {
        throw new Error(
          "No se pudo descargar el archivo PDF desde la URL proporcionada"
        );
      }
      if (error.response?.status >= 500) {
        throw new Error("Error del servidor al procesar el CV");
      }
      throw new Error(`Error al analizar CV: ${error.message}`);
    }
  }

  /**
   * Enhanced CV analysis with additional parameters
   * @param {string} pdfUrl - URL of the PDF to analyze
   * @param {string} puesto - Job position for analysis
   * @param {string} numero - Phone number or identifier
   * @returns {Promise<CvAnalysisResult>} Analysis results
   */
  async analyzeCvEnhanced(
    pdfUrl: string,
    puesto: string,
    numero: string
  ): Promise<CvAnalysisResult> {
    try {
      // Use the new API endpoint structure
      const formattedPuesto = puesto.replace(/\s+/g, "_");

      const endpoint = `/analizar_cv/?pdf_url=${pdfUrl}&puesto=${formattedPuesto}&numero=${numero}`;
      const result = await this.makeRequest<CvAnalysisResult>(
        endpoint,
        "GET",
        null,
        {},
        true
      );
      return result;
    } catch (error: any) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "El análisis del CV tardó demasiado tiempo. La API externa no respondió en 3 minutos."
        );
      }
      if (error.response?.status === 404) {
        throw new Error(
          "No se pudo descargar el archivo PDF desde la URL proporcionada"
        );
      }
      if (error.response?.status >= 500) {
        throw new Error("Error del servidor al procesar el CV");
      }
      throw new Error(`Error al analizar CV mejorado: ${error.message}`);
    }
  }

  

  // Método para análisis asíncrono sin bloquear
  analyzeCvAsync(
    pdfUrl: string,
    puestoPostular: string
  ): Promise<CvAnalysisResult> {
    return new Promise((resolve, reject) => {
      // Ejecutar el análisis en background
      this.analyzeCv(pdfUrl, puestoPostular, undefined)
        .then((result) => {
          console.log("Análisis asíncrono completado");
          resolve(result);
        })
        .catch((error) => {
          console.log("Análisis asíncrono falló:", error.message);
          reject(error);
        });
    });
  }

  async saveMedia(
    mediaUrl: string,
    mediaName: string,
    audio?: boolean
  ): Promise<string> {
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${config.META_JWT_TOKEN}`,
      },
    });
    const mediaData = response.data;

    let cvsDir = "";
    // Ensure cvs directory exists
    if (audio) {
      cvsDir = path.join(process.cwd(), "audios");
      if (!fs.existsSync(cvsDir)) {
        fs.mkdirSync(cvsDir, { recursive: true });
      }
    } else {
      cvsDir = path.join(process.cwd(), "cvs");
      if (!fs.existsSync(cvsDir)) {
        fs.mkdirSync(cvsDir, { recursive: true });
      }
    }

    const mediaPath = path.join(cvsDir, mediaName);
    fs.writeFileSync(mediaPath, mediaData);
    return mediaPath;
  }

  /**
   * Generate an interview question based on job type using OpenAI
   * @param {string} jobType - Normalized type of job (e.g., 'software', 'marketing', 'sales')
   * @param {string} originalJobType - Original job description from the user (can be more specific)
   * @returns {Promise<Object>} Generated interview question and metadata
   */
  async generateInterviewQuestion(
    jobType: string,
    originalJobType: string = ""
  ): Promise<InterviewQuestion> {
    if (!this.openai) {
      console.error(
        "OpenAI no está inicializado. Usa initializeOpenAI primero."
      );
      throw new Error("OpenAI no está inicializado");
    }

    try {
      // Usar ambos tipos de trabajo para generar una pregunta más relevante
      const jobContext =
        originalJobType && originalJobType !== jobType
          ? `"${originalJobType}" (categorizado como ${jobType})`
          : `"${jobType}"`;

      // Prompt específico para Tech Lead si el puesto lo indica
      let specificPrompt = "";
      if (
        jobType.toLowerCase().includes("tech") &&
        jobType.toLowerCase().includes("lead")
      ) {
        specificPrompt = `
Para un puesto de Tech Lead, enfócate especialmente en preguntas que evalúen:
1. Capacidad para organizar y priorizar tareas técnicas
2. Habilidades para colaborar y comunicarse con diferentes equipos
3. Conocimiento general sobre buenas prácticas de desarrollo
4. Enfoque en la calidad y mejora continua
5. Equilibrio entre aspectos técnicos y objetivos del proyecto
6. Capacidad para aprender y adaptarse a nuevas tecnologías

Recuerda que el candidato podría estar buscando su primera posición como Tech Lead o no tener experiencia previa en ese rol específico, así que enfócate en habilidades transferibles y potencial de liderazgo.
`;
      }

      const prompt = `Genera una pregunta de entrevista profesional pero apropiada para un practicante o recién graduado que aspira a un puesto de ${jobContext}.

La pregunta debe:
1. Tener un nivel INTERMEDIO - ni demasiado básica ni extremadamente técnica
2. Ser adecuada para practicantes o personas buscando su primer trabajo
3. Mostrar un nivel profesional pero sin asumir años de experiencia previa
4. Evaluar conocimientos, habilidades o competencias relevantes para el puesto
5. Permitir que el candidato responda basándose en experiencias académicas, proyectos personales o conocimientos teóricos
6. Ser específica para el tipo de puesto pero sin jerga técnica avanzada

REQUISITOS IMPORTANTES:
- NO asumir experiencia laboral específica en la industria mencionada
- EQUILIBRAR formulaciones hipotéticas ("¿Cómo abordarías...?") con preguntas sobre conocimientos ("¿Qué sabes sobre...?")
- Usar un lenguaje profesional pero accesible para recién graduados
- Ser desafiante pero justa para alguien con conocimientos teóricos del área

Ejemplos de preguntas de nivel adecuado:
- "¿Qué estrategias de marketing digital consideras más efectivas para captar la atención de la Generación Z y por qué?"
- "Si tuvieras que implementar un proceso para mejorar la colaboración entre equipos de desarrollo, ¿qué aspectos considerarías prioritarios?"
- "¿Qué herramientas de análisis de datos conoces y cómo las aplicarías para evaluar el rendimiento de una campaña digital?"

${specificPrompt}

Proporciona solo la pregunta, sin introducción ni texto adicional.`;

      // Intentar usar GPT-4o para mejor calidad, con fallback a GPT-3.5 Turbo
      let model = config.OPENAI_MODEL || "gpt-4o";
      try {
        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "Eres un entrevistador profesional especializado en entrevistas para practicantes y recién graduados. Tu objetivo es crear preguntas de NIVEL INTERMEDIO que evalúen conocimientos y potencial sin asumir experiencia laboral extensa. Equilibras el tono profesional con accesibilidad para personas que buscan su primer trabajo o tienen experiencia limitada.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

        return {
          question: response.choices[0].message.content?.trim(),
          type: jobType,
          originalType: originalJobType || jobType,
          timestamp: new Date(),
        };
      } catch (error: any) {
        // Si falla con GPT-4o, intentar con GPT-3.5 Turbo
        console.warn(
          `Error using ${model}, falling back to gpt-3.5-turbo: ${error.message}`
        );
        model = "gpt-3.5-turbo";

        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "Eres un entrevistador profesional especializado en entrevistas para practicantes y recién graduados. Tu objetivo es crear preguntas de NIVEL INTERMEDIO que evalúen conocimientos y potencial sin asumir experiencia laboral extensa. Equilibras el tono profesional con accesibilidad para personas que buscan su primer trabajo o tienen experiencia limitada.",
            },
            { role: "user", content: prompt },
          ],
          // Display processing message: type ProcessingMessage = { body: string }
          max_tokens: 150,
        });

        return {
          question: response.choices[0].message.content?.trim(),
          type: jobType,
          originalType: originalJobType || jobType,
          timestamp: new Date(),
        };
      }
    } catch (error: any) {
      console.error(
        `Error al generar pregunta de entrevista con OpenAI: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Analyze interview response using OpenAI
   * @param {string} ResponseUser - The transcribed interview response
   * @param {string} question - The interview question that was asked
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeInterviewResponse(
    ResponseUser: string,
    question: string
  ): Promise<InterviewAnalysis | null> {
    if (!this.openai) {
      console.error(
        "OpenAI no está inicializado. Usa initializeOpenAI primero."
      );
      return null;
    }

    try {
      const systemPrompt = `Eres un entrenador experto de entrevistas de trabajo con amplia experiencia en recursos humanos.
Tu tarea es analizar respuestas a preguntas de entrevista y proporcionar retroalimentación constructiva y útil.
Responde siempre en el lenguaje de la respuesta.`;

      const userPrompt = `
Pregunta de entrevista: "${question}"

Respuesta del candidato:
"""
${ResponseUser}
"""

Analiza la respuesta del candidato y proporciona:
1. Una calificación general del 1-10
2. Un resumen conciso de la respuesta (máximo 2 oraciones)
3. Fortalezas de la respuesta (3 puntos)
4. Áreas de mejora (3 puntos)
5. Sugerencias específicas para mejorar (3-4 consejos prácticos)

Devuelve tu análisis en formato JSON con las siguientes claves:
{
  "score": número,
  "summary": "texto",
  "strengths": ["punto1", "punto2", "punto3"],
  "weaknesses": ["punto1", "punto2", "punto3"],
  "suggestions": ["sugerencia1", "sugerencia2", "sugerencia3", "sugerencia4"]
}
`;

      console.log(`Analizando respuesta de entrevista con OpenAI...`);

      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      console.log(`Análisis de entrevista completado exitosamente`);

      return analysis;
    } catch (error: any) {
      console.error(
        `Error al analizar respuesta de entrevista: ${error.message}`
      );
      return null;
    }
  }

  async transcribeAudio(audioUrl: string): Promise<string | null> {
    if (!this.openai) {
      console.error(
        "OpenAI no está inicializado. Usa initializeOpenAI primero."
      );
      return null;
    }
    try {
      const tmpDir = `${process.cwd()}/tmp`;
      await fsPromises.mkdir(tmpDir, { recursive: true });

      const pathTmpOgg = `${tmpDir}/voice-note-${Date.now()}.ogg`;
      const writer = createWriteStream(pathTmpOgg);

      const response = await axios.get(audioUrl, { responseType: "stream" });
      response.data.pipe(writer);

      await new Promise((res, rej) => {
        writer.on("finish", res as any);
        writer.on("error", rej);
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file: createReadStream(pathTmpOgg),
        model: "whisper-1",
        response_format: "text",
        language: "es",
      });

      console.log("🧠 Transcripción de audio: " + transcription);

      return transcription;
    } catch (error) {
      console.error("🧠 Error en Whisper:", error);
      return null;
    }
  }

  async uploadFileToFTP(localFilePath: string, fileName: string): Promise<string> {
    const client = new Client();
    
    try {
      console.log(`Iniciando subida de archivo via FTP: ${localFilePath}`);

      // Verificar que el archivo existe
      if (!await fsExtra.pathExists(localFilePath)) {
        throw new Error(`El archivo no existe: ${localFilePath}`);
      }

      // Conectar al servidor FTP
      console.log(`Conectando a servidor FTP: ${process.env.FTP_HOST}`);
      await client.access({
        host: process.env.FTP_HOST!,
        user: process.env.FTP_USER!,
        password: process.env.FTP_PASSWORD!,
        port: parseInt(process.env.FTP_PORT || '21'),
        secure: false
      });

      // Preparar la ruta de destino
      const uploadDir = process.env.FTP_UPLOAD_DIR?.endsWith('/') 
        ? process.env.FTP_UPLOAD_DIR 
        : `${process.env.FTP_UPLOAD_DIR}/`;
      
      // Verificar que estamos en el directorio raíz
      await client.cd('/');
      
      // Obtener directorios que necesitamos crear/verificar
      const dirParts = uploadDir.split('/').filter(Boolean);
      
      // Navegar por cada directorio, creándolo si no existe
      for (const dir of dirParts) {
        try {
          await client.cd(dir);
        } catch (cdError) {
          console.log(`Directorio ${dir} no existe, creándolo...`);
          try {
            await client.ensureDir(dir);
            await client.cd(dir);
          } catch (mkdirError) {
            console.error(`Error al crear directorio ${dir}: ${mkdirError.message}`);
            throw new Error(`No se pudo crear el directorio: ${dir}`);
          }
        }
      }
      
      console.log(`Directorio de destino verificado: ${await client.pwd()}`);
      
      // Subir el archivo
      console.log(`Subiendo archivo a: ${fileName}`);
      await client.uploadFrom(localFilePath, fileName);
      
      // Generar la URL pública
      const publicUrl = `${process.env.PDF_PUBLIC_URL}${fileName}`;
      console.log(`Archivo subido correctamente. URL pública: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error(`Error al subir archivo por FTP: ${error.message}`);
      throw error;
    } finally {
      client.close();
      console.log('Conexión FTP cerrada');
    }
  }
  
  async saveAndUploadFTP(
    pdfUrl: string,
    puestoPostular: string,
    originalName?: string
  ): Promise<CvAnalysisResult> {
    // 1. Descargar el PDF desde la URL
    //const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${config.META_JWT_TOKEN}`,
      },
    });
    const fileName = `cv_${Date.now()}.pdf`;
    const tempPath = `./temp/${fileName}`;
    await fsExtra.ensureDir('./temp');
    await fsExtra.writeFile(tempPath, response.data);

    // 2. Subir el PDF por FTP y obtener el enlace público usando la variable de entorno
    const publicUrl = await this.uploadFileToFTP(tempPath, fileName);

    // 3. Limpiar el archivo temporal
    await fsExtra.remove(tempPath);

    // 4. Analizar el CV usando el enlace público
    const result = await this.analyzeCv(publicUrl, puestoPostular, originalName);

    return result;
  }


}
