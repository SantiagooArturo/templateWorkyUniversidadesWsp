import dotenv from "dotenv";
dotenv.config();

export default {
  PORT: process.env.PORT ?? 3008,
  META_JWT_TOKEN: process.env.META_JWT_TOKEN,
  META_NUMBER_ID: process.env.META_NUMBER_ID,
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
  META_VERSION: process.env.META_VERSION,
};
