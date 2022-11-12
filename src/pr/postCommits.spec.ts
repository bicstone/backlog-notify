/* eslint-disable @typescript-eslint/naming-convention */
import url from "url"
import axios from "axios"
import { postComments, PostCommentsProps, Response } from "./postComments"
import { ParsedPullRequest } from "./parsePullRequest"
import {
  PullRequestClosedEvent,
  PullRequestEvent,
} from "@octokit/webhooks-types"
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
const prOpenCommentTemplate =
  "prOpened,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prReadyForReviewCommentTemplate =
  "prReadyForReview,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prCloseCommentTemplate =
  "prClosed,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const prMergedCommentTemplate =
  "prMerged,<%= sender.login %>,<%= title %>,<%= pr.html_url %>"
const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`

const events = (webhooks.find((v) => v.name === "pull_request")?.examples ??
  []) as PullRequestEvent[]

const openedEvents =
  events.filter((v) => v.action === "opened" || v.action === "reopened") ?? []

const readyForReviewEvents =
  events.filter((v) => v.action === "ready_for_review") ?? []

const closedEvents = (events.filter((v) => v.action === "closed") ??
  []) as PullRequestClosedEvent[]

const unexpectedEvents =
  events.filter(
    (v) =>
      v.action !== "opened" &&
      v.action !== "reopened" &&
      v.action !== "ready_for_review" &&
      v.action !== "closed"
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
  parsedPullRequest?: Partial<ParsedPullRequest>
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
  configs?: Partial<PostCommentsProps>
): PostCommentsProps => ({
  parsedPullRequest,
  fixStatusId,
  closeStatusId,
  prOpenCommentTemplate,
  prReadyForReviewCommentTemplate,
  prCloseCommentTemplate,
  prMergedCommentTemplate,
  apiHost,
  apiKey,
  ...configs,
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

const getRequestParams = (comment: string, params?: Record<string, unknown>) =>
  new url.URLSearchParams({
    comment,
    ...params,
  }).toString()

describe("postComments", () => {
  beforeEach(() => {
    mockedAxios.patch.mockImplementation(() => Promise.resolve(getResponse()))
  })

  describe.each(openedEvents)("opened, reopened", (openedEvent) => {
    const event = getEvent(openedEvent)
    const comment = `prOpened,${login},${title},${html_url}`

    test("postCommits post a comment to Backlog API", () => {
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment)
      )
    })
    test("parseCommits post a comment and change status when change to fixed", () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: fixStatusId })
      )
    })
    test("parseCommits post a comment and change status when change to close", () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: closeStatusId })
      )
    })
  })

  describe.each(readyForReviewEvents)(
    "ready_for_review",
    (readyForReviewEvent) => {
      const event = getEvent(readyForReviewEvent)
      const comment = `prReadyForReview,${login},${title},${html_url}`

      test("postCommits post a comment to Backlog API", () => {
        const parsedPullRequest = getParsedPullRequest(event)
        const configs = getConfigs(parsedPullRequest)

        expect(postComments(configs)).resolves.toStrictEqual(getResponse())
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment)
        )
      })
      test("parseCommits post a comment and change status when change to fixed", () => {
        const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
        const configs = getConfigs(parsedPullRequest)

        expect(postComments(configs)).resolves.toStrictEqual(getResponse())
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment, { statusId: fixStatusId })
        )
      })
      test("parseCommits post a comment and change status when change to close", () => {
        const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
        const configs = getConfigs(parsedPullRequest)

        expect(postComments(configs)).resolves.toStrictEqual(getResponse())
        expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          endpoint,
          getRequestParams(comment, { statusId: closeStatusId })
        )
      })
    }
  )

  describe.each(closedEvents)("merged", (closedEvent) => {
    const event = getEvent({
      ...closedEvent,
      pull_request: { ...closedEvent.pull_request, merged: true },
    })
    const comment = `prMerged,${login},${title},${html_url}`

    test("postCommits post a comment to Backlog API", () => {
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment)
      )
    })
    test("parseCommits post a comment and change status when change to fixed", () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: fixStatusId })
      )
    })
    test("parseCommits post a comment and change status when change to close", () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: closeStatusId })
      )
    })
  })

  describe.each(closedEvents)("closed", (closedEvent) => {
    const event = getEvent(closedEvent)
    const comment = `prClosed,${login},${title},${html_url}`

    test("postCommits post a comment to Backlog API", () => {
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment)
      )
    })
    test("parseCommits post a comment and change status when change to fixed", () => {
      const event = getEvent(closedEvent)
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: fixStatusId })
      )
    })
    test("parseCommits post a comment and change status when change to close", () => {
      const event = getEvent(closedEvent)
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true })
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(getResponse())
      expect(mockedAxios.patch).toHaveBeenCalledTimes(1)
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        endpoint,
        getRequestParams(comment, { statusId: closeStatusId })
      )
    })
  })

  describe.each(unexpectedEvents)("unexpected", (unexpectedEvent) => {
    test("postCommits post a comment to Backlog API", () => {
      const event = getEvent(unexpectedEvent)
      const parsedPullRequest = getParsedPullRequest(event)
      const configs = getConfigs(parsedPullRequest)

      expect(postComments(configs)).resolves.toStrictEqual(
        "予期しないイベントでした。"
      )
      expect(mockedAxios.patch).toHaveBeenCalledTimes(0)
    })
  })
})
