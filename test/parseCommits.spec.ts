/* eslint-disable @typescript-eslint/naming-convention */
import { parseCommits, ParsedCommit, ParsedCommits } from "../src/parseCommits"
import { Commit } from "@octokit/webhooks-types"

type Commits = Commit[]

const projectKey = "BUNBUN_NINE9"
const fixKeyword = "#fix"
const fixKeywords = [fixKeyword]
const closeKeyword = "#close"
const closeKeywords = [closeKeyword]
const commitMessageRegTemplate =
  "^" +
  "(<%= projectKey %>\\-\\d+)\\s?" +
  "(.*?)?\\s?" +
  '(<% print(fixKeywords.join("|")) %>|<% print(closeKeywords.join("|")) %>)?' +
  "$"
const issue_key = `${projectKey}-1`
const comment = "Hare Hare Yukai!"

const baseCommit: Commit = {
  id: "id3456789012345",
  tree_id: "tree_id89012345",
  distinct: true,
  message: `${issue_key} ${comment}`,
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
  comment: comment,
  issue_key,
  keywords: "",
  is_fix: false,
  is_close: false,
}

describe("parseCommits", () => {
  test("parseCommits return a parsed commit", () => {
    const commits: Commits = [baseCommit]
    const parsedCommits: ParsedCommits = { [issue_key]: [baseParsedCommit] }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return parsed commits if same issue_key", () => {
    const commits: Commits = [baseCommit, baseCommit]
    const parsedCommits: ParsedCommits = {
      [issue_key]: [baseParsedCommit, baseParsedCommit],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return parsed commits if different issue_key", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${projectKey}-1 ${comment}`,
      },
      {
        ...baseCommit,
        message: `${projectKey}-2 ${comment}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [`${projectKey}-1`]: [
        {
          ...baseParsedCommit,
          message: `${projectKey}-1 ${comment}`,
          issue_key: `${projectKey}-1`,
        },
      ],
      [`${projectKey}-2`]: [
        {
          ...baseParsedCommit,
          message: `${projectKey}-2 ${comment}`,
          issue_key: `${projectKey}-2`,
        },
      ],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return a parsed commit with fix_keyword", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key} ${comment} ${fixKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: comment,
          keywords: fixKeyword,
          is_fix: true,
        },
      ],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return a parsed commit with close_keyword", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key} ${comment} ${closeKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: comment,
          keywords: closeKeyword,
          is_close: true,
        },
      ],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return a parsed commit with fix_keyword and close_keyword", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key} ${comment} ${fixKeyword} ${closeKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: `${comment} ${fixKeyword}`,
          keywords: closeKeyword,
          is_fix: false,
          is_close: true,
        },
      ],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return a parsed commit when message is only issue_key", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issue_key}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issue_key]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: "",
        },
      ],
    }

    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits,
    })
  })

  test("parseCommits return null when no commits", () => {
    const commits: Commits = []
    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits: null,
    })
  })

  test("parseCommits return null when issue_key is not specified", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: "BAMBOO DISCO",
      },
    ]
    expect(
      parseCommits({
        commits,
        projectKey,
        fixKeywords,
        closeKeywords,
        commitMessageRegTemplate,
      })
    ).toStrictEqual({
      parsedCommits: null,
    })
  })
})
