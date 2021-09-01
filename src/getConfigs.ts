export type Configs = {
  projectKey: string
  apiHost: string
  apiKey: string
  githubEventPath: string
}

/**
 * Parses and validations the action configuration
 * @returns Parsed the action configuration
 * @throws {Error} Will throw an error if missing required input
 */

export const getConfigs = (): Configs => {
  const configs = {
    projectKey: getConfig("project_key", { required: true }),
    apiHost: getConfig("api_host", { required: true }),
    apiKey: getConfig("api_key", { required: true }),
    githubEventPath: getConfig("github_event_path", { required: true }),
  }

  return configs
}

type InputOptions = {
  required?: boolean
}

/**
 * First gets the value of the action configuration. If not defined,
 * gets the value of the environment variable. If not defined,
 * returns an empty string.
 *
 * @param name Name of the input or env to get
 * @param options See InputOptions type
 * @returns Trimmed value
 */

const getConfig = (name: string, options: InputOptions = {}): string => {
  const key = name.toUpperCase()
  const input = process.env[`INPUT_${key}`]
  const env = process.env[key]
  const val: string = input || env || ""

  if (options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }

  return val.trim()
}
