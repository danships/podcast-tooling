import { environment } from "./environment";
import { logger } from "./logger";
import Bot from "node-telegram-bot-api";

export async function uploadVideo(videoPath: string) {
  // Upload the video to telegram using the bot token
  // The bot token should be stored in the TELEGRAM_BOT_TOKEN environment variable
  // The chat ID should be stored in the TELEGRAM_CHAT_ID environment variable

  const botToken = environment.TELEGRAM_BOT_TOKEN;
  const chatId = environment.TELEGRAM_CHAT_ID;

  const bot = new Bot(botToken, { polling: false });
  try {
    await bot.sendVideo(chatId, videoPath);
  } catch (error) {
    logger("Error uploading video to Telegram", error);
    return;
  }
  logger("Video uploaded successfully to Telegram");
}
