import { startGroup, endGroup, info, debug } from "@actions/core"
import { PullRequestEvent } from "@octokit/webhooks-types"

import type { Configs } from "../main/getConfigs"
import { parsePullRequest } from "./parsePullRequest"
import { postComments } from "./postComments"

type PrProps = Pick<
  Configs,
  | "projectKey"
  | "fixKeywords"
  | "closeKeywords"
  | "fixStatusId"
  | "closeStatusId"
  | "apiHost"
  | "apiKey"
  | "prOpenCommentTemplate"
  | "prReadyForReviewCommentTemplate"
  | "prCloseCommentTemplate"
  | "prMergedCommentTemplate"
  | "prTitleRegTemplate"
> & {
  event: PullRequestEvent
}

export const pr = async ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  fixStatusId,
  closeStatusId,
  apiHost,
  apiKey,
  prOpenCommentTemplate,
  prReadyForReviewCommentTemplate,
  prCloseCommentTemplate,
  prMergedCommentTemplate,
  prTitleRegTemplate,
}: PrProps): Promise<string> => {
  startGroup(`プルリクエストを取得中`)
  const { parsedPullRequest } = parsePullRequest({
    event,
    projectKey,
    fixKeywords,
    closeKeywords,
    prTitleRegTemplate,
  })
  if (!parsedPullRequest) {
    return "課題キーのついたプルリクエストが見つかりませんでした。"
  }
  endGroup()

  startGroup(`コメント送信中`)

  const response = await postComments({
    parsedPullRequest,
    fixStatusId,
    closeStatusId,
    prOpenCommentTemplate,
    prReadyForReviewCommentTemplate,
    prCloseCommentTemplate,
    prMergedCommentTemplate,
    apiHost,
    apiKey,
  })

  if (typeof response === "string") {
    return response
  }

  startGroup(`${parsedPullRequest.issueKey}:`)

  info(parsedPullRequest.title)

  if (parsedPullRequest.isFix) {
    info(`${parsedPullRequest.issueKey}を処理済みにしました。`)
  }

  if (parsedPullRequest.isClose) {
    info(`${parsedPullRequest.issueKey}を完了にしました。`)
  }

  debug(response.request.toString())
  debug(response.headers.toString())
  debug(response.data.toString())

  endGroup()

  endGroup()

  return "正常に送信しました。"
}
