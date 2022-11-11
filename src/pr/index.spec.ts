import { info, setFailed } from "@actions/core"
import { mocked } from "jest-mock"
import webhooks from "@octokit/webhooks-examples"

import type { PullRequestEvent } from "@octokit/webhooks-types"

import { pr } from "./"
import { ParsedPullRequest, parsePullRequest } from "./parsePullRequest"
import { postComments, Response } from "./postComments"

jest.mock("@actions/core")
jest.mock("./parsePullRequest")
jest.mock("./postComments")

const pullRequestEvents = (webhooks.find((v) => v.name === "pull_request")
  ?.examples ?? []) as PullRequestEvent[]

const configs = {
  projectKey: "projectKey",
  apiHost: "apiHost",
  apiKey: "apiKey",
  fixKeywords: ["fixKeyword"],
  closeKeywords: ["closeKeyword"],
  fixStatusId: "fixStatusId",
  closeStatusId: "closeStatusId",
  prOpenCommentTemplate: "prOpenCommentTemplate",
  prReadyForReviewCommentTemplate: "prReadyForReviewCommentTemplate",
  prCloseCommentTemplate: "prCloseCommentTemplate",
  prMergedCommentTemplate: "prMergedCommentTemplate",
  prTitleRegTemplate: "prTitleRegTemplate",
}

const axiosResponse: Response = {
  data: {},
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
  request: {},
}

const title = "title"
const issueKey = "issueKey"
const keywords = "keywords"
const isFix = false
const isClose = false

describe.each(pullRequestEvents)("index", (event) => {
  const getParsedPullRequest = (
    parsedPullRequest?: Partial<ParsedPullRequest>
  ): ParsedPullRequest => ({
    pr: event.pull_request,
    action: event.action,
    sender: event.sender,
    issueKey,
    title,
    keywords,
    isFix,
    isClose,
    ...parsedPullRequest,
  })

  beforeEach(() => {
    mocked(info).mockImplementation((m) => m)
    mocked(setFailed).mockImplementation((m) => m)
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest(),
    }))
    mocked(postComments).mockImplementation(() =>
      Promise.resolve(axiosResponse)
    )
  })

  test("resolve with the message", async () => {
    await expect(pr({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。"
    )

    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(title)
  })

  test("resolve with the message when pr title with fix_keyword", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest({ isFix: true }),
    }))

    await expect(pr({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。"
    )

    expect(info).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledWith(title)
    expect(info).toHaveBeenCalledWith(`${issueKey}を処理済みにしました。`)
  })

  test("resolve with the message when pr title with close_keyword", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest({ isClose: true }),
    }))

    await expect(pr({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。"
    )

    expect(info).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledWith(title)
    expect(info).toHaveBeenCalledWith(`${issueKey}を完了にしました。`)
  })

  test("not continue and resolve processing when pr title without issueKey", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: null,
    }))

    await expect(pr({ ...configs, event })).resolves.toStrictEqual(
      "課題キーのついたプルリクエストが見つかりませんでした。"
    )
  })

  test("not continue and resolve processing when pr title without issueKey", async () => {
    mocked(postComments).mockImplementation(() => Promise.resolve("string"))

    await expect(pr({ ...configs, event })).resolves.toStrictEqual("string")
  })
})
