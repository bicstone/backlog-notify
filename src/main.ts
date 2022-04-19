import * as core from "@actions/core"
import { fetchEvent } from "./fetchEvent"
import { getConfigs } from "./getConfigs"
import { parseCommits } from "./parseCommits"
import { parseRef } from "./parseRef"
import { postComments } from "./postComments"

const runAction = async (): Promise<string> => {
  // init
  core.startGroup(`初期化中`)
  const {
    projectKey,
    apiHost,
    apiKey,
    githubEventPath,
    fixKeywords,
    closeKeywords,
    pushCommentTemplate,
    commitMessageRegTemplate,
    fixStatusId,
    closeStatusId,
  } = getConfigs()
  core.endGroup()

  // fetch event
  core.startGroup(`コミット取得中`)
  const { event } = fetchEvent({ path: githubEventPath })
  if (!event?.commits?.length) {
    return "コミットが1件も見つかりませんでした。"
  }

  // parse commits
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

  // parse ref, repository
  core.startGroup(`Push先の確認中`)
  const parsedRef = parseRef(event.ref, event.repository.html_url)
  if (!parsedRef) {
    return "Git referenceの解析に失敗しました。"
  }
  core.endGroup()

  // post comments
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
  return "正常に送信しました。"
}

export const main = async (): Promise<void> => {
  try {
    const message = await runAction()
    core.info(message)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error)
    } else {
      core.setFailed(String(error))
    }
  }
  core.endGroup()
}

main()
