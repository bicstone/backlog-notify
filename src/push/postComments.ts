import { URLSearchParams } from "url"
import axios, { AxiosResponse } from "axios"
import template from "lodash.template"
import { ParsedCommits, ParsedCommit } from "./parseCommits"
import { ParsedRef } from "./parseRef"

// Update Issue API
// https://developer.nulab.com/docs/backlog/api/2/update-issue/#
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>",
)

export type Response = {
  response: AxiosResponse<Record<string, unknown>>
  commits: ParsedCommit[]
  issueKey: string
  isFix: boolean
  isClose: boolean
}

type PostCommentsProps = {
  parsedCommits: ParsedCommits
  parsedRef: ParsedRef
  fixStatusId: string
  closeStatusId: string
  pushCommentTemplate: string
  apiHost: string
  apiKey: string
}

/**
 * Post the comment to Backlog API
 * @param parsedCommits parsed Commits (create by parseCommits.ts)
 * @param parsedRef parsed ref (create by parseRef.ts)
 * @param fixStatusId Status ID to mark as fixed
 * @param closeStatusIdStatus ID to mark as closed
 * @param pushCommentTemplate The template for backlog issue comment on push events
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns Patch comment request promises
 */

export const postComments = ({
  parsedCommits,
  parsedRef,
  ...configs
}: PostCommentsProps): Promise<Response[]> => {
  const promiseArray: Promise<Response>[] = []

  for (const [issueKey, commits] of Object.entries(parsedCommits)) {
    promiseArray.push(
      createPatchCommentRequest({
        commits,
        issueKey,
        ref: parsedRef,
        ...configs,
      }),
    )
  }

  return Promise.all(promiseArray)
}

type CreatePatchCommentRequestProps = {
  commits: ParsedCommit[]
  ref: ParsedRef
  issueKey: string
  fixStatusId: string
  closeStatusId: string
  pushCommentTemplate: string
  apiHost: string
  apiKey: string
}

const createPatchCommentRequest = ({
  commits,
  ref,
  issueKey,
  fixStatusId,
  closeStatusId,
  pushCommentTemplate,
  apiHost,
  apiKey,
}: CreatePatchCommentRequestProps): Promise<Response> => {
  const endpoint = updateIssueApiUrlTemplate({
    apiHost: apiHost,
    apiKey: apiKey,
    issueKey,
  })

  const comment = template(pushCommentTemplate)({ commits, ref })
  const isFix = commits.map((commit) => commit.isFix).includes(true)
  const isClose = commits.map((commit) => commit.isClose).includes(true)
  const status = (() => {
    if (isFix) return { statusId: fixStatusId }
    if (isClose) return { statusId: closeStatusId }
    else return undefined
  })()
  const body = { comment, ...status }

  return axios
    .patch(endpoint, new URLSearchParams(body).toString())
    .then((response) => {
      return { response, commits, issueKey, isFix, isClose }
    })
}
