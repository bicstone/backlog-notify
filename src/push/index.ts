import { startGroup, endGroup, info } from "../common/stdout";
import type { PushEvent } from "@octokit/webhooks-types";

import { parseCommits } from "./parseCommits";
import { parseRef } from "./parseRef";
import { postComments } from "./postComments";

import type { Configs } from "../main/getConfigs";

export const push = async ({
  event,
  projectKey,
  fixKeywords,
  closeKeywords,
  commitMessageRegTemplate,
  pushCommentTemplate,
  fixStatusId,
  closeStatusId,
  apiHost,
  apiKey,
}: Pick<
  Configs,
  | "projectKey"
  | "fixKeywords"
  | "closeKeywords"
  | "commitMessageRegTemplate"
  | "pushCommentTemplate"
  | "fixStatusId"
  | "closeStatusId"
  | "apiHost"
  | "apiKey"
> & { event: PushEvent }): Promise<string> => {
  startGroup("コミット取得中");
  const { parsedCommits } = parseCommits({
    commits: event.commits,
    projectKey,
    fixKeywords,
    closeKeywords,
    commitMessageRegTemplate,
  });
  if (!parsedCommits) {
    return "課題キーのついたコミットが1件も見つかりませんでした。";
  }
  endGroup();

  startGroup("Push先の確認中");
  const parsedRef = parseRef(event.ref, event.repository.html_url);
  if (!parsedRef) {
    return "Git referenceの解析に失敗しました。";
  }
  endGroup();

  startGroup("コメント送信中");
  await postComments({
    parsedCommits,
    parsedRef,
    pushCommentTemplate,
    fixStatusId,
    closeStatusId,
    apiHost,
    apiKey,
  }).then((data) => {
    data.forEach(({ commits, issueKey, isFix, isClose }) => {
      startGroup(`${commits[0].issueKey}:`);

      commits.forEach(({ message }) => {
        info(message);
      });

      if (isFix) {
        info(`${issueKey}を処理済みにしました。`);
      }

      if (isClose) {
        info(`${issueKey}を完了にしました。`);
      }

      endGroup();
    });
  });
  endGroup();

  return "正常に送信しました。";
};
