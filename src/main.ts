import { startGroup, endGroup, info, setFailed, debug } from "@actions/core"
import { fetchEvent } from "./main/fetchEvent"
import { getConfigs } from "./main/getConfigs"
import { pr } from "./pr"
import { push } from "./push"

const runAction = async (): Promise<string> => {
  startGroup(`設定を読み込み中`)
  const {
    projectKey,
    apiHost,
    apiKey,
    githubEventPath,
    fixKeywords,
    closeKeywords,
    pushCommentTemplate,
    prOpenedCommentTemplate,
    prReopenedCommentTemplate,
    prReadyForReviewCommentTemplate,
    prClosedCommentTemplate,
    prMergedCommentTemplate,
    commitMessageRegTemplate,
    prTitleRegTemplate,
    fixStatusId,
    closeStatusId,
  } = getConfigs()
  endGroup()

  startGroup(`イベントを読み込み中`)
  const { event } = fetchEvent({ path: githubEventPath })
  endGroup()

  debug(event.toString())

  if (event && "commits" in event && event.commits.length > 0) {
    return await push({
      event,
      projectKey,
      apiHost,
      apiKey,
      fixKeywords,
      closeKeywords,
      pushCommentTemplate,
      commitMessageRegTemplate,
      fixStatusId,
      closeStatusId,
    })
  }

  if (event && "pull_request" in event && "number" in event) {
    return await pr({
      event,
      projectKey,
      apiHost,
      apiKey,
      fixKeywords,
      closeKeywords,
      fixStatusId,
      closeStatusId,
      prOpenedCommentTemplate,
      prReopenedCommentTemplate,
      prReadyForReviewCommentTemplate,
      prClosedCommentTemplate,
      prMergedCommentTemplate,
      prTitleRegTemplate,
    })
  }

  return "予期しないイベントでした。"
}

export const main = async (): Promise<void> => {
  try {
    const message = await runAction()
    info(message)
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error)
    } else {
      setFailed(String(error))
    }
  }
  endGroup()
}

main()
