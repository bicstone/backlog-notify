import { PullRequest, PullRequestEvent, User } from "@octokit/webhooks-types"
import template from "lodash.template"

export type ParsedPullRequest = {
  pr: PullRequest
  action: PullRequestEvent["action"]
  sender: User
  issueKey: string
  title: string
  keywords: string
  isFix: boolean
  isClose: boolean
}

type ParsePullRequestProps = {
  event: PullRequestEvent
  projectKey: string
  fixKeywords: string[]
  closeKeywords: string[]
  // prOpenCommentTemplate: string
  // prReadyForReviewCommentTemplate: string
  // prCloseCommentTemplate: string
  // prMergedCommentTemplate: string
  prTitleRegTemplate: string
}

/**
 * Parse the pull request from the event
 */
export const parsePullRequest = ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  // prOpenCommentTemplate,
  // prReadyForReviewCommentTemplate,
  // prCloseCommentTemplate,
  // prMergedCommentTemplate,
  prTitleRegTemplate,
}: ParsePullRequestProps): { parsedPullRequest: ParsedPullRequest | null } => {
  const prTitleReg = RegExp(
    template(prTitleRegTemplate)({
      projectKey,
      fixKeywords,
      closeKeywords,
    }),
    "s"
  )

  const match = event.pull_request.title.match(prTitleReg)

  const [, issueKey = null, title = "", keywords = ""] = match ?? []

  if (!match || !issueKey) {
    return { parsedPullRequest: null }
  }

  return {
    parsedPullRequest: {
      pr: event.pull_request,
      action: event.action,
      sender: event.sender,
      issueKey,
      title,
      keywords,
      isFix: fixKeywords.includes(keywords),
      isClose: closeKeywords.includes(keywords),
    },
  }
}
