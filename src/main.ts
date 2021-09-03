import core from "@actions/core"
import { getConfigs } from "./getConfigs"
import { fetchEvent } from "./fetchEvent"
import { parseCommits } from "./parseCommits"
import { postComments } from "./postComments"

const main = async (): Promise<void> => {
  // init
  core.startGroup(`初期化中`)
  const { projectKey, apiHost, apiKey, githubEventPath } = getConfigs()
  core.endGroup()

  // fetch event
  core.startGroup(`コミット取得中`)
  const event = fetchEvent(githubEventPath)
  if (!event?.commits?.length) {
    core.info("コミットが1件も見つかりませんでした。")
    return Promise.resolve()
  }

  // parse commits
  const parsedCommits = parseCommits(event.commits, projectKey)
  if (!parsedCommits) {
    core.info("課題キーのついたコミットが1件も見つかりませんでした。")
    return Promise.resolve()
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
  core.info("正常に送信しました。")
  return Promise.resolve()
}

main()
  .then(() => {
    core.endGroup()
  })
  .catch((error) => {
    core.debug(error.stack || "No error stack trace")
    core.setFailed(error.message)
    core.endGroup()
  })
