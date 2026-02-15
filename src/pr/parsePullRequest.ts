import type {
  PullRequest,
  PullRequestEvent,
  User,
} from "@octokit/webhooks-types";
import template from "lodash.template";
import { extractMatchGroups } from "../common/extractMatchGroups";

export interface ParsedPullRequest {
  pr: PullRequest;
  action: PullRequestEvent["action"];
  sender: User;
  issueKey: string;
  title: string;
  keywords: string;
  isFix: boolean;
  isClose: boolean;
}

export interface ParsePullRequestProps {
  event: PullRequestEvent;
  projectKey: string;
  fixKeywords: string[];
  closeKeywords: string[];
  prTitleRegTemplate: string;
}

/**
 * Parse the pull request from the event
 */
export const parsePullRequest = ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  prTitleRegTemplate,
}: ParsePullRequestProps): { parsedPullRequest: ParsedPullRequest | null } => {
  const prTitleReg = RegExp(
    template(prTitleRegTemplate)({
      projectKey,
      fixKeywords,
      closeKeywords,
    }),
    "su",
  );

  const match = event.pull_request.title.match(prTitleReg);

  if (!match) {
    return { parsedPullRequest: null };
  }

  const { issueKey, content: title, keywords } = extractMatchGroups(match);

  if (!issueKey) {
    return { parsedPullRequest: null };
  }

  return {
    parsedPullRequest: {
      pr: event.pull_request,
      action: event.action,
      sender: event.sender,
      issueKey,
      title: title.trim(),
      keywords,
      isFix: fixKeywords.includes(keywords),
      isClose: closeKeywords.includes(keywords),
    },
  };
};
