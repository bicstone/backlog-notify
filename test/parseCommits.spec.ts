/* eslint-disable @typescript-eslint/naming-convention */
import { parseCommits, ParsedCommit, ParsedCommits } from "../src/parseCommits"
import { Commit } from "@octokit/webhooks-types"

type Commits = Commit[]

const projectKey = "BUNBUN_NINE9"
const issue_key = `${projectKey}-1`
const message = "message"

const baseCommit: Commit = {
  id: "id3456789012345",
  tree_id: "tree_id89012345",
  distinct: true,
  message: `${issue_key} ${message}`,
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
}

const baseParsedCommit: ParsedCommit = {
  ...baseCommit,
  message,
  original_message: baseCommit.message,
  id_short: "id34567890",
  tree_id_short: "tree_id890",
  issue_key,
  keywords: "",
  is_fix: false,
  is_close: false,
}

describe("parseCommits", () => {
  test("parseCommits return a parsed commit", () => {
    const commits: Commits = [baseCommit]
    const parsedCommit: ParsedCommits = { [issue_key]: [baseParsedCommit] }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return parsed commits if same issue_key", () => {
    const commits: Commits = [baseCommit, baseCommit]
    const parsedCommit: ParsedCommits = {
      [issue_key]: [baseParsedCommit, baseParsedCommit],
    }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return parsed commits if different issue_key", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${projectKey}-1 ${message}`,
      },
      {
        ...baseCommit,
        message: `${projectKey}-2 ${message}`,
      },
    ]
    const parsedCommit: ParsedCommits = {
      [`${projectKey}-1`]: [
        {
          ...baseParsedCommit,
          issue_key: `${projectKey}-1`,
          original_message: commits[0].message,
        },
      ],
      [`${projectKey}-2`]: [
        {
          ...baseParsedCommit,
          issue_key: `${projectKey}-2`,
          original_message: commits[1].message,
        },
      ],
    }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return a parsed commit with fix_keyword", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key} ${message} #fix`,
      },
    ]
    const parsedCommit: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          original_message: commits[0].message,
          keywords: "#fix",
          is_fix: true,
        },
      ],
    }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return a parsed commit with close_keyword", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key} ${message} #close`,
      },
    ]
    const parsedCommit: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          original_message: commits[0].message,
          keywords: "#close",
          is_close: true,
        },
      ],
    }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return a parsed commit when message is only issue_key", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key}`,
      },
    ]
    const parsedCommit: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          original_message: commits[0].message,
          message: "",
        },
      ],
    }

    expect(parseCommits(commits, projectKey)).toStrictEqual(parsedCommit)
  })

  test("parseCommits return null when no commits", () => {
    expect(parseCommits([], projectKey)).toStrictEqual(null)
  })

  test("parseCommits return null when issue_key is not specified", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: "init commit",
      },
    ]
    expect(parseCommits(commits, projectKey)).toStrictEqual(null)
  })
})
