import { readFile, writeFile } from "fs/promises";
import { OpenAI } from "openai";
import { environment } from "./environment";
import { logger } from "./logger";

export const SYSTEM_PROMPT_PREFIX = `You are an intelligent expert on podcast transcripts.
Very good in extracting the correct message from the transcripts, and other activities.
You are asked to look into the transcript below for the Debugging Dan podcast, the user will ask you questions about it.`;

export function getModel() {
  return environment.DEBUG ? "gpt-4o-mini" : "gpt-4o";
}

export async function summarize(transcriptFile: string, outputFile: string) {
  const transcript = await readFile(transcriptFile, "utf8");

  const client = new OpenAI({ apiKey: environment.OPENAI_API_KEY });

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT_PREFIX}\n${transcript}` },
      {
        role: "user",
        content:
          "Can you create a short summary of this transcript? Write it in the I form, it's for a summary field of podcast episode. Please also suggest a title and end with 10 keyword suggestion.",
      },
    ],
    model: getModel(),
  });

  await writeFile(outputFile, chatCompletion.choices[0].message.content);

  logger("Summary is ready", outputFile);
}
