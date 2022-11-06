import { info, setFailed } from "@actions/core"
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
        prOpenCommentTemplate: "prOpenCommentTemplate",
        prReadyForReviewCommentTemplate: "prReadyForReviewCommentTemplate",
        prCloseCommentTemplate: "prCloseCommentTemplate",
        prMergedCommentTemplate: "prMergedCommentTemplate",
        commitMessageRegTemplate: "commitMessageRegTemplate",
        prTitleRegTemplate: "prTitleRegTemplate",
        fixStatusId: "fixStatusId",
        closeStatusId: "closeStatusId",
      }
    })
    mocked(fetchEvent).mockImplementation(() => ({
      event: pushEvent,
    }))
    mocked(info).mockImplementation((m) => m)
    mocked(setFailed).mockImplementation((m) => m)
  })

  test("main resolve with the message", async () => {
    mocked(push).mockImplementation(() => Promise.resolve("push!"))
    await expect(main()).resolves.not.toThrow()
    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith("push!")
  })

  test("main not continue and resolve processing when 0 commits", async () => {
    mocked(fetchEvent).mockImplementation(() => ({
      event: { ...pushEvent, commits: [] },
    }))
    await expect(main()).resolves.not.toThrow()
    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(
      "予期しないイベントだったのでスキップしました。"
    )
  })

  test("main not continue and resolve processing when the event cannot be loaded", async () => {
    mocked(fetchEvent).mockImplementation(() => ({
      event: null as unknown as PushEvent,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(
      "予期しないイベントだったのでスキップしました。"
    )
  })

  test("main calls setFailed when an error", async () => {
    const error = Error("error!")
    mocked(fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(setFailed).toHaveBeenCalledTimes(1)
    expect(setFailed).toHaveBeenCalledWith(error)
  })

  test("main calls setFailed when an unexpected error", async () => {
    const error = "error!"
    mocked(fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(setFailed).toHaveBeenCalledTimes(1)
    expect(setFailed).toHaveBeenCalledWith(error)
  })
})
