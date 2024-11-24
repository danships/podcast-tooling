import { str, cleanEnv, bool } from "envalid";

export const environment = cleanEnv(process.env, {
  TELEGRAM_BOT_TOKEN: str(),
  TELEGRAM_CHAT_ID: str(),
  FOLDER_WITH_BITS: str(),
  DEBUG: bool({ default: false }),
  OPENAI_API_KEY: str(),

  NOTION_API_KEY: str(),
  NOTION_DATABASE_ID: str(),

  DATASTHOR_API_KEY: str(),
  DATASTHOR_NAMESPACE: str(),
});
