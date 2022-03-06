/* eslint-disable @typescript-eslint/naming-convention */
import url from "url"
import axios, { AxiosResponse } from "axios"
import { mocked } from "jest-mock"
import { ParsedCommits } from "../src/parseCommits"
import { postComments, Response } from "../src/postComments"

jest.mock("axios")

const apiHost = "level5-judgelight-.backlog.com"
const apiKey = "GO1GO1maniac"

const projectKey = "BUNBUN_NINE9"
const issue_key = `${projectKey}-1`
const comment = "＼(ﾟヮﾟ)＞＼(ﾟヮﾟ)／＼(ﾟヮﾟ)／＜(ﾟヮ^)"

const baseCommit = {
  id: "id3456789012345",
  tree_id: "tree_id89012345",
  distinct: true,
  timestamp: "timestamp",
  url: "url",
  author: {
    name: "author.name",
    email: "author.email",
    username: "author.username",
  },
  committer: {
    name: "committer.name",
    email: "committer.email",
  },
  added: ["added"],
  removed: ["removed"],
  modified: ["modified"],
  message: `${issue_key} ${comment}`,
  comment,
  issue_key,
  keywords: "",
  is_fix: false,
  is_close: false,
}

const baseCommits: ParsedCommits = {
  [issue_key]: [baseCommit],
}

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: "OK",
  headers: {},
  config: {},
  request: {},
}

describe("postComments", () => {
  beforeEach(() => {
    mocked(axios.patch).mockImplementation(() => Promise.resolve(axiosResponse))
  })

  test("parseCommits post a comment to Backlog API", () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issue_key}?apiKey=${apiKey}`
    const parsedCommits: ParsedCommits = baseCommits
    const body = {
      comment:
        `${baseCommit.author.name}さんがプッシュしました` +
        "\n" +
        "\n" +
        `+ ${baseCommit.comment} ` +
        `([${baseCommit.id}](${baseCommit.url}))`,
    }
    const params = new url.URLSearchParams(body).toString()
    const response: Response = {
      response: axiosResponse,
      commits: parsedCommits[issue_key],
      issueKey: issue_key,
      isFix: false,
      isClose: false,
    }

    expect(
      postComments({ parsedCommits, apiHost, apiKey })
    ).resolves.toStrictEqual([response])
    expect(axios.patch).toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(1)
    expect(axios.patch).toHaveBeenCalledWith(endpoint, params)
  })

  test("parseCommits post a comment and change status when change to fixed", () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issue_key}?apiKey=${apiKey}`
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseCommit,
          message: `${issue_key} ${comment} #fixed`,
          keywords: "#fixed",
          is_fix: true,
        },
      ],
    }
    const body = {
      comment:
        `${baseCommit.author.name}さんがプッシュしました` +
        "\n" +
        "\n" +
        `+ ${baseCommit.comment} ` +
        `([${baseCommit.id}](${baseCommit.url}))`,
      statusId: "3",
    }
    const params = new url.URLSearchParams(body).toString()
    const response: Response = {
      response: axiosResponse,
      commits: parsedCommits[issue_key],
      issueKey: issue_key,
      isFix: true,
      isClose: false,
    }

    expect(
      postComments({ parsedCommits, apiHost, apiKey })
    ).resolves.toStrictEqual([response])
    expect(axios.patch).toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(1)
    expect(axios.patch).toHaveBeenCalledWith(endpoint, params)
  })

  test("parseCommits post a comment and change status when change to close", () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issue_key}?apiKey=${apiKey}`
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseCommit,
          message: `${issue_key} ${comment} #closed`,
          keywords: "#closed",
          is_close: true,
        },
      ],
    }
    const body = {
      comment:
        `${baseCommit.author.name}さんがプッシュしました` +
        "\n" +
        "\n" +
        `+ ${baseCommit.comment} ` +
        `([${baseCommit.id}](${baseCommit.url}))`,
      statusId: "4",
    }
    const params = new url.URLSearchParams(body).toString()
    const response: Response = {
      response: axiosResponse,
      commits: parsedCommits[issue_key],
      issueKey: issue_key,
      isFix: false,
      isClose: true,
    }

    expect(
      postComments({ parsedCommits, apiHost, apiKey })
    ).resolves.toStrictEqual([response])
    expect(axios.patch).toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(1)
    expect(axios.patch).toHaveBeenCalledWith(endpoint, params)
  })

  test("parseCommits post 2 comments to Backlog API when 2 issue_keys", () => {
    const parsedCommits: ParsedCommits = {
      [`${projectKey}-1`]: [
        {
          ...baseCommit,
          issue_key: `${projectKey}-1`,
          message: `${projectKey}-1 ${comment}`,
        },
      ],
      [`${projectKey}-2`]: [
        {
          ...baseCommit,
          issue_key: `${projectKey}-2`,
          message: `${projectKey}-2 ${comment}`,
        },
        {
          ...baseCommit,
          issue_key: `${projectKey}-2`,
          message: `${projectKey}-2 ${comment}`,
        },
      ],
    }
    const response1: Response = {
      response: axiosResponse,
      commits: parsedCommits[`${projectKey}-1`],
      issueKey: `${projectKey}-1`,
      isFix: false,
      isClose: false,
    }
    const response2: Response = {
      response: axiosResponse,
      commits: parsedCommits[`${projectKey}-2`],
      issueKey: `${projectKey}-2`,
      isFix: false,
      isClose: false,
    }

    expect(
      postComments({ parsedCommits, apiHost, apiKey })
    ).resolves.toStrictEqual([response1, response2])
    expect(axios.patch).toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(2)
  })
})
