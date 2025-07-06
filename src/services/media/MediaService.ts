import config from "../../config";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ServicesFireBase } from "../db/ServicesFireBase";

export interface MediaInfo {
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mediaType: 'audio' | 'video' | 'image' | 'document';
  mimeType?: string;
  duration?: number;
  createdAt: Date;
  publicUrl?: string;
}

export class MediaService {
  private readonly audioDir: string;
  private readonly videoDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.audioDir = path.join(process.cwd(), "audios");
    this.videoDir = path.join(process.cwd(), "videos");
    this.baseUrl = config.URL_BASE_BOT;
    
    // Crear directorios si no existen
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.audioDir, this.videoDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    });
  }

  /**
   * Guarda audio de entrevista desde WhatsApp
   */
  async saveInterviewAudio(
    mediaUrl: string, 
    userId: string, 
    messageId: string
  ): Promise<MediaInfo> {
    try {
      console.log(`🎤 Guardando audio de entrevista: ${userId}`);
      
      // Descargar archivo
      const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${config.META_JWT_TOKEN}`,
        },
        timeout: 30000
      });

      // Generar nombre de archivo simple
      const fileName = `${userId}_${messageId}_${Date.now()}.ogg`;
      const filePath = path.join(this.audioDir, fileName);
      
      // Guardar archivo
      fs.writeFileSync(filePath, response.data);
      
      const fileStats = fs.statSync(filePath);
      // URL simple que apunta al endpoint general /audios/:filename
      const publicUrl = `${this.baseUrl}audios/${fileName}`;
      
      const mediaInfo: MediaInfo = {
        userId,
        fileName,
        filePath,
        fileSize: fileStats.size,
        mediaType: 'audio',
        mimeType: 'audio/ogg',
        createdAt: new Date(),
        publicUrl
      };
      
      console.log(`✅ Audio guardado: ${fileName} -> ${publicUrl}`);
      
      return mediaInfo;
      
    } catch (error) {
      console.error(`❌ Error guardando audio:`, error);
      throw new Error(`No se pudo guardar el audio: ${error.message}`);
    }
  }

  /**
   * Guarda video desde WhatsApp
   */
  async saveVideo(
    mediaUrl: string, 
    userId: string, 
    messageId: string
  ): Promise<MediaInfo> {
    try {
      console.log(`🎥 Guardando video:`);
      console.log(`   👤 Usuario: ${userId}`);
      console.log(`   📍 URL: ${mediaUrl}`);
      
      const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${config.META_JWT_TOKEN}`,
        },
        timeout: 60000 // 60 segundos para videos
      });

      const fileName = `video_${userId}_${messageId}_${Date.now()}.mp4`;
      const filePath = path.join(this.videoDir, fileName);
      
      fs.writeFileSync(filePath, response.data);
      
      const fileStats = fs.statSync(filePath);
      // Evitar doble slash - URL base ya incluye slash final
      const publicUrl = `${this.baseUrl}videos/${fileName}`;
      
      const mediaInfo: MediaInfo = {
        userId,
        fileName,
        filePath,
        fileSize: fileStats.size,
        mediaType: 'video',
        mimeType: 'video/mp4',
        createdAt: new Date(),
        publicUrl
      };
      
      console.log(`✅ Video guardado exitosamente:`);
      console.log(`   📁 Archivo: ${fileName}`);
      console.log(`   📊 Tamaño: ${fileStats.size} bytes`);
      console.log(`   🌐 URL pública: ${publicUrl}`);
      
      return mediaInfo;
      
    } catch (error) {
      console.error(`❌ Error guardando video:`, error);
      throw new Error(`No se pudo guardar el video: ${error.message}`);
    }
  }

  /**
   * Lista todos los archivos de un usuario
   */
  getUserMedia(userId: string): MediaInfo[] {
    const userFiles: MediaInfo[] = [];
    
    // Buscar en audios
    if (fs.existsSync(this.audioDir)) {
      const audioFiles = fs.readdirSync(this.audioDir)
        .filter(file => file.includes(userId))
        .map(file => {
          const filePath = path.join(this.audioDir, file);
          const stats = fs.statSync(filePath);
          return {
            userId,
            fileName: file,
            filePath,
            fileSize: stats.size,
            mediaType: 'audio' as const,
            mimeType: 'audio/ogg',
            createdAt: stats.ctime,
            publicUrl: `${this.baseUrl}/audios/${file}`
          };
        });
      userFiles.push(...audioFiles);
    }
    
    // Buscar en videos
    if (fs.existsSync(this.videoDir)) {
      const videoFiles = fs.readdirSync(this.videoDir)
        .filter(file => file.includes(userId))
        .map(file => {
          const filePath = path.join(this.videoDir, file);
          const stats = fs.statSync(filePath);
          return {
            userId,
            fileName: file,
            filePath,
            fileSize: stats.size,
            mediaType: 'video' as const,
            mimeType: 'video/mp4',
            createdAt: stats.ctime,
            publicUrl: `${this.baseUrl}videos/${file}`
          };
        });
      userFiles.push(...videoFiles);
    }
    
    return userFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Elimina archivos antiguos de un usuario
   */
  cleanupUserMedia(userId: string, olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let deletedCount = 0;
    const userMedia = this.getUserMedia(userId);
    
    userMedia.forEach(media => {
      if (media.createdAt < cutoffDate) {
        try {
          fs.unlinkSync(media.filePath);
          deletedCount++;
          console.log(`🗑️ Archivo eliminado: ${media.fileName}`);
        } catch (error) {
          console.error(`❌ Error eliminando ${media.fileName}:`, error);
        }
      }
    });
    
    console.log(`🧹 Limpieza completada para usuario ${userId}: ${deletedCount} archivos eliminados`);
    return deletedCount;
  }

  /**
   * Obtiene estadísticas de uso de almacenamiento
   */
  getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    audioFiles: number;
    videoFiles: number;
    audioSize: number;
    videoSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;
    let audioFiles = 0;
    let videoFiles = 0;
    let audioSize = 0;
    let videoSize = 0;

    // Contar audios
    if (fs.existsSync(this.audioDir)) {
      const audioFileList = fs.readdirSync(this.audioDir);
      audioFiles = audioFileList.length;
      audioFileList.forEach(file => {
        const stats = fs.statSync(path.join(this.audioDir, file));
        audioSize += stats.size;
      });
    }

    // Contar videos
    if (fs.existsSync(this.videoDir)) {
      const videoFileList = fs.readdirSync(this.videoDir);
      videoFiles = videoFileList.length;
      videoFileList.forEach(file => {
        const stats = fs.statSync(path.join(this.videoDir, file));
        videoSize += stats.size;
      });
    }

    totalFiles = audioFiles + videoFiles;
    totalSize = audioSize + videoSize;

    return {
      totalFiles,
      totalSize,
      audioFiles,
      videoFiles,
      audioSize,
      videoSize
    };
  }
}