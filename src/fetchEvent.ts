import { readFileSync } from "fs"
import type { PushEvent } from "@octokit/webhooks-types"

/**
 * Fetch and Parses event from event.json file
 * @param path Path to event.json
 * @returns Parsed event from event.json
 */

export const fetchEvent = (path: string): PushEvent => {
  const event = readFileSync(path, "utf8")
  const data = JSON.parse(event) as PushEvent

  return data
}
