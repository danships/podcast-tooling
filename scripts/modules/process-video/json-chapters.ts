import { readFile, writeFile } from "fs/promises";
import { OpenAI } from "openai";
import { environment } from "./environment";
import { logger } from "./logger";
import { getModel, SYSTEM_PROMPT_PREFIX } from "./summarize";

export async function generateJsonChapters(
  transcriptFile: string,
  outputFile: string
) {
  const transcript = await readFile(transcriptFile, "utf8");

  const openAIOptions: Record<string, unknown> = {
    apiKey: environment.OPENAI_API_KEY,
  };
  if (environment.OPENAI_URL) {
    openAIOptions.baseURL = environment.OPENAI_URL;
  }
  const client = new OpenAI(openAIOptions);

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT_PREFIX}` },
      {
        role: "user",
        content: `For this transcript I need to create a JSON file for chapter markers. The file should include the following for each chapter:

    startTime: The time (in HH:MM:SS format) when the chapter starts.
    title: A short and descriptive title summarizing the chapter's content.    

The JSON should include chapters based on the following structure:

    Each time a new topic, question, or segment is introduced in the transcript, create a new chapter.
    Use concise titles (5-10 words).
    There is no relevant image or URL, leave those fields as null.

Example of the JSON structure:

[
  {
    "startTime": "00:00:00",
    "title": "Introduction",
    "image": null,
    "url": null"
  },
  {
    "startTime": "00:05:30",
    "title": "Main Topic: [Insert Topic]",
    "image": null,
    "url": null
  }
]

Use the following sample transcript to generate the JSON chapter file:

${transcript}

Please format the JSON cleanly and ensure all chapter times are accurate and sequential. Output only the JSON."`,
      },
    ],
    model: getModel(),
  });

  await writeFile(outputFile, chatCompletion.choices[0].message.content);

  logger("JSON Chapter is ready", outputFile);
}
