import template from "lodash.template";
import type { ParsedCommits, ParsedCommit } from "./parseCommits";
import type { ParsedRef } from "./parseRef";

// Update Issue API
// https://developer.nulab.com/docs/backlog/api/2/update-issue/#
const updateIssueApiUrlTemplate = template(
  "https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>",
);

export interface Response {
  commits: ParsedCommit[];
  issueKey: string;
  isFix: boolean;
  isClose: boolean;
}

interface PostCommentsProps {
  parsedCommits: ParsedCommits;
  parsedRef: ParsedRef;
  fixStatusId: string;
  closeStatusId: string;
  pushCommentTemplate: string;
  apiHost: string;
  apiKey: string;
}

/**
 * Post the comment to Backlog API
 * @param parsedCommits parsed Commits (create by parseCommits.ts)
 * @param parsedRef parsed ref (create by parseRef.ts)
 * @param fixStatusId Status ID to mark as fixed
 * @param closeStatusIdStatus ID to mark as closed
 * @param pushCommentTemplate The template for backlog issue comment on push events
 * @param apiHost Backlog API Host
 * @param apiKey Backlog API Key
 * @returns Patch comment request promises
 */

export const postComments = async ({
  parsedCommits,
  parsedRef,
  ...configs
}: PostCommentsProps): Promise<Response[]> => {
  const promiseArray: Array<Promise<Response>> = [];

  for (const [issueKey, commits] of Object.entries(parsedCommits)) {
    promiseArray.push(
      createPatchCommentRequest({
        commits,
        issueKey,
        ref: parsedRef,
        ...configs,
      }),
    );
  }

  return await Promise.all(promiseArray);
};

interface CreatePatchCommentRequestProps {
  commits: ParsedCommit[];
  ref: ParsedRef;
  issueKey: string;
  fixStatusId: string;
  closeStatusId: string;
  pushCommentTemplate: string;
  apiHost: string;
  apiKey: string;
}

const createPatchCommentRequest = async ({
  commits,
  ref,
  issueKey,
  fixStatusId,
  closeStatusId,
  pushCommentTemplate,
  apiHost,
  apiKey,
}: CreatePatchCommentRequestProps): Promise<Response> => {
  const endpoint = updateIssueApiUrlTemplate({
    apiHost,
    apiKey,
    issueKey,
  });

  const comment = template(pushCommentTemplate)({ commits, ref });
  const isFix = commits.map((commit) => commit.isFix).includes(true);
  const isClose = commits.map((commit) => commit.isClose).includes(true);
  const status = (() => {
    if (isFix) return { statusId: fixStatusId };
    if (isClose) return { statusId: closeStatusId };
    else return undefined;
  })();
  const body = { comment, ...status };

  const fetchOptions: RequestInit = {
    method: "PATCH",
    body: new URLSearchParams(body),
  };

  const response = await fetch(endpoint, fetchOptions);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return { commits, issueKey, isFix, isClose };
};
