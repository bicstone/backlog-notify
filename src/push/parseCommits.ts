import type { Commit } from "@octokit/webhooks-types";
import template from "lodash.template";
import { extractMatchGroups } from "../common/extractMatchGroups";

export type ParsedCommits = Record<string, ParsedCommit[]>;

export type ParsedCommit = {
  issueKey: string | null;
  comment: string;
  keywords: string;
  isFix: boolean;
  isClose: boolean;
} & Commit;

interface ParseCommitsProps {
  commits: Commit[];
  projectKey: string;
  fixKeywords: string[];
  closeKeywords: string[];
  commitMessageRegTemplate: string;
}

/**
 * Parse commits from the event commits
 * @param commits commits from the event commits
 * @param projectKey Backlog project key
 * @param fixKeywords Keywords to change the status of the issue to fixed
 * @param closeKeywords Keywords to change the status of the issue to closed
 * @param commitMessageRegTemplate The template for regular expressions to parse commit messages
 * @returns ParsedCommits | null
 */
export const parseCommits = ({
  commits,
  projectKey,
  fixKeywords,
  closeKeywords,
  commitMessageRegTemplate,
}: ParseCommitsProps): { parsedCommits: ParsedCommits | null } => {
  const parsedCommits: ParsedCommits = {};
  const commitMessageReg = RegExp(
    template(commitMessageRegTemplate)({
      projectKey,
      fixKeywords,
      closeKeywords,
    }),
    "su",
  );

  commits.forEach((commit) => {
    const { parsedCommit } = parseCommit({
      commit,
      fixKeywords,
      closeKeywords,
      commitMessageReg,
    });
    if (!parsedCommit?.issueKey) return;

    if (parsedCommits[parsedCommit.issueKey]) {
      parsedCommits[parsedCommit.issueKey].push(parsedCommit);
    } else {
      parsedCommits[parsedCommit.issueKey] = [parsedCommit];
    }
  });

  const commitCount = Object.keys(parsedCommits).length;
  if (commitCount === 0) {
    return { parsedCommits: null };
  }

  return { parsedCommits };
};

interface ParseCommitProps {
  commit: Commit;
  fixKeywords: string[];
  closeKeywords: string[];
  commitMessageReg: RegExp;
}

const parseCommit = ({
  commit,
  fixKeywords,
  closeKeywords,
  commitMessageReg,
}: ParseCommitProps): { parsedCommit: ParsedCommit | null } => {
  const match = commit.message.match(commitMessageReg);

  if (!match) {
    return { parsedCommit: null };
  }

  const { issueKey, content: comment, keywords } = extractMatchGroups(match);

  if (!issueKey) {
    return { parsedCommit: null };
  }

  return {
    parsedCommit: {
      ...commit,
      issueKey,
      comment: comment.trim(),
      keywords,
      isFix: fixKeywords.includes(keywords),
      isClose: closeKeywords.includes(keywords),
    },
  };
};
