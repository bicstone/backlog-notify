import { URLSearchParams } from "url"
import axios, { AxiosResponse } from "axios"
import template from "lodash.template"
import { ParsedPullRequest } from "./parsePullRequest"

// Update Issue API
// https://developer.nulab.com/docs/backlog/api/2/update-issue/
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>"
)

export type Response = AxiosResponse<Record<string, unknown>>

export type PostCommentsProps = {
  parsedPullRequest: ParsedPullRequest
  fixStatusId: string
  closeStatusId: string
  prOpenedCommentTemplate: string
  prReopenedCommentTemplate: string
  prReadyForReviewCommentTemplate: string
  prClosedCommentTemplate: string
  prMergedCommentTemplate: string
  apiHost: string
  apiKey: string
}

/**
 * Post the comment to Backlog API
 */

export const postComments = ({
  parsedPullRequest,
  fixStatusId,
  closeStatusId,
  prOpenedCommentTemplate,
  prReopenedCommentTemplate,
  prReadyForReviewCommentTemplate,
  prClosedCommentTemplate,
  prMergedCommentTemplate,
  apiHost,
  apiKey,
}: PostCommentsProps): Promise<Response | string> => {
  const { issueKey, isFix, isClose, action, pr } = parsedPullRequest

  const endpoint = updateIssueApiUrlTemplate({
    apiHost,
    apiKey,
    issueKey,
  })

  const comment = (() => {
    switch (action) {
      case "opened":
        return template(prOpenedCommentTemplate)(parsedPullRequest)
      case "reopened":
        return template(prReopenedCommentTemplate)(parsedPullRequest)
      case "ready_for_review":
        return template(prReadyForReviewCommentTemplate)(parsedPullRequest)
      case "closed":
        if (pr.merged) {
          return template(prMergedCommentTemplate)(parsedPullRequest)
        } else {
          return template(prClosedCommentTemplate)(parsedPullRequest)
        }
      default:
        return undefined
    }
  })()

  if (!comment) {
    return Promise.resolve("予期しないイベントでした。")
  }

  const draft = pr.draft
  if (draft) {
    return Promise.resolve("プルリクエストが下書きでした。")
  }

  const status = (() => {
    if (pr.merged && isFix) return { statusId: fixStatusId }
    if (pr.merged && isClose) return { statusId: closeStatusId }
    else return undefined
  })()
  const body = { comment, ...status }

  return axios
    .patch(endpoint, new URLSearchParams(body).toString())
    .then((response) => {
      return response
    })
}
