import { readFile, writeFile } from "fs/promises";
import { OpenAI } from "openai";
import { environment } from "./environment";
import { logger } from "./logger";
import { getModel, SYSTEM_PROMPT_PREFIX } from "./summarize";

export async function fixTranscripts(
  transcriptFile: string,
  outputFile: string
) {
  const transcript = await readFile(transcriptFile, "utf8");

  const client = new OpenAI({ apiKey: environment.OPENAI_API_KEY });

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT_PREFIX}\n${transcript}` },
      {
        role: "user",
        content:
          "Please group these transcripts in neat paragraphs. Don't change the sentences and the words, only the grouping of the sentences.",
      },
    ],
    model: getModel(),
  });

  await writeFile(outputFile, chatCompletion.choices[0].message.content);

  logger("Fixed transcripts is ready", outputFile);
}
