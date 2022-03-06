import { Commit } from "@octokit/webhooks-types"
import template from "lodash.template"

export type ParsedCommits = Record<string, ParsedCommit[]>

export type ParsedCommit = {
  issue_key: string | null
  comment: string
  keywords: string
  is_fix: boolean
  is_close: boolean
} & Commit

type ParseCommitsProps = {
  commits: Commit[]
  projectKey: string
  fixKeywords: string[]
  closeKeywords: string[]
  commitMessageRegTemplate: string
}

/**
 * Parse commits from the event commits
 * @param commits commits from the event commits
 * @param projectKey Backlog project key
 * @param fixKeywords Keywords to change the status of the issue to fixed
 * @param closeKeywords Keywords to change the status of the issue to closed
 * @param commitMessageRegTemplate The template for regular expressions to parse commit messages
 * @returns ParsedCommits | null
 */
export const parseCommits = ({
  commits,
  projectKey,
  fixKeywords,
  closeKeywords,
  commitMessageRegTemplate,
}: ParseCommitsProps): { parsedCommits: ParsedCommits | null } => {
  const parsedCommits: ParsedCommits = {}
  const commitMessageReg = RegExp(
    template(commitMessageRegTemplate)({
      projectKey,
      fixKeywords,
      closeKeywords,
    }),
    "s"
  )

  commits.forEach((commit) => {
    const { parsedCommit } = parseCommit({
      commit,
      fixKeywords,
      closeKeywords,
      commitMessageReg,
    })
    if (!parsedCommit?.issue_key) return

    if (parsedCommits[parsedCommit.issue_key]) {
      parsedCommits[parsedCommit.issue_key].push(parsedCommit)
    } else {
      parsedCommits[parsedCommit.issue_key] = [parsedCommit]
    }
  })

  const commitCount = Object.keys(parsedCommits).length
  if (commitCount === 0) {
    return { parsedCommits: null }
  }

  return { parsedCommits }
}

type ParseCommitProps = {
  commit: Commit
  fixKeywords: string[]
  closeKeywords: string[]
  commitMessageReg: RegExp
}

const parseCommit = ({
  commit,
  fixKeywords,
  closeKeywords,
  commitMessageReg,
}: ParseCommitProps): { parsedCommit: ParsedCommit | null } => {
  const match = commit.message.match(commitMessageReg)

  if (!match) {
    return { parsedCommit: null }
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [, issue_key = null, comment = "", keywords = ""] = match

  return {
    parsedCommit: {
      ...commit,
      issue_key,
      comment,
      keywords,
      is_fix: fixKeywords.includes(keywords),
      is_close: closeKeywords.includes(keywords),
    },
  }
}
