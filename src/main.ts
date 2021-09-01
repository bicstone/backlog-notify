import core from "@actions/core"
import { getConfigs } from "./getConfigs"
import { fetchEvent } from "./fetchEvent"
import { parseCommits } from "./parseCommits"
import { postComments } from "./postComments"

const main = async (): Promise<void> => {
  core.startGroup(`初期化中`)
  const { projectKey, apiHost, apiKey, githubEventPath } = getConfigs()
  core.endGroup()

  core.startGroup(`コミット取得中`)
  const event = fetchEvent(githubEventPath)
  if (!event?.commits?.length) {
    core.info("コミットが1件も見つかりませんでした。")
    return Promise.resolve()
  }

  const parsedCommits = parseCommits(event.commits, projectKey)
  if (!parsedCommits) {
    core.info("課題キーのついたコミットが1件も見つかりませんでした。")
    return Promise.resolve()
  }
  core.endGroup()

  core.startGroup(`コミット取得中`)
  await postComments(parsedCommits, apiHost, apiKey)
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
