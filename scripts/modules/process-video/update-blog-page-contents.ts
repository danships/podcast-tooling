import { Client } from "@notionhq/client";
import { readFile } from "fs/promises";
import { logger } from "./logger";
import { environment } from "./environment";
import { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";

export async function updateBlogPageContents(
  pageId: string,
  createdBlogTitle: string,
  transcriptFile: string,
  summaryFile: string
) {
  const notion = new Client({
    auth: environment.NOTION_API_KEY,
  });

  const summary = await readFile(summaryFile, "utf8");
  const transcript = await readFile(transcriptFile, "utf8");

  const pageResponse = await notion.pages.retrieve({
    page_id: pageId,
  });

  if (
    "properties" in pageResponse &&
    pageResponse.properties.Title.type === "title" &&
    pageResponse.properties.Title.title[0].plain_text !== createdBlogTitle
  ) {
    logger(
      "Skipping update of blog page contents, because the title does not match the transcript file name"
    );
    return;
  }

  await notion.pages.update({
    page_id: pageId,
    properties: {
      Description: {
        rich_text: [
          {
            text: {
              content: summary,
            },
          },
        ],
      },
      Excerpt: {
        rich_text: [
          {
            text: {
              content: summary,
            },
          },
        ],
      },
    },
  });

  await notion.blocks.children.append({
    block_id: pageId,
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: {
                content: summary,
              },
            },
          ],
        },
      },
      {
        object: "block",
        type: "embed",
        embed: {
          url: "https://podcast.debuggingdan.com/@debuggingdan/episodes/[slug]/embed",
        },
      },
      {
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [
            {
              type: "text",
              text: {
                content: "Transcript",
              },
            },
          ],
        },
      },
      ...transcript
        .split("\n\n")
        .map((line) => line.trim())
        .map(
          (line): BlockObjectRequest => ({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: line,
                  },
                },
              ],
            },
          })
        ),
    ],
  });

  logger("Updated blog page");
}
