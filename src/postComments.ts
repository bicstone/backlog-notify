import core from "@actions/core"
import template from "lodash.template"
import { ParsedCommits, ParsedCommit } from "../src/parseCommits"

// FIXME: 2.0でinput受け取りにする
const fixId = "3" // 処理済みの状態 ID
const closeId = "4" // 完了の状態 ID
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>"
) // 「課題情報の更新」APIのURLテンプレート
const commentTemplate = template(
  "<%=commits[0].author.name%>さんがプッシュしました\n" +
    "<% commits.forEach(commit=>{%>" +
    "\n+ <%=commit.message%> ([<%=commit.id_short%>](<%=commit.url%>))" +
    "<% }); %>"
) // 通知文章のテンプレート

/**
 * Post the comment to Backlog API
 * @param parsedCommits parsed Commits (create by parseCommits.ts)
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns Patch comment request promises
 */

export const postComments = (
  parsedCommits: ParsedCommits,
  apiHost: string,
  apiKey: string
): Promise<void[]> => {
  const promiseArray: Promise<void>[] = []

  for (const [key, value] of Object.entries(parsedCommits)) {
    promiseArray.push(createPatchCommentRequest(value, key, apiHost, apiKey))
  }

  return Promise.all(promiseArray)
}

/**
 * Create patch comment request promise
 * @param commits parsed commits
 * @param issueKey Backlog issue key
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns Patch comment request promise
 * @see https://developer.nulab.com/docs/backlog/api/2/update-issue/
 */
const createPatchCommentRequest = (
  commits: ParsedCommit[],
  issueKey: string,
  apiHost: string,
  apiKey: string
): Promise<void> => {
  const endpoint = updateIssueApiUrlTemplate({
    apiHost: apiHost,
    apiKey: apiKey,
    issueKey,
  })

  const comment = commentTemplate({ commits })

  const isFix = commits.map((commit) => commit.is_fix).includes(true)
  const isClose = commits.map((commit) => commit.is_close).includes(true)
  const status = (() => {
    if (isFix) return { statusId: fixId }
    if (isClose) return { statusId: closeId }
    else return undefined
  })()

  const body = {
    comment: comment,
    ...status,
  }
  const options = {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  }

  return fetch(endpoint, options).then(() => {
    core.info(`${issueKey}:\n${comment}`)
    isFix && core.info(`${issueKey}を処理済みにしました。`)
    isClose && core.info(`${issueKey}を完了にしました。`)
  })
}
