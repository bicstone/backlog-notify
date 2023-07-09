import { info, setFailed } from "@actions/core"
import { mocked } from "jest-mock"
import webhooks from "@octokit/webhooks-examples"

import type { PullRequestEvent } from "@octokit/webhooks-types"

import { pr, PrProps } from "./"
import { ParsedPullRequest, parsePullRequest } from "./parsePullRequest"
import { postComments, Response } from "./postComments"

jest.mock("@actions/core")
jest.mock("./parsePullRequest")
jest.mock("./postComments")

const pullRequestEvents = (webhooks.find((v) => v.name === "pull_request")
  ?.examples ?? []) as PullRequestEvent[]

const title = "title"
const issueKey = "issueKey"

describe.each(pullRequestEvents)("index", (event) => {
  const getConfigs = (configs?: Partial<PrProps>): PrProps => ({
    event,
    projectKey: "projectKey",
    apiHost: "apiHost",
    apiKey: "apiKey",
    fixKeywords: ["fixKeyword"],
    closeKeywords: ["closeKeyword"],
    fixStatusId: "fixStatusId",
    closeStatusId: "closeStatusId",
    prOpenedCommentTemplate: "prOpenedCommentTemplate",
    prReopenedCommentTemplate: "prReopenedCommentTemplate",
    prReadyForReviewCommentTemplate: "prReadyForReviewCommentTemplate",
    prClosedCommentTemplate: "prClosedCommentTemplate",
    prMergedCommentTemplate: "prMergedCommentTemplate",
    prTitleRegTemplate: "prTitleRegTemplate",
    ...configs,
  })

  const getParsedPullRequest = (
    parsedPullRequest?: Partial<ParsedPullRequest>,
  ): ParsedPullRequest => ({
    pr: event.pull_request,
    action: event.action,
    sender: event.sender,
    issueKey,
    title,
    keywords: "keywords",
    isFix: false,
    isClose: false,
    ...parsedPullRequest,
  })

  const getResponse = (response?: Partial<Response>): Response => ({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
    request: {},
    ...response,
  })

  beforeEach(() => {
    mocked(info).mockImplementation((m) => m)
    mocked(setFailed).mockImplementation((m) => m)
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest(),
    }))
    mocked(postComments).mockImplementation(() =>
      Promise.resolve(getResponse()),
    )
  })

  test("resolve with the message", async () => {
    await expect(pr(getConfigs())).resolves.toStrictEqual(
      "正常に送信しました。",
    )

    expect(parsePullRequest).toHaveBeenCalledTimes(1)
    expect(postComments).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(title)
  })

  test("resolve with the message when pr title with fix_keyword", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest({ isFix: true }),
    }))

    await expect(pr(getConfigs())).resolves.toStrictEqual(
      "正常に送信しました。",
    )

    expect(parsePullRequest).toHaveBeenCalledTimes(1)
    expect(postComments).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledWith(title)
    expect(info).toHaveBeenCalledWith(`${issueKey}を処理済みにしました。`)
  })

  test("resolve with the message when pr title with close_keyword", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: getParsedPullRequest({ isClose: true }),
    }))

    await expect(pr(getConfigs())).resolves.toStrictEqual(
      "正常に送信しました。",
    )

    expect(parsePullRequest).toHaveBeenCalledTimes(1)
    expect(postComments).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(2)
    expect(info).toHaveBeenCalledWith(title)
    expect(info).toHaveBeenCalledWith(`${issueKey}を完了にしました。`)
  })

  test("not continue and resolve processing when pr title without issueKey", async () => {
    mocked(postComments).mockImplementation(() => Promise.resolve("string"))

    await expect(pr(getConfigs())).resolves.toStrictEqual("string")

    expect(parsePullRequest).toHaveBeenCalledTimes(1)
    expect(postComments).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(0)
  })

  test("not continue and resolve processing when pr title without issueKey", async () => {
    mocked(parsePullRequest).mockImplementation(() => ({
      parsedPullRequest: null,
    }))

    await expect(pr(getConfigs())).resolves.toStrictEqual(
      "課題キーのついたプルリクエストが見つかりませんでした。",
    )

    expect(parsePullRequest).toHaveBeenCalledTimes(1)
    expect(postComments).toHaveBeenCalledTimes(0)
    expect(info).toHaveBeenCalledTimes(0)
  })
})
