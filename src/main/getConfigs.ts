import { getInput, getMultilineInput } from "@actions/core"

export type Configs = {
  projectKey: string
  apiHost: string
  apiKey: string
  githubEventPath: string
  fixKeywords: string[]
  closeKeywords: string[]
  pushCommentTemplate: string
  prOpenCommentTemplate: string
  prReadyForReviewCommentTemplate: string
  prCloseCommentTemplate: string
  prMergedCommentTemplate: string
  commitMessageRegTemplate: string
  prTitleRegTemplate: string
  fixStatusId: string
  closeStatusId: string
}

/**
 * Parses and validations the action configuration
 * @returns Parsed the action configuration
 * @throws {Error} Will throw an error if missing required input
 */

export const getConfigs = (): Configs => {
  return {
    projectKey: getConfig("project_key", { required: true }),
    apiHost: getConfig("api_host", { required: true }),
    apiKey: getConfig("api_key", { required: true }),
    githubEventPath: getConfig("github_event_path", { required: true }),
    fixKeywords: getInput("fix_keywords")
      ? getMultilineInput("fix_keywords", {
          trimWhitespace: true,
        })
      : ["#fix", "#fixes", "#fixed"],
    closeKeywords: getInput("close_keywords")
      ? getMultilineInput("close_keywords", {
          trimWhitespace: true,
        })
      : ["#close", "#closes", "#closed"],
    pushCommentTemplate:
      getInput("push_comment_template") ||
      "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
    prOpenCommentTemplate:
      getInput("pr_open_comment_template") ||
      "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
    prReadyForReviewCommentTemplate:
      getInput("pr_ready_for_review_comment_template") ||
      "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
    prCloseCommentTemplate:
      getInput("pr_close_comment_template") ||
      "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
    prMergedCommentTemplate:
      getInput("pr_merged_comment_template") ||
      "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
        "\n" +
        "<% commits.forEach(commit=>{ %>" +
        "\n" +
        "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
        "<% }); %>",
    commitMessageRegTemplate:
      getInput("commit_message_reg_template") ||
      "^" +
        "(<%= projectKey %>\\-\\d+)\\s?" +
        "(.*?)?\\s?" +
        "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
        "$",
    prTitleRegTemplate:
      getInput("pr_title_reg_template") ||
      "^" +
        "(<%= projectKey %>\\-\\d+)\\s?" +
        "(.*?)?\\s?" +
        "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
        "$",
    fixStatusId: getInput("fix_status_id") || "3",
    closeStatusId: getInput("close_status_id") || "4",
  }
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
