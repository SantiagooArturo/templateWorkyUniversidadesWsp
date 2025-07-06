import config from "../../config";
import axios, { AxiosInstance } from "axios";

/**
 * Servicio para manejo de archivos en almacenamiento externo
 * Integrado con el ecosistema Worky B2C Bot
 */
export class S3Service {
  private axiosInstance: AxiosInstance;
  private readonly uploadBaseUrl: string;

  constructor() {
    this.uploadBaseUrl = config.STORAGE_BASE_URL || 'https://worky-bot.onrender.com';
    
    this.axiosInstance = axios.create({
      baseURL: this.uploadBaseUrl,
      timeout: 30000, // 30 segundos para uploads
      headers: {
        'Accept': 'application/json',
      }
    });
  }

  /**
   * Sube archivo de media (imágenes, PDFs, audio)
   * @param file - Archivo blob
   * @param filename - Nombre del archivo
   * @param userId - ID del usuario (para organización)
   * @param type - Tipo de archivo ('cv', 'yape', 'audio', 'image')
   * @returns URL pública del archivo subido
   */
  async uploadMedia(
    file: Blob, 
    filename: string, 
    userId?: string, 
    type: 'cv' | 'yape' | 'audio' | 'image' = 'image'
  ): Promise<string> {
    try {
      console.log(`📤 Subiendo archivo: ${filename} (tipo: ${type})`);

      const formData = new FormData();
      formData.append('file', file, filename);
      
      // Agregar metadatos para organización
      if (userId) {
        formData.append('userId', userId);
      }
      formData.append('type', type);
      formData.append('timestamp', Date.now().toString());

      const response = await this.axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (!response.data.success || !response.data.url) {
        throw new Error('Respuesta de upload inválida');
      }

      console.log(`✅ Archivo subido exitosamente: ${response.data.url}`);
      return response.data.url;

    } catch (error: any) {
      console.error(`❌ Error subiendo archivo: ${error.message}`);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }
  }

  /**
   * Sube CV desde URL de WhatsApp para análisis
   * @param cvUrl - URL temporal del CV de WhatsApp
   * @param userId - ID del usuario
   * @returns URL pública del CV
   */
  async uploadCvFromUrl(cvUrl: string, userId: string): Promise<string> {
    try {
      console.log(`📄 Descargando y subiendo CV para usuario: ${userId}`);

      // Descargar CV desde WhatsApp con autenticación
      const cvResponse = await axios.get(cvUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${config.META_JWT_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (compatible; WorkyBot/1.0)'
        },
        timeout: 30000
      });

      // Crear blob del PDF
      const cvBlob = new Blob([cvResponse.data], { type: 'application/pdf' });
      const filename = `cv_${userId}_${Date.now()}.pdf`;

      // Subir a almacenamiento
      return await this.uploadMedia(cvBlob, filename, userId, 'cv');

    } catch (error: any) {
      console.error(`❌ Error procesando CV: ${error.message}`);
      throw new Error(`No se pudo procesar el CV: ${error.message}`);
    }
  }

  /**
   * Sube imagen de comprobante Yape para validación
   * @param imageUrl - URL temporal de la imagen de WhatsApp
   * @param userId - ID del usuario
   * @returns URL pública de la imagen
   */
  async uploadYapeImage(imageUrl: string, userId: string): Promise<string> {
    try {
      console.log(`💳 Procesando comprobante Yape para usuario: ${userId}`);

      // Descargar imagen desde WhatsApp
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${config.META_JWT_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (compatible; WorkyBot/1.0)'
        },
        timeout: 15000
      });

      // Crear blob de la imagen
      const imageBlob = new Blob([imageResponse.data], { type: 'image/jpeg' });
      const filename = `yape_${userId}_${Date.now()}.jpg`;

      // Subir a almacenamiento
      return await this.uploadMedia(imageBlob, filename, userId, 'yape');

    } catch (error: any) {
      console.error(`❌ Error procesando imagen Yape: ${error.message}`);
      throw new Error(`No se pudo procesar la imagen: ${error.message}`);
    }
  }

  /**
   * Sube audio de entrevista para transcripción
   * @param audioUrl - URL temporal del audio de WhatsApp
   * @param userId - ID del usuario
   * @returns URL pública del audio
   */
  async uploadInterviewAudio(audioUrl: string, userId: string): Promise<string> {
    try {
      console.log(`🎤 Procesando audio de entrevista para usuario: ${userId}`);

      // Descargar audio desde WhatsApp
      const audioResponse = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${config.META_JWT_TOKEN}`,
          'User-Agent': 'Mozilla/5.0 (compatible; WorkyBot/1.0)'
        },
        timeout: 30000
      });

      // Crear blob del audio
      const audioBlob = new Blob([audioResponse.data], { type: 'audio/ogg' });
      const filename = `interview_${userId}_${Date.now()}.ogg`;

      // Subir a almacenamiento
      return await this.uploadMedia(audioBlob, filename, userId, 'audio');

    } catch (error: any) {
      console.error(`❌ Error procesando audio: ${error.message}`);
      throw new Error(`No se pudo procesar el audio: ${error.message}`);
    }
  }

  /**
   * Elimina archivo del almacenamiento
   * @param fileUrl - URL del archivo a eliminar
   * @returns boolean indicando éxito
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando archivo: ${fileUrl}`);

      const response = await this.axiosInstance.delete('/delete', {
        data: { url: fileUrl }
      });

      return response.data.success || false;

    } catch (error: any) {
      console.error(`❌ Error eliminando archivo: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene información de un archivo
   * @param fileUrl - URL del archivo
   * @returns Información del archivo
   */
  async getFileInfo(fileUrl: string): Promise<{size: number, type: string, lastModified: Date} | null> {
    try {
      const response = await this.axiosInstance.get('/info', {
        params: { url: fileUrl }
      });

      return response.data.info || null;

    } catch (error: any) {
      console.error(`❌ Error obteniendo info del archivo: ${error.message}`);
      return null;
    }
  }

  /**
   * Lista archivos de un usuario
   * @param userId - ID del usuario
   * @param type - Tipo de archivo (opcional)
   * @returns Lista de URLs de archivos
   */
  async listUserFiles(userId: string, type?: 'cv' | 'yape' | 'audio' | 'image'): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/list', {
        params: { 
          userId,
          type: type || undefined
        }
      });

      return response.data.files || [];

    } catch (error: any) {
      console.error(`❌ Error listando archivos: ${error.message}`);
      return [];
    }
  }

  /**
   * Limpia archivos temporales antiguos de un usuario
   * @param userId - ID del usuario
   * @param olderThanDays - Días de antigüedad (default: 7)
   * @returns Número de archivos eliminados
   */
  async cleanupUserFiles(userId: string, olderThanDays: number = 7): Promise<number> {
    try {
      console.log(`🧹 Limpiando archivos antiguos del usuario: ${userId}`);

      const response = await this.axiosInstance.post('/cleanup', {
        userId,
        olderThanDays
      });

      const deletedCount = response.data.deletedCount || 0;
      console.log(`✅ Eliminados ${deletedCount} archivos antiguos`);
      
      return deletedCount;

    } catch (error: any) {
      console.error(`❌ Error en limpieza: ${error.message}`);
      return 0;
    }
  }
}

// Export por defecto para uso en el bot
export default S3Service;