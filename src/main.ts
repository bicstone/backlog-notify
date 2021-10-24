import * as core from "@actions/core"
import { fetchEvent } from "./fetchEvent"
import { getConfigs } from "./getConfigs"
import { parseCommits } from "./parseCommits"
import { postComments } from "./postComments"

export const main = async (): Promise<string> => {
  // init
  core.startGroup(`初期化中`)
  const { projectKey, apiHost, apiKey, githubEventPath } = getConfigs()
  core.endGroup()

  // fetch event
  core.startGroup(`コミット取得中`)
  const { event } = fetchEvent({ path: githubEventPath })
  if (!event?.commits?.length) {
    return Promise.resolve("コミットが1件も見つかりませんでした。")
  }

  // parse commits
  const parsedCommits = parseCommits(event.commits, projectKey)
  if (!parsedCommits) {
    return Promise.resolve(
      "課題キーのついたコミットが1件も見つかりませんでした。"
    )
  }
  core.endGroup()

  // post comments
  core.startGroup(`コメント送信中`)
  await postComments(parsedCommits, apiHost, apiKey).then((data) => {
    data.forEach(({ commits, issueKey, isFix, isClose }) => {
      core.startGroup(`${commits[0].issue_key}:`)

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
  return Promise.resolve("正常に送信しました。")
}

main()
  .then((message) => {
    core.info(message)
    core.endGroup()
  })
  .catch((error: Error) => {
    core.debug(error.stack || "No error stack trace")
    core.setFailed(error.message)
    core.endGroup()
  })
