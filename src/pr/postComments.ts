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

type PostCommentsProps = {
  parsedPullRequest: ParsedPullRequest
  fixStatusId: string
  closeStatusId: string
  prOpenCommentTemplate: string
  prReadyForReviewCommentTemplate: string
  prCloseCommentTemplate: string
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
  prOpenCommentTemplate,
  prReadyForReviewCommentTemplate,
  prCloseCommentTemplate,
  prMergedCommentTemplate,
  apiHost,
  apiKey,
}: PostCommentsProps): Promise<Response | string> => {
  const { issueKey, isFix, isClose } = parsedPullRequest

  const endpoint = updateIssueApiUrlTemplate({
    apiHost,
    apiKey,
    issueKey,
  })

  const comment = (() => {
    switch (parsedPullRequest.action) {
      case "opened":
        return template(prOpenCommentTemplate)(parsedPullRequest)
      case "ready_for_review":
        return template(prReadyForReviewCommentTemplate)(parsedPullRequest)
      case "closed":
        if (parsedPullRequest.pr.merged) {
          return template(prMergedCommentTemplate)(parsedPullRequest)
        } else {
          return template(prCloseCommentTemplate)(parsedPullRequest)
        }
      default:
        return undefined
    }
  })()

  if (!comment) {
    return Promise.resolve("予期しないイベントでした。")
  }

  const status = (() => {
    if (isFix) return { statusId: fixStatusId }
    if (isClose) return { statusId: closeStatusId }
    else return undefined
  })()
  const body = { comment, ...status }

  return axios
    .patch(endpoint, new URLSearchParams(body).toString())
    .then((response) => {
      return response
    })
}
