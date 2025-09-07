import { readFileSync } from "node:fs";
import type { Schema } from "@octokit/webhooks-types";

/**
 * Fetch and Parses event from event.json file
 * @param path Path to event.json
 * @returns Parsed event from event.json
 */

export const fetchEvent = ({ path }: { path: string }): { event: Schema } => {
  const event = readFileSync(path, "utf8");
  return { event: JSON.parse(event) as Schema };
};
