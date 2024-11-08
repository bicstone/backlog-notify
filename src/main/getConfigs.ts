export interface Configs {
  projectKey: string;
  apiHost: string;
  apiKey: string;
  githubEventPath: string;
  fixKeywords: string[];
  closeKeywords: string[];
  pushCommentTemplate: string;
  prOpenedCommentTemplate: string;
  prReopenedCommentTemplate: string;
  prReadyForReviewCommentTemplate: string;
  prClosedCommentTemplate: string;
  prMergedCommentTemplate: string;
  commitMessageRegTemplate: string;
  prTitleRegTemplate: string;
  fixStatusId: string;
  closeStatusId: string;
}

export type RequiredConfigKeys =
  | "projectKey"
  | "apiHost"
  | "apiKey"
  | "githubEventPath";

export const defaultConfigs: Omit<Configs, RequiredConfigKeys> = {
  fixKeywords: ["#fix", "#fixes", "#fixed"],
  closeKeywords: ["#close", "#closes", "#closed"],
  pushCommentTemplate:
    "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
    "\n" +
    "<% commits.forEach(commit=>{ %>" +
    "\n" +
    "+ [<%= commit.comment %>](<%= commit.url %>) (<% print(commit.id.slice(0, 7)) %>)" +
    "<% }); %>",
  prOpenedCommentTemplate:
    "<%= sender.login %>さんがプルリクエストを作成しました" +
    "\n\n" +
    "+ [<%= title %>](<%= pr.html_url %>) (#<%= pr.number %>)",
  prReopenedCommentTemplate:
    "<%= sender.login %>さんがプルリクエストを作成しました" +
    "\n\n" +
    "+ [<%= title %>](<%= pr.html_url %>) (#<%= pr.number %>)",
  prReadyForReviewCommentTemplate:
    "<%= sender.login %>さんがプルリクエストを作成しました" +
    "\n\n" +
    "+ [<%= title %>](<%= pr.html_url %>) (#<%= pr.number %>)",
  prClosedCommentTemplate:
    "<%= sender.login %>さんがプルリクエストをクローズしました" +
    "\n\n" +
    "+ [<%= title %>](<%= pr.html_url %>) (#<%= pr.number %>)",
  prMergedCommentTemplate:
    "<%= sender.login %>さんがプルリクエストをマージしました" +
    "\n\n" +
    "+ [<%= title %>](<%= pr.html_url %>) (#<%= pr.number %>)",
  commitMessageRegTemplate:
    "^" +
    "(<%= projectKey %>\\-\\d+)\\s?" +
    "(.*?)?\\s?" +
    "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
    "$",
  prTitleRegTemplate:
    "^" +
    "(<%= projectKey %>\\-\\d+)\\s?" +
    "(.*?)?\\s?" +
    "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
    "$",
  fixStatusId: "3",
  closeStatusId: "4",
};

/**
 * Parses and validations the action configuration
 * @returns Parsed the action configuration
 * @throws {Error} Will throw an error if missing required input
 */

export const getConfigs = (): Configs => ({
  projectKey: getConfig("project_key", { required: true }),
  apiHost: getConfig("api_host", { required: true }),
  apiKey: getConfig("api_key", { required: true }),
  githubEventPath: getConfig("github_event_path", { required: true }),
  fixKeywords: getConfig("fix_keywords")
    ? getMultilineInput("fix_keywords")
    : defaultConfigs.fixKeywords,
  closeKeywords: getConfig("close_keywords")
    ? getMultilineInput("close_keywords")
    : defaultConfigs.closeKeywords,
  pushCommentTemplate:
    getConfig("push_comment_template") || defaultConfigs.pushCommentTemplate,
  prOpenedCommentTemplate:
    getConfig("pr_opened_comment_template") ||
    defaultConfigs.prOpenedCommentTemplate,
  prReopenedCommentTemplate:
    getConfig("pr_reopened_comment_template") ||
    defaultConfigs.prReopenedCommentTemplate,
  prReadyForReviewCommentTemplate:
    getConfig("pr_ready_for_review_comment_template") ||
    defaultConfigs.prReadyForReviewCommentTemplate,
  prClosedCommentTemplate:
    getConfig("pr_closed_comment_template") ||
    defaultConfigs.prClosedCommentTemplate,
  prMergedCommentTemplate:
    getConfig("pr_merged_comment_template") ||
    defaultConfigs.prMergedCommentTemplate,
  commitMessageRegTemplate:
    getConfig("commit_message_reg_template") ||
    defaultConfigs.commitMessageRegTemplate,
  prTitleRegTemplate:
    getConfig("pr_title_reg_template") || defaultConfigs.prTitleRegTemplate,
  fixStatusId: getConfig("fix_status_id") || defaultConfigs.fixStatusId,
  closeStatusId: getConfig("close_status_id") || defaultConfigs.closeStatusId,
});

interface InputOptions {
  required?: boolean;
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
  const key = name.toUpperCase();
  const input = process.env[`INPUT_${key}`];
  const env = process.env[key];
  const val: string = input || env || "";

  if (options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`);
  }

  return val.trim();
};

/**
 * Gets the values of an multiline input.
 * Each value is also trimmed.
 *
 * @param name Name of the input to get
 * @returns string[]
 *
 */
export function getMultilineInput(
  name: string,
  options: InputOptions = {},
): string[] {
  const inputs: string[] = getConfig(name, options)
    .split("\n")
    .filter((x) => x !== "");

  return inputs.map((input) => input.trim());
}
