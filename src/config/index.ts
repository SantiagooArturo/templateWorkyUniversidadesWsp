import dotenv from "dotenv";
dotenv.config();

export default {
  PORT: process.env.PORT ?? 3008,
  META_JWT_TOKEN: process.env.META_JWT_TOKEN,
  META_NUMBER_ID: process.env.META_NUMBER_ID,
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
  META_VERSION: process.env.META_VERSION,

  BASE_URL_WORKI: process.env.BASE_URL_WORKI,

  API_KEY_FIREBASE: process.env.API_KEY_FIREBASE,
  AUTH_DOMAIN_FIREBASE: process.env.AUTH_DOMAIN_FIREBASE,
  PROJECT_ID_FIREBASE: process.env.PROJECT_ID_FIREBASE,
  STORAGE_BUCKET_FIREBASE: process.env.STORAGE_BUCKET_FIREBASE,
  MESSAGING_SENDER_ID_FIREBASE: process.env.MESSAGING_SENDER_ID_FIREBASE,
  APP_ID_FIREBASE: process.env.APP_ID_FIREBASE,

  URL_BASE_BOT: process.env.URL_BASE_BOT,
  URL_JOBS: process.env.URL_JOBS,

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",

  // FTP Configuration
  FTP_HOST: process.env.FTP_HOST,
  FTP_USER: process.env.FTP_USER,
  FTP_PASSWORD: process.env.FTP_PASSWORD,
  FTP_PORT: process.env.FTP_PORT || "21",
  FTP_UPLOAD_DIR: process.env.FTP_UPLOAD_DIR,
  PDF_PUBLIC_URL: process.env.PDF_PUBLIC_URL,

  // Yape Configuration for B2C Payments
  YAPE_RECIPIENT_PHONE: process.env.YAPE_RECIPIENT_PHONE || "987654321",
  YAPE_RECIPIENT_NAME: process.env.YAPE_RECIPIENT_NAME || "Worky Bot",
  YAPE_QR_URL: process.env.YAPE_QR_URL,

  // Storage Configuration
  STORAGE_BASE_URL: process.env.STORAGE_BASE_URL || "https://worky-bot.onrender.com",
};
