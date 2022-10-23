import * as core from "@actions/core"
import { mocked } from "jest-mock"
import webhooks from "@octokit/webhooks-examples"

import type { AxiosResponse } from "axios"
import type { PushEvent } from "@octokit/webhooks-types"

import { push } from "./"
import { parseRef } from "./parseRef"
import { parseCommits, ParsedCommit } from "./parseCommits"
import { postComments, Response } from "./postComments"

jest.mock("@actions/core")
jest.mock("./parseRef")
jest.mock("./parseCommits")
jest.mock("./postComments")

const pushEvents = (webhooks.find((v) => v.name === "push")?.examples ??
  []) as PushEvent[]

const configs = {
  projectKey: "projectKey",
  apiHost: "apiHost",
  apiKey: "apiKey",
  fixKeywords: ["fixKeyword"],
  closeKeywords: ["closeKeyword"],
  pushCommentTemplate: "pushCommentTemplate",
  commitMessageRegTemplate: "commitMessageRegTemplate",
  fixStatusId: "fixStatusId",
  closeStatusId: "closeStatusId",
}

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

const basePostCommentsResponse: Response = {
  response: axiosResponse,
  commits: [
    {
      message,
    },
  ] as ParsedCommit[],
  issueKey,
  isFix: false,
  isClose: false,
}

describe.each(pushEvents)("index", (event) => {
  beforeEach(() => {
    mocked(parseCommits).mockImplementation(() => ({
      parsedCommits: { key: [] },
    }))
    mocked(parseRef).mockImplementation(() => ({
      name: "",
      url: "",
    }))
    mocked(core.info).mockImplementation((m) => m)
    mocked(core.setFailed).mockImplementation((m) => m)
  })

  test("main resolve with the message", async () => {
    const postCommentsResponse: Response = basePostCommentsResponse
    mocked(postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(push({ ...configs, event })).resolves.toEqual(
      "正常に送信しました。"
    )
    expect(core.info).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(message)
  })

  test("main resolve with the message when commits with fix_keyword", async () => {
    const postCommentsResponse: Response = {
      ...basePostCommentsResponse,
      isFix: true,
    }
    mocked(postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(push({ ...configs, event })).resolves.toEqual(
      "正常に送信しました。"
    )
    expect(core.info).toHaveBeenCalledTimes(2)
    expect(core.info).toHaveBeenCalledWith(message)
    expect(core.info).toHaveBeenCalledWith(`${issueKey}を処理済みにしました。`)
  })

  test("main resolve with the message when commits with close_keyword", async () => {
    const postCommentsResponse: Response = {
      ...basePostCommentsResponse,
      isClose: true,
    }
    mocked(postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    await expect(push({ ...configs, event })).resolves.toEqual(
      "正常に送信しました。"
    )
    expect(core.info).toHaveBeenCalledTimes(2)
    expect(core.info).toHaveBeenCalledWith(message)
    expect(core.info).toHaveBeenCalledWith(`${issueKey}を完了にしました。`)
  })

  test("main not continue and resolve processing when commits without issueKey", async () => {
    mocked(parseCommits).mockImplementation(() => ({
      parsedCommits: null,
    }))
    await expect(push({ ...configs, event })).resolves.toEqual(
      "課題キーのついたコミットが1件も見つかりませんでした。"
    )
  })

  test("main not continue and resolve processing when the event.ref is invalid", async () => {
    mocked(parseRef).mockImplementation(() => undefined)
    await expect(push({ ...configs, event })).resolves.toEqual(
      "Git referenceの解析に失敗しました。"
    )
  })
})
