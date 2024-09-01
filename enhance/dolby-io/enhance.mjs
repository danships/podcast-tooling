import axios from "axios";
import "dotenv/config";
import fs from "node:fs";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJobStatus(apiToken, jobId) {
  const config = {
    method: "get",
    url: "https://api.dolby.com/media/enhance",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    //TODO: You must replace this value with the job ID returned from the previous step.

    params: {
      job_id: jobId,
    },
  };

  /**
   * {
   *   "path": "/media/enhance",
   *   "progress": 100,
   *   "result": {},
   *   "status": "Success"
   * }
   */
  const jobStatus = await axios(config);
  return jobStatus.data;
}

async function downloadDlbFile(apiToken, dlbUrl) {
  // Create a pre-signed URL.
  const config = {
    method: "post",
    url: "https://api.dolby.com/media/output",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: JSON.stringify({
      url: dlbUrl,
    }),
  };

  // Download your media file.
  const response = await axios(config);
  const download_config = {
    method: "get",
    url: response.data.url,
    responseType: "stream",
  };
  const response_data = await axios(download_config);
  response_data.data.pipe(fs.createWriteStream("./output.m4a"));
}

async function main() {
  const API_KEY = process.env.API_KEY;
  const API_SECRET = process.env.API_SECRET;

  const auth = await axios.get("https://api.dolby.io/v1/auth/token", {
    auth: { username: API_KEY, password: API_SECRET },
  });

  const apiToken = auth.data.access_token;

  const config = {
    method: "post",
    url: "https://api.dolby.com/media/enhance",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: {
      input:
        "https://9c91-95-99-253-126.ngrok-free.app/001-introduction_recorded_at_start.m4a",
      output: "dlb://out/output.m4a",
    },
  };

  const response = await axios(config);
  const jobId = response.data.job_id;

  let jobStatus = { Status: "" };
  const start = new Date().getTime();
  do {
    await sleep(2000);
    jobStatus = await getJobStatus(apiToken, jobId);

    console.log("Busy for", (new Date().getTime() - start) / 1000, " seconds");
    console.log("found", jobStatus);
  } while (jobStatus.status !== "Success");

  // Download the file
  await downloadDlbFile(apiToken, "dlb://out/output.m4a");
}

try {
  await main();
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error("Axios Error", error.message, error.response.data);
  } else {
    console.error(error);
  }
}
