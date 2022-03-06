import { URLSearchParams } from "url"
import axios, { AxiosResponse } from "axios"
import template from "lodash.template"
import { ParsedCommits, ParsedCommit } from "../src/parseCommits"

// 2.0でinput受け取りにする
const fixId = "3" // 処理済みの状態 ID
const closeId = "4" // 完了の状態 ID
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>"
) // 「課題情報の更新」APIのURLテンプレート
const commentTemplate = template(
  "<%=commits[0].author.name%>さんがプッシュしました\n" +
    "<% commits.forEach(commit=>{%>" +
    "\n+ <%=commit.comment%> ([<%=commit.id%>](<%=commit.url%>))" +
    "<% }); %>"
) // 通知文章のテンプレート

export type Response = {
  response: AxiosResponse<Record<string, unknown>>
  commits: ParsedCommit[]
  issueKey: string
  isFix: boolean
  isClose: boolean
}

type PostCommentsProps = {
  parsedCommits: ParsedCommits
  apiHost: string
  apiKey: string
}

/**
 * Post the comment to Backlog API
 * @param parsedCommits parsed Commits (create by parseCommits.ts)
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns Patch comment request promises
 */

export const postComments = ({
  parsedCommits,
  ...configs
}: PostCommentsProps): Promise<Response[]> => {
  const promiseArray: Promise<Response>[] = []

  for (const [issueKey, commits] of Object.entries(parsedCommits)) {
    promiseArray.push(
      createPatchCommentRequest({ commits, issueKey, ...configs })
    )
  }

  return Promise.all(promiseArray)
}

type CreatePatchCommentRequestProps = {
  commits: ParsedCommit[]
  issueKey: string
  apiHost: string
  apiKey: string
}

/**
 * Create patch comment request promise
 * @param commits parsed commits
 * @param issueKey Backlog issue key
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns commits param (for use in console messages)
 * @see https://developer.nulab.com/docs/backlog/api/2/update-issue/
 */
const createPatchCommentRequest = ({
  commits,
  issueKey,
  apiHost,
  apiKey,
}: CreatePatchCommentRequestProps): Promise<Response> => {
  const endpoint = updateIssueApiUrlTemplate({
    apiHost: apiHost,
    apiKey: apiKey,
    issueKey,
  })

  const comment = commentTemplate({ commits })
  const isFix = commits.map((commit) => commit.isFix).includes(true)
  const isClose = commits.map((commit) => commit.isClose).includes(true)
  const status = (() => {
    if (isFix) return { statusId: fixId }
    if (isClose) return { statusId: closeId }
    else return undefined
  })()
  const body = { comment, ...status }

  return axios
    .patch(endpoint, new URLSearchParams(body).toString())
    .then((response) => {
      return { response, commits, issueKey, isFix, isClose }
    })
}
