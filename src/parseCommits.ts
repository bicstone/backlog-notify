import { Commit } from "@octokit/webhooks-types"
import template from "lodash.template"

// 2.0でinput受け取りにする
const fixKeywords = ["#fix", "#fixes", "#fixed"] // 処理済みにするキーワード
const closeKeywords = ["#close", "#closes", "#closed"] // 完了にするキーワード
const commitKeywordRegexTemplate = template(
  "^(<%=project_key%>\\-\\d+)\\s?" + // 課題キー
    "(.*?)?" + // メッセージ
    `\\s?(${fixKeywords.join("|")}|${closeKeywords.join("|")})?$`
) // コミットメッセージを解析する正規表現テンプレート

export type ParsedCommits = Record<string, ParsedCommit[]>

export type ParsedCommit = {
  original_message: string
  id_short: string
  tree_id_short: string
  issue_key: string | null
  keywords: string
  is_fix: boolean
  is_close: boolean
} & Commit

/**
 * Parse commits from the event commits
 * @param commits commits from the event commits
 * @param projectKey Backlog project key
 * @returns ParsedCommits | null
 */
export const parseCommits = (
  commits: Commit[],
  projectKey: string
): ParsedCommits | null => {
  const parsedCommits: ParsedCommits = {}

  commits.forEach((commit) => {
    const parsedCommit = parseCommit(commit, projectKey)
    if (!parsedCommit?.issue_key) return

    if (parsedCommits[parsedCommit.issue_key]) {
      parsedCommits[parsedCommit.issue_key].push(parsedCommit)
    } else {
      parsedCommits[parsedCommit.issue_key] = [parsedCommit]
    }
  })

  const commitCount = Object.keys(parsedCommits).length
  if (commitCount === 0) {
    return null
  }

  return parsedCommits
}

/**
 * Parse commit from the event commit
 * @param commit commit from the event commit
 * @param projectKey Backlog project key
 * @returns ParsedCommit
 */
const parseCommit = (
  commit: Commit,
  projectKey: string
): ParsedCommit | null => {
  const match = commit.message.match(
    RegExp(commitKeywordRegexTemplate({ project_key: projectKey }), "s")
  )

  if (!match) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [, issue_key = null, message = "", keywords = ""] = match

  return {
    ...commit,
    message,
    original_message: commit.message,
    id_short: commit.id.slice(0, 10),
    tree_id_short: commit.tree_id.slice(0, 10),
    issue_key,
    keywords,
    is_fix: fixKeywords.includes(keywords),
    is_close: closeKeywords.includes(keywords),
  }
}
