import {
  getConfigs,
  type Configs,
  defaultConfigs,
  type RequiredConfigKeys,
} from "./getConfigs";

const requiredEnv = {
  // whitespace added before and after the value
  PROJECT_KEY: "  projectKey  ",
  API_HOST: "apiHost",
  API_KEY: "apiKey",
  GITHUB_EVENT_PATH: "githubEventPath",
};

const optionalEnv = {
  // whitespace added before and after the value
  FIX_STATUS_ID: "  fixStatusId  ",
  CLOSE_STATUS_ID: "closeStatusId",
  // whitespace added before and after the value
  FIX_KEYWORDS: "  fixKeyword1  \n  fixKeyword2  ",
  CLOSE_KEYWORDS: "closeKeyword1\ncloseKeyword2",
  PUSH_COMMENT_TEMPLATE: "pushCommentTemplate",
  PR_OPENED_COMMENT_TEMPLATE: "prOpenedCommentTemplate",
  PR_REOPENED_COMMENT_TEMPLATE: "prReopenedCommentTemplate",
  PR_READY_FOR_REVIEW_COMMENT_TEMPLATE: "prReadyForReviewCommentTemplate",
  PR_CLOSED_COMMENT_TEMPLATE: "prClosedCommentTemplate",
  PR_MERGED_COMMENT_TEMPLATE: "prMergedCommentTemplate",
  COMMIT_MESSAGE_REG_TEMPLATE: "commitMessageRegTemplate",
  PR_TITLE_REG_TEMPLATE: "prTitleRegTemplate",
};

const requiredConfigs: Pick<Configs, RequiredConfigKeys> = {
  projectKey: "projectKey",
  apiHost: "apiHost",
  apiKey: "apiKey",
  githubEventPath: "githubEventPath",
};

const optionalConfigs: Omit<Configs, RequiredConfigKeys> = {
  fixKeywords: ["fixKeyword1", "fixKeyword2"],
  closeKeywords: ["closeKeyword1", "closeKeyword2"],
  pushCommentTemplate: "pushCommentTemplate",
  prOpenedCommentTemplate: "prOpenedCommentTemplate",
  prReopenedCommentTemplate: "prReopenedCommentTemplate",
  prReadyForReviewCommentTemplate: "prReadyForReviewCommentTemplate",
  prClosedCommentTemplate: "prClosedCommentTemplate",
  prMergedCommentTemplate: "prMergedCommentTemplate",
  commitMessageRegTemplate: "commitMessageRegTemplate",
  prTitleRegTemplate: "prTitleRegTemplate",
  fixStatusId: "fixStatusId",
  closeStatusId: "closeStatusId",
};

describe("getConfigs", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(requiredEnv)) {
      process.env[key] = `${value} `;
      process.env[`INPUT_${key}`] = ` ${value}`;
    }
    for (const [key, value] of Object.entries(optionalEnv)) {
      process.env[`INPUT_${key}`] = ` ${value}`;
    }
  });

  test("getConfigs return trimmed configs", () => {
    expect(getConfigs()).toStrictEqual({
      ...requiredConfigs,
      ...optionalConfigs,
    });
  });

  test.each(Object.keys(requiredEnv))(
    "getConfigs does not throw when %s is defined only by env",
    (key) => {
      process.env[`INPUT_${key}`] = "";
      expect(getConfigs()).toStrictEqual({
        ...requiredConfigs,
        ...optionalConfigs,
      });
    },
  );

  test.each(Object.keys(requiredEnv))(
    "getConfigs throw when %s is not defined",
    (key) => {
      process.env[key] = "";
      process.env[`INPUT_${key}`] = "";
      expect(() => getConfigs()).toThrow("Input required and not supplied");
    },
  );

  test.each(Object.keys(optionalEnv))(
    "getConfigs does not throw when %s is not defined",
    (key) => {
      process.env[key] = "";
      process.env[`INPUT_${key}`] = "";
      expect(() => getConfigs()).not.toThrow();
    },
  );

  test("getConfigs return configs for current version when we set configs as of version 2.x.x", () => {
    Object.keys(requiredEnv).forEach((key) => {
      process.env[`INPUT_${key}`] = ``;
    });
    Object.keys(optionalEnv).forEach((key) => {
      process.env[`INPUT_${key}`] = ``;
    });
    expect(getConfigs()).toStrictEqual({
      ...defaultConfigs,
      ...requiredConfigs,
    });
  });
});
