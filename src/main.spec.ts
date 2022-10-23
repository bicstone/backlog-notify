import * as core from "@actions/core"
import { mocked } from "jest-mock"
import webhooks from "@octokit/webhooks-examples"

import type { PushEvent } from "@octokit/webhooks-types"

import { main } from "./main"
import { getConfigs } from "./main/getConfigs"
import { fetchEvent } from "./main/fetchEvent"
import { push } from "./push"

jest.mock("@actions/core")
jest.mock("./main/getConfigs")
jest.mock("./main/fetchEvent")
jest.mock("./push")

const pushEvents = (webhooks.find((v) => v.name === "push")?.examples ??
  []) as PushEvent[]

const pushEventsWithCommit = pushEvents.filter((v) => v?.commits?.length > 0)

describe.each(pushEventsWithCommit)("main", (pushEvent) => {
  beforeEach(() => {
    mocked(getConfigs).mockImplementation(() => {
      return {
        projectKey: "projectKey",
        apiHost: "apiHost",
        apiKey: "apiKey",
        githubEventPath: "githubEventPath",
        fixKeywords: ["fixKeyword"],
        closeKeywords: ["closeKeyword"],
        pushCommentTemplate: "pushCommentTemplate",
        commitMessageRegTemplate: "commitMessageRegTemplate",
        fixStatusId: "fixStatusId",
        closeStatusId: "closeStatusId",
      }
    })
    mocked(fetchEvent).mockImplementation(() => ({
      event: pushEvent,
    }))
    mocked(core.info).mockImplementation((m) => m)
    mocked(core.setFailed).mockImplementation((m) => m)
  })

  test("main resolve with the message", async () => {
    mocked(push).mockImplementation(() => Promise.resolve("push!"))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith("push!")
  })

  test("main not continue and resolve processing when 0 commits", async () => {
    mocked(fetchEvent).mockImplementation(() => ({
      event: { ...pushEvent, commits: [] },
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith("Skipped as there were no commits.")
  })

  test("main not continue and resolve processing when the event cannot be loaded", async () => {
    mocked(fetchEvent).mockImplementation(() => ({
      event: null as unknown as PushEvent,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith("Skipped as there were no commits.")
  })

  test("main calls setFailed when an error", async () => {
    const error = Error("error!")
    mocked(fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(error)
  })

  test("main calls setFailed when an unexpected error", async () => {
    const error = "error!"
    mocked(fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(error)
  })
})
