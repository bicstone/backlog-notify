import { info } from "../common/stdout";
import webhooks from "@octokit/webhooks-examples";

import type { PushEvent } from "@octokit/webhooks-types";

import { push } from ".";
import { parseRef } from "./parseRef";
import { parseCommits, type ParsedCommit } from "./parseCommits";
import { postComments, type Response } from "./postComments";

vi.mock("../common/stdout");
vi.mock("./parseRef");
vi.mock("./parseCommits");
vi.mock("./postComments");

const pushEvents = (webhooks.find((v) => v.name === "push")?.examples ??
  []) as PushEvent[];

const configs = {
  projectKey: "projectKey",
  apiHost: "apiHost",
  apiKey: "apiKey",
  fixKeywords: ["fixKeyword"],
  closeKeywords: ["closeKeyword"],
  pushCommentTemplate: "pushCommentTemplate",
  commitMessageRegTemplate: "commitMessageRegTemplate",
  fixStatusId: "fixStatusId",
  closeStatusId: "closeStatusId",
};

const message = "message";
const issueKey = "issueKey";

const basePostCommentsResponse: Response = {
  commits: [
    {
      message,
    },
  ] as ParsedCommit[],
  issueKey,
  isFix: false,
  isClose: false,
};

describe.each(pushEvents)("index", (event) => {
  beforeEach(() => {
    vi.mocked(parseCommits).mockImplementation(() => ({
      parsedCommits: { key: [] },
    }));
    vi.mocked(parseRef).mockImplementation(() => ({
      name: "",
      url: "",
    }));
  });

  test("resolve with the message", async () => {
    const postCommentsResponse: Response = basePostCommentsResponse;
    vi.mocked(postComments).mockImplementation(
      async () => await Promise.resolve([postCommentsResponse]),
    );
    await expect(push({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。",
    );
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(message);
  });

  test("resolve with the message when commits with fix_keyword", async () => {
    const postCommentsResponse: Response = {
      ...basePostCommentsResponse,
      isFix: true,
    };
    vi.mocked(postComments).mockImplementation(
      async () => await Promise.resolve([postCommentsResponse]),
    );
    await expect(push({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。",
    );
    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenCalledWith(message);
    expect(info).toHaveBeenCalledWith(`${issueKey}を処理済みにしました。`);
  });

  test("resolve with the message when commits with close_keyword", async () => {
    const postCommentsResponse: Response = {
      ...basePostCommentsResponse,
      isClose: true,
    };
    vi.mocked(postComments).mockImplementation(
      async () => await Promise.resolve([postCommentsResponse]),
    );
    await expect(push({ ...configs, event })).resolves.toStrictEqual(
      "正常に送信しました。",
    );
    expect(info).toHaveBeenCalledTimes(2);
    expect(info).toHaveBeenCalledWith(message);
    expect(info).toHaveBeenCalledWith(`${issueKey}を完了にしました。`);
  });

  test("not continue and resolve processing when commits without issueKey", async () => {
    vi.mocked(parseCommits).mockImplementation(() => ({
      parsedCommits: null,
    }));
    await expect(push({ ...configs, event })).resolves.toStrictEqual(
      "課題キーのついたコミットが1件も見つかりませんでした。",
    );
  });

  test("not continue and resolve processing when the event.ref is invalid", async () => {
    vi.mocked(parseRef).mockImplementation(() => undefined);
    await expect(push({ ...configs, event })).resolves.toStrictEqual(
      "Git referenceの解析に失敗しました。",
    );
  });
});
