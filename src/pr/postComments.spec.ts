/* eslint-disable @typescript-eslint/naming-convention */
import url from "url"
import axios from "axios"
import { postComments, PostCommentsProps, Response } from "./postComments"
import { ParsedPullRequest } from "./parsePullRequest"
import { PullRequestEvent } from "@octokit/webhooks-types"
import webhooks from "@octokit/webhooks-examples"

jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

const login = "login"
const html_url = "html_url"
const fixStatusId = "fixStatusId"
const closeStatusId = "closeStatusId"
const apiHost = "apiHost"
const apiKey = "apiKey"
const projectKey = "projectKey"
const issueKey = `${projectKey}-1`
const title = "title"
const prOpenedCommentTemplate =
  "opened,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prReopenedCommentTemplate =
  "reopened,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prReadyForReviewCommentTemplate =
  "ready_for_review,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prClosedCommentTemplate =
  "closed,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prMergedCommentTemplate =
  "merged,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`
const statusText = "OK"

const events = (webhooks.find((v) => v.name === "pull_request")?.examples ??
  []) as PullRequestEvent[]

const openedEvents =
  events.filter(
    (v) =>
      v.action === "opened" ||
      v.action === "reopened" ||
      v.action === "ready_for_review",
  ) ?? []

const closedEvents = events.filter((v) => v.action === "closed") ?? []

const unexpectedEvents =
  events.filter(
    (v) =>
      v.action !== "opened" &&
      v.action !== "reopened" &&
      v.action !== "ready_for_review" &&
      v.action !== "closed",
  ) ?? []

const getEvent = <T extends PullRequestEvent>(event: T): T => ({
  ...event,
  pull_request: {
    ...event.pull_request,
    title,
    html_url,
  },
  sender: {
    ...event.sender,
    login,
  },
})

const getParsedPullRequest = (
  event: PullRequestEvent,
  parsedPullRequest?: Partial<ParsedPullRequest>,
): ParsedPullRequest => {
  return {
    pr: event.pull_request,
    action: event.action,
    sender: event.sender,
    issueKey,
    title,
    keywords: "",
    isFix: false,
    isClose: false,
    ...parsedPullRequest,
  }
}

const getConfigs = (
  parsedPullRequest: ParsedPullRequest,
  configs?: Partial<PostCommentsProps>,
): PostCommentsProps => ({
  parsedPullRequest,
  fixStatusId,
  closeStatusId,
  prOpenedCommentTemplate,
  prReopenedCommentTemplate,
  prReadyForReviewCommentTemplate,
  prClosedCommentTemplate,
  prMergedCommentTemplate,
  apiHost,
  apiKey,
  ...configs,
})

const getResponse = (response?: Partial<Response>): Response => ({
  data: {},
  status: 200,
  statusText,
  headers: {},
  config: {},
  request: {},
  ...response,
})

const getRequestParams = (comment: string, params?: Record<string, unknown>) =>
  new url.URLSearchParams({
    comment,
    ...params,
  }).toString()

describe("postComments", () => {
  beforeEach(() => {
    mockedAxios.patch.mockImplementation(() => Promise.resolve(getResponse()))
  })

  describe.each(openedEvents)(
    "opened, reopened, ready_for_review",
    (_event) => {
      const event = getEvent(_event)
      const comment = `${event.action},${login},${title},${html_url}`

      it("post a comment to Backlog API", async () => {
        const parsedPullRequest = getParsedPullRequest(event)
        const configs = getConfigs(parsedPullRequest)
        const result = await postComments(configs)

        expect(result.isSuccess).toEqual(true)
        expect(result.value).toEqual(statusText)
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment),
        )
      })
      it("post a comment only when change to fixed", async () => {
        const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
        const configs = getConfigs(parsedPullRequest)
        const result = await postComments(configs)

        expect(result.isSuccess).toEqual(true)
        expect(result.value).toEqual(statusText)
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment),
        )
      })
      it("post a comment only when change to close", async () => {
        const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
        const configs = getConfigs(parsedPullRequest)
        const result = await postComments(configs)

        expect(result.isSuccess).toEqual(true)
        expect(result.value).toEqual(statusText)
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment),
        )
      })
      it("not continue and return message if pr is draft", async () => {
        const event = getEvent({
          ..._event,
          pull_request: { ..._event.pull_request, draft: true },
        } as PullRequestEvent)
        const parsedPullRequest = getParsedPullRequest(event)
        const configs = getConfigs(parsedPullRequest)
        const result = await postComments(configs)

        expect(result.isSuccess).toEqual(false)
        expect(result.error).toEqual("プルリクエストが下書きでした。")

        expect(mockedAxios.patch).toHaveBeenCalledTimes(0)
      })
    },
  )

  describe.each(closedEvents)("merged", (_event) => {
    const event = getEvent({
      ..._event,
      pull_request: { ..._event.pull_request, merged: true },
    } as PullRequestEvent)
    const comment = `merged,${login},${title},${html_url}`

    it("post a comment to Backlog API", async () => {
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment),
      )
    })
    it("post a comment and change status when change to fixed", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: fixStatusId }),
      )
    })
    it("post a comment and change status when change to close", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: closeStatusId }),
      )
    })
    it("not continue and return message if pr is draft", async () => {
      const event = getEvent({
        ..._event,
        pull_request: { ..._event.pull_request, draft: true },
      } as PullRequestEvent)
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(false)
      expect(result.error).toEqual("プルリクエストが下書きでした。")

      expect(mockedAxios.patch).toHaveBeenCalledTimes(0)
    })
  })

  describe.each(closedEvents)("closed", (_event) => {
    const event = getEvent(_event)
    const comment = `closed,${login},${title},${html_url}`

    it("post a comment to Backlog API", async () => {
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment),
      )
    })
    it("post a comment only when change to fixed", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment),
      )
    })
    it("post a comment only when change to close", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(true)
      expect(result.value).toEqual(statusText)
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment),
      )
    })
    it("not continue and return message if pr is draft", async () => {
      const event = getEvent({
        ..._event,
        pull_request: { ..._event.pull_request, draft: true },
      } as PullRequestEvent)
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(false)
      expect(result.error).toEqual("プルリクエストが下書きでした。")

      expect(mockedAxios.patch).toHaveBeenCalledTimes(0)
    })
  })

  describe.each(unexpectedEvents)("unexpected", (_event) => {
    it("not continue and return message", async () => {
      const event = getEvent(_event)
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)
      const result = await postComments(configs)

      expect(result.isSuccess).toEqual(false)
      expect(result.error).toEqual("予期しないイベントでした。")

      expect(mockedAxios.patch).toHaveBeenCalledTimes(0)
    })
  })
})
