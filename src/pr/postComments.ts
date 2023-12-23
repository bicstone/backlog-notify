import { Result } from "result-type-ts"
import { URLSearchParams } from "url"
import template from "lodash.template"
import { ParsedPullRequest } from "./parsePullRequest"

// Update Issue API
// https://developer.nulab.com/docs/backlog/api/2/update-issue/
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>",
)

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

export const postComments = async ({
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
}: PostCommentsProps): Promise<Result<string, string>> => {
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
    return Result.failure("予期しないイベントでした。")
  }

  const draft = pr.draft
  if (draft) {
    return Result.failure("プルリクエストが下書きでした。")
  }

  const status = (() => {
    if (pr.merged && isFix) return { statusId: fixStatusId }
    if (pr.merged && isClose) return { statusId: closeStatusId }
    else return undefined
  })()
  const body = { comment, ...status }

  const fetchOptions: RequestInit = {
    method: "PATCH",
    body: new URLSearchParams(body),
  }

  const response = await fetch(endpoint, fetchOptions)

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  return Result.success(response.statusText)
}
