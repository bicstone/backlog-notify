import * as core from "@actions/core"
import { mocked } from "jest-mock"

import push from "./github/events/push.json"
import pushWithoutCommits from "./github/events/pushWithoutCommits.json"

import type { AxiosResponse } from "axios"
import type { PushEvent } from "@octokit/webhooks-types"

import { main } from "../src/main"
import * as getConfigs from "../src/getConfigs"
import * as fetchEvent from "../src/fetchEvent"
import * as parseCommits from "../src/parseCommits"
import * as postComments from "../src/postComments"

jest.mock("@actions/core")
jest.mock("../src/getConfigs")
jest.mock("../src/fetchEvent")
jest.mock("../src/parseCommits")
jest.mock("../src/postComments")

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
  request: {},
}

const message = "message"
const issueKey = "issueKey"

const basePostCommentsResponse: postComments.Response = {
  response: axiosResponse,
  commits: [
    {
      message,
    },
  ] as parseCommits.ParsedCommit[],
  issueKey,
  isFix: false,
  isClose: false,
}

describe("main", () => {
  beforeEach(() => {
    mocked(getConfigs.getConfigs).mockImplementation(() => {
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
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: push as PushEvent,
    }))
    mocked(parseCommits.parseCommits).mockImplementation(() => ({
      parsedCommits: { key: [] },
    }))
    mocked(core.info).mockImplementation((m) => m)
    mocked(core.setFailed).mockImplementation((m) => m)
  })

  test("main resolve with the message", async () => {
    const postCommentsResponse: postComments.Response = basePostCommentsResponse
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(2)
    expect(core.info).toHaveBeenCalledWith(message)
    expect(core.info).toHaveBeenCalledWith("正常に送信しました。")
  })

  test("main resolve with the message when commits with fix_keyword", async () => {
    const postCommentsResponse: postComments.Response = {
      ...basePostCommentsResponse,
      isFix: true,
    }
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(3)
    expect(core.info).toHaveBeenCalledWith(message)
    expect(core.info).toHaveBeenCalledWith(`${issueKey}を処理済みにしました。`)
    expect(core.info).toHaveBeenCalledWith("正常に送信しました。")
  })

  test("main resolve with the message when commits with close_keyword", async () => {
    const postCommentsResponse: postComments.Response = {
      ...basePostCommentsResponse,
      isClose: true,
    }
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(3)
    expect(core.info).toHaveBeenCalledWith(message)
    expect(core.info).toHaveBeenCalledWith(`${issueKey}を完了にしました。`)
    expect(core.info).toHaveBeenCalledWith("正常に送信しました。")
  })

  test("main not continue and resolve processing when 0 commits", async () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: pushWithoutCommits as PushEvent,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      "コミットが1件も見つかりませんでした。"
    )
  })

  test("main not continue and resolve processing when the event cannot be loaded", async () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: null as unknown as PushEvent,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      "コミットが1件も見つかりませんでした。"
    )
  })

  test("main not continue and resolve processing when the event is invalid", async () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: { commits: null } as unknown as PushEvent,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      "コミットが1件も見つかりませんでした。"
    )
  })

  test("main not continue and resolve processing when commits without issueKey", async () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: push as PushEvent,
    }))
    mocked(parseCommits.parseCommits).mockImplementation(() => ({
      parsedCommits: null,
    }))
    await expect(main()).resolves.not.toThrow()
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      "課題キーのついたコミットが1件も見つかりませんでした。"
    )
  })

  test("main calls setFailed when an error", async () => {
    const error = Error("error!")
    mocked(fetchEvent.fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(error)
  })

  test("main calls setFailed when an unexpected error", async () => {
    const error = "error!"
    mocked(fetchEvent.fetchEvent).mockImplementation(() => {
      throw error
    })
    await expect(main()).resolves.not.toThrow()
    expect(core.setFailed).toHaveBeenCalledTimes(1)
    expect(core.setFailed).toHaveBeenCalledWith(error)
  })
})
