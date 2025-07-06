import { ServicesFireBase, ServicesWorki } from "./services";
import { MemoryDB, createBot } from "@builderbot/bot";
import { fileURLToPath } from "url";
import templates from "./templates";
import provider from "./provider";
import { dirname } from "path";
import config from "./config";
import path from "path";
import fs from "fs";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const main = async () => {
  const { httpServer } = await createBot(
    {
      flow: templates,
      provider: provider,
      database: new MemoryDB(),
    },
    {
      extensions: {
        db: new ServicesFireBase({
          apiKey: config.API_KEY_FIREBASE,
          authDomain: config.AUTH_DOMAIN_FIREBASE,
          projectId: config.PROJECT_ID_FIREBASE,
          storageBucket: config.STORAGE_BUCKET_FIREBASE,
          messagingSenderId: config.MESSAGING_SENDER_ID_FIREBASE,
          appId: config.APP_ID_FIREBASE,
        }),
        worki: new ServicesWorki(config.BASE_URL_WORKI, config.URL_JOBS),
      },
    }
  );

  provider.server.get("/cv/:filename", (req, res) => {
    const { filename } = req.params;

    // Construir la ruta correctamente usando __dirname
    const filePath = path.join(__dirname, "..", "cvs", filename);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("File not found");
      return;
    }

    // Leer y enviar el archivo usando Polka
    try {
      const fileContent = fs.readFileSync(filePath);

      // Establecer headers apropiados para PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", fileContent.length);

      // Enviar el archivo
      res.end(fileContent);
    } catch (error) {
      console.error("Error reading file:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Endpoint para servir videos
  provider.server.get("/videos/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "..", "videos", filename);

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("Video not found");
      return;
    }

    try {
      const fileContent = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();

      const mimeTypes = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
      };

      const contentType = mimeTypes[ext] || "video/mp4";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", fileContent.length);
      res.setHeader("Accept-Ranges", "bytes");

      res.end(fileContent);
    } catch (error) {
      console.error("Error reading video file:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Audio file serving endpoint (solo para audios generales, no entrevistas)
  provider.server.get("/audios/:filename", (req, res) => {
    const { filename } = req.params;

    // Validate filename to prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      res.statusCode = 400;
      res.end("Invalid filename");
      return;
    }

    const filePath = path.join(__dirname, "..", "audios", filename);

    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("Audio file not found");
      return;
    }

    try {
      const fileContent = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();

      // Set appropriate MIME type for audio files
      const mimeTypes = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
      };

      const contentType = mimeTypes[ext] || "audio/mpeg";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", fileContent.length);
      res.setHeader("Accept-Ranges", "bytes"); // Enable audio seeking

      res.end(fileContent);
    } catch (error) {
      console.error("Error reading audio file:", error);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  httpServer(+config.PORT);
};

main();
