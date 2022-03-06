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
const issueKey = `${projectKey}-1`
const comment = "Hare Hare Yukai!"

const baseCommit: Commit = {
  id: "id3456789012345",
  tree_id: "tree_id89012345",
  distinct: true,
  message: `${issueKey} ${comment}`,
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
  issueKey,
  keywords: "",
  isFix: false,
  isClose: false,
}

describe("parseCommits", () => {
  test("parseCommits return a parsed commit", () => {
    const commits: Commits = [baseCommit]
    const parsedCommits: ParsedCommits = { [issueKey]: [baseParsedCommit] }

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

  test("parseCommits return parsed commits if same issueKey", () => {
    const commits: Commits = [baseCommit, baseCommit]
    const parsedCommits: ParsedCommits = {
      [issueKey]: [baseParsedCommit, baseParsedCommit],
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

  test("parseCommits return parsed commits if different issueKey", () => {
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
          issueKey: `${projectKey}-1`,
        },
      ],
      [`${projectKey}-2`]: [
        {
          ...baseParsedCommit,
          message: `${projectKey}-2 ${comment}`,
          issueKey: `${projectKey}-2`,
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
        message: `${issueKey} ${comment} ${fixKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: comment,
          keywords: fixKeyword,
          isFix: true,
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
        message: `${issueKey} ${comment} ${closeKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: comment,
          keywords: closeKeyword,
          isClose: true,
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
        message: `${issueKey} ${comment} ${fixKeyword} ${closeKeyword}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
        {
          ...baseParsedCommit,
          message: commits[0].message,
          comment: `${comment} ${fixKeyword}`,
          keywords: closeKeyword,
          isFix: false,
          isClose: true,
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

  test("parseCommits return a parsed commit when message is only issueKey", () => {
    const commits: Commits = [
      {
        ...baseCommit,
        message: `${issueKey}`,
      },
    ]
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
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

  test("parseCommits return null when issueKey is not specified", () => {
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
