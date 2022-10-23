import * as core from "@actions/core"
import { PushEvent } from "@octokit/webhooks-types"

import { parseCommits } from "./parseCommits"
import { parseRef } from "./parseRef"
import { postComments } from "./postComments"

import type { Configs } from "../main/getConfigs"

export const push = async ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  commitMessageRegTemplate,
  pushCommentTemplate,
  fixStatusId,
  closeStatusId,
  apiHost,
  apiKey,
}: Pick<
  Configs,
  | "projectKey"
  | "fixKeywords"
  | "closeKeywords"
  | "commitMessageRegTemplate"
  | "pushCommentTemplate"
  | "fixStatusId"
  | "closeStatusId"
  | "apiHost"
  | "apiKey"
> & { event: PushEvent }): Promise<string> => {
  core.startGroup(`コミット取得中`)
  const { parsedCommits } = parseCommits({
    commits: event.commits,
    projectKey,
    fixKeywords,
    closeKeywords,
    commitMessageRegTemplate,
  })
  if (!parsedCommits) {
    return "課題キーのついたコミットが1件も見つかりませんでした。"
  }
  core.endGroup()

  core.startGroup(`Push先の確認中`)
  const parsedRef = parseRef(event.ref, event.repository.html_url)
  if (!parsedRef) {
    return "Git referenceの解析に失敗しました。"
  }
  core.endGroup()

  core.startGroup(`コメント送信中`)
  await postComments({
    parsedCommits,
    parsedRef,
    pushCommentTemplate,
    fixStatusId,
    closeStatusId,
    apiHost,
    apiKey,
  }).then((data) => {
    data.forEach(({ commits, issueKey, isFix, isClose }) => {
      core.startGroup(`${commits[0].issueKey}:`)

      commits.forEach(({ message }) => {
        core.info(message)
      })

      if (isFix) {
        core.info(`${issueKey}を処理済みにしました。`)
      }

      if (isClose) {
        core.info(`${issueKey}を完了にしました。`)
      }

      core.endGroup()
    })
  })
  core.endGroup()

  return "正常に送信しました。"
}
