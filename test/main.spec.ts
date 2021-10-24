import { mocked } from "ts-jest/utils"
import { PushEvent } from "@octokit/webhooks-types"
import push from "./github/events/push.json"
import pushWithoutCommits from "./github/events/pushWithoutCommits.json"
import { AxiosResponse } from "axios"
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
        projectKey: "",
        apiHost: "",
        apiKey: "",
        githubEventPath: "",
      }
    })
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: push as PushEvent,
    }))
    mocked(parseCommits.parseCommits).mockImplementation(() => ({ parsedCommits: { key: [] } }))
  })

  test.todo("core.infoのスパイができない理由がわからない...")

  test("main resolve with the message", () => {
    const postCommentsResponse: postComments.Response = basePostCommentsResponse
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    expect(main()).resolves.toBe("正常に送信しました。")
  })

  test("main resolve with the message when commits with fix_keyword", () => {
    const postCommentsResponse: postComments.Response = {
      ...basePostCommentsResponse,
      isFix: true,
    }
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    expect(main()).resolves.toBe("正常に送信しました。")
  })

  test("main resolve with the message when commits with close_keyword", () => {
    const postCommentsResponse: postComments.Response = {
      ...basePostCommentsResponse,
      isClose: true,
    }
    mocked(postComments.postComments).mockImplementation(() =>
      Promise.resolve([postCommentsResponse])
    )
    expect(main()).resolves.toBe("正常に送信しました。")
  })

  test("main not continue and resolve processing when 0 commits", () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: pushWithoutCommits as PushEvent,
    }))
    expect(main()).resolves.toBe("コミットが1件も見つかりませんでした。")
  })

  test("main not continue and resolve processing when commits without issue_key", () => {
    mocked(fetchEvent.fetchEvent).mockImplementation(() => ({
      event: push as PushEvent,
    }))
    mocked(parseCommits.parseCommits).mockImplementation(() => ({ parsedCommits: null }))
    expect(main()).resolves.toBe(
      "課題キーのついたコミットが1件も見つかりませんでした。"
    )
  })
})
