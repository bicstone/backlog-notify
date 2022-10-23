import fs from "fs"
import { fetchEvent } from "../src/fetchEvent"
import webhooks from "@octokit/webhooks-examples"

const pushEvents =
  webhooks.find((webhook) => webhook.name === "push")?.examples ?? []

jest.mock("fs")
const mockedFs = fs as jest.Mocked<typeof fs>

const path = "event.json"
const encoding = "utf8"

describe("fetchEvent", () => {
  test.each(pushEvents)("fetchEvent return parsed event", (pushEvent) => {
    mockedFs.readFileSync.mockImplementation(() => JSON.stringify(pushEvent))

    expect(fetchEvent({ path })).toStrictEqual({ event: pushEvent })
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1)
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(path, encoding)
  })
})
