/* eslint-disable @typescript-eslint/naming-convention */

import { getConfigs, Configs } from "../src/getConfigs"

const requiredEnv = {
  // whitespace added before and after the value
  PROJECT_KEY: "  projectKey  ",
  API_HOST: "apiHost",
  API_KEY: "apiKey",
  GITHUB_EVENT_PATH: "githubEventPath",
}

const optionalEnv = {
  // whitespace added before and after the value
  FIX_STATUS_ID: "  fixStatusId  ",
  CLOSE_STATUS_ID: "closeStatusId",
  // whitespace added before and after the value
  FIX_KEYWORDS: "  fixKeyword1  \n  fixKeyword2  ",
  CLOSE_KEYWORDS: "closeKeyword1\ncloseKeyword2",
  PUSH_COMMENT_TEMPLATE: "pushCommentTemplate",
  COMMIT_MESSAGE_REG_TEMPLATE: "commitMessageRegTemplate",
}

const configs = {
  projectKey: "projectKey",
  apiHost: "apiHost",
  apiKey: "apiKey",
  githubEventPath: "githubEventPath",
  fixKeywords: ["fixKeyword1", "fixKeyword2"],
  closeKeywords: ["closeKeyword1", "closeKeyword2"],
  pushCommentTemplate: "pushCommentTemplate",
  commitMessageRegTemplate: "commitMessageRegTemplate",
  fixStatusId: "fixStatusId",
  closeStatusId: "closeStatusId",
} as Configs

describe("getConfigs", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(requiredEnv)) {
      process.env[key] = `${value} `
      process.env[`INPUT_${key}`] = ` ${value}`
    }
    for (const [key, value] of Object.entries(optionalEnv)) {
      process.env[`INPUT_${key}`] = ` ${value}`
    }
  })

  test("getConfigs return trimmed configs", () => {
    expect(getConfigs()).toStrictEqual(configs)
  })

  test.each(Object.keys(requiredEnv))(
    "getConfigs does not throw when %s is defined only by env",
    (key) => {
      process.env[`INPUT_${key}`] = ""
      expect(getConfigs()).toStrictEqual(configs)
    }
  )

  test.each(Object.keys(requiredEnv))(
    "getConfigs throw when %s is not defined",
    (key) => {
      process.env[key] = ""
      process.env[`INPUT_${key}`] = ""
      expect(() => getConfigs()).toThrow("Input required and not supplied")
    }
  )

  test.each(Object.keys(optionalEnv))(
    "getConfigs does not throw when %s is not defined",
    (key) => {
      process.env[key] = ""
      process.env[`INPUT_${key}`] = ""
      expect(() => getConfigs()).not.toThrowError()
    }
  )

  test("getConfigs return configs for current version when we set configs as of version 2.x.x", () => {
    Object.keys(requiredEnv).forEach((key) => {
      process.env[`INPUT_${key}`] = ``
    })
    Object.keys(optionalEnv).forEach((key) => {
      process.env[`INPUT_${key}`] = ``
    })
    expect(getConfigs()).toStrictEqual({
      ...configs,
      // parseCommits.ts of version 2.x.x
      fixKeywords: ["#fix", "#fixes", "#fixed"],
      closeKeywords: ["#close", "#closes", "#closed"],
      // postComments.ts of version 2.x.x
      pushCommentTemplate:
        "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
      commitMessageRegTemplate:
        "^" +
        "(<%= projectKey %>\\-\\d+)\\s?" +
        "(.*?)?\\s?" +
        "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
        "$",
      fixStatusId: "3",
      closeStatusId: "4",
    })
  })
})
