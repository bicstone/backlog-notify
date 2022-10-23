import * as core from "@actions/core"
import { fetchEvent } from "./main/fetchEvent"
import { getConfigs } from "./main/getConfigs"
import { push } from "./push"

const runAction = async (): Promise<string> => {
  core.startGroup(`Getting configs`)
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

  core.startGroup(`Fetching events`)
  const { event } = fetchEvent({ path: githubEventPath })
  core.endGroup()

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

  return "Skipped as there were no commits."
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
