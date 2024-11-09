import {
  type ParsedPullRequest,
  parsePullRequest,
  type ParsePullRequestProps,
} from "./parsePullRequest";
import type { PullRequestEvent } from "@octokit/webhooks-types";
import webhooks from "@octokit/webhooks-examples";

const projectKey = "BUNBUN_NINE9";
const fixKeyword = "#fix";
const fixKeywords = [fixKeyword];
const closeKeyword = "#close";
const closeKeywords = [closeKeyword];
const issueKey = `${projectKey}-1`;
const title = "Hare Hare Yukai!";
const prTitleRegTemplate =
  "^" +
  "(<%= projectKey %>\\-\\d+)\\s?" +
  "(.*?)?\\s?" +
  "(<% print(fixKeywords.join('|')) %>|<% print(closeKeywords.join('|')) %>)?" +
  "$";

const events = (webhooks.find((v) => v.name === "pull_request")?.examples ??
  []) as PullRequestEvent[];

const getEvent = <T extends PullRequestEvent>(event: T, title: string): T => ({
  ...event,
  pull_request: {
    ...event.pull_request,
    title,
  },
  sender: {
    ...event.sender,
  },
});

const getConfigs = (
  event: PullRequestEvent,
  configs?: Partial<ParsePullRequestProps>,
): ParsePullRequestProps => ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  prTitleRegTemplate,
  ...configs,
});

const getParsedPullRequest = (
  event: PullRequestEvent,
  parsedPullRequest?: Partial<ParsedPullRequest>,
): ParsedPullRequest => ({
  pr: event.pull_request,
  action: event.action,
  sender: event.sender,
  issueKey,
  title,
  keywords: "",
  isFix: false,
  isClose: false,
  ...parsedPullRequest,
});

describe.each(events)("parsePullRequest", (_event) => {
  test("return parsed pull request", () => {
    const event = getEvent(_event, `${issueKey} ${title}`);
    const configs = getConfigs(event);
    const parsedPullRequest = getParsedPullRequest(event);

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });

  test("return parsed pull request with fix_keyword", () => {
    const event = getEvent(_event, `${issueKey} ${title} ${fixKeyword}`);
    const configs = getConfigs(event);
    const parsedPullRequest = getParsedPullRequest(event, {
      keywords: fixKeyword,
      isFix: true,
    });

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });

  test("return parsed pull request with close_keyword", () => {
    const event = getEvent(_event, `${issueKey} ${title} ${closeKeyword}`);
    const configs = getConfigs(event);
    const parsedPullRequest = getParsedPullRequest(event, {
      keywords: closeKeyword,
      isClose: true,
    });

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });

  test("return parsed pull request with fix_keyword and close_keyword", () => {
    const event = getEvent(
      _event,
      `${issueKey} ${title} ${fixKeyword} ${closeKeyword}`,
    );
    const configs = getConfigs(event);
    const parsedPullRequest = getParsedPullRequest(event, {
      title: `${title} ${fixKeyword}`,
      keywords: closeKeyword,
      isFix: false,
      isClose: true,
    });

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });

  test("return parsed pull request when message is only issueKey", () => {
    const event = getEvent(_event, issueKey);
    const configs = getConfigs(event);
    const parsedPullRequest = getParsedPullRequest(event, {
      title: "",
    });

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });

  test("return null when issueKey is not specified", () => {
    const event = getEvent(_event, title);
    const configs = getConfigs(event);
    const parsedPullRequest = null;

    expect(parsePullRequest(configs)).toStrictEqual({
      parsedPullRequest,
    });
  });
});
