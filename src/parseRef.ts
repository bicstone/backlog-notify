import template from "lodash.template"

const refReg = /refs\/[a-z]*\/(.*)/
const refUrlTemplate = template("<%= repositoryHtmlUrl %>/tree/<%= name %>")

export type ParsedRef = {
  name: string
  url: string
}

/**
 * Parse tree name and url from the event ref and repository html url
 * @param ref The full git ref that was pushed. Example: `refs/heads/main` or `refs/tags/v3.14.1`.
 * @param repositoryHtmlUrl HTML URL of the repository.
 * @returns
 */
export const parseRef = (
  ref: string,
  repositoryHtmlUrl: string
): ParsedRef | undefined => {
  // e.g. Get name `feature/foo ` for ref `refs/heads/feature/foo`
  const name = ref.match(refReg)?.[1]
  if (!name) return

  const url = refUrlTemplate({ repositoryHtmlUrl, name })

  return { name, url }
}
