import { Client } from "@notionhq/client";
import { readFile } from "fs/promises";
import { environment } from "./environment";
import { logger } from "./logger";

export async function createBlogPage(
  transcriptsFileName: string
): Promise<string> {
  const notion = new Client({
    auth: environment.NOTION_API_KEY,
  });

  const response = await notion.databases.query({
    database_id: environment.NOTION_DATABASE_ID,
    filter: {
      and: [
        {
          property: "Title",
          title: {
            equals: transcriptsFileName,
          },
        },
      ],
    },
    page_size: 1,
  });

  if (response.results.length > 0) {
    logger("Blog post already exists.");
    return response.results[0].id ?? "";
  }

  const page = await notion.pages.create({
    parent: {
      database_id: environment.NOTION_DATABASE_ID,
      type: "database_id",
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: transcriptsFileName,
            },
          },
        ],
      },
      Slug: {
        rich_text: [
          {
            text: {
              content: "tbd",
            },
          },
        ],
      },
      Published: {
        checkbox: false,
      },
      Description: {
        rich_text: [
          {
            text: {
              content: "tbd",
            },
          },
        ],
      },
      Excerpt: {
        rich_text: [
          {
            text: {
              content: "tbd",
            },
          },
        ],
      },
      Created: {
        date: {
          start: new Date().toISOString(),
        },
      },
      Category: {
        multi_select: [{ name: "podcast" }],
      },
    },
  });

  return page.id;
}
