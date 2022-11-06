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
    return "課題キーのついたプルリクエストではありませんでした。"
  }
  endGroup()

  startGroup(`コメント送信中`)
  await postComments({
    parsedPullRequest,
    fixStatusId,
    closeStatusId,
    prOpenCommentTemplate,
    prReadyForReviewCommentTemplate,
    prCloseCommentTemplate,
    prMergedCommentTemplate,
    apiHost,
    apiKey,
  }).then((data) => {
    if (typeof data === "string") {
      info(data)
      return
    }

    startGroup(`${data.issueKey}:`)

    info(data.parsedPullRequest.title)

    if (data.isFix) {
      info(`${data.issueKey}を処理済みにしました。`)
    }

    if (data.isClose) {
      info(`${data.issueKey}を完了にしました。`)
    }

    debug(data.response.request.toString())
    debug(data.response.headers.toString())
    debug(data.response.data.toString())

    endGroup()
  })
  endGroup()

  return "正常に送信しました。"
}
