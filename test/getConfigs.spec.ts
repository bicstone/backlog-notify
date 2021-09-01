import { getConfigs, Configs } from "../src/getConfigs"

const requiredEnvKeys = [
  "PROJECT_KEY",
  "API_HOST",
  "API_KEY",
  "GITHUB_EVENT_PATH",
] as const

const envKeys = [...requiredEnvKeys] as const

const value = "Bamboo Disco"

const configs = {
  projectKey: value,
  apiHost: value,
  apiKey: value,
  githubEventPath: value,
} as Configs

describe("getConfigs", () => {
  beforeEach(() => {
    envKeys.forEach((key) => {
      process.env[key] = `${value} `
      process.env[`INPUT_${key}`] = ` ${value}`
    })
  })

  test("getConfigs return trimmed configs", () => {
    expect(getConfigs()).toStrictEqual(configs)
  })

  test.each(requiredEnvKeys)(
    "getEnvs does not throw when %s is defined only by env",
    (key) => {
      process.env[`INPUT_${key}`] = ""
      expect(getConfigs()).toStrictEqual(configs)
    }
  )

  test.each(requiredEnvKeys)("getEnvs throw when %s is not defined", (key) => {
    process.env[key] = ""
    process.env[`INPUT_${key}`] = ""
    expect(() => getConfigs()).toThrow("Input required and not supplied")
  })

  test.todo("getEnvs does not throw when missing non-required input")
})
