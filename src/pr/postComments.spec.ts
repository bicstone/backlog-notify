import { postComments, type PostCommentsProps } from "./postComments";
import type { ParsedPullRequest } from "./parsePullRequest";
import type { PullRequestEvent } from "@octokit/webhooks-types";
import webhooks from "@octokit/webhooks-examples";

const login = "login";
const htmlUrl = "html_url";
const fixStatusId = "fixStatusId";
const closeStatusId = "closeStatusId";
const apiHost = "apiHost";
const apiKey = "apiKey";
const projectKey = "projectKey";
const issueKey = `${projectKey}-1`;
const title = "title";
const prOpenedCommentTemplate =
  "opened,<%= sender.login %>,<%= title %>,<%= pr.html_url %>";
const prReopenedCommentTemplate =
  "reopened,<%= sender.login %>,<%= title %>,<%= pr.html_url %>";
const prReadyForReviewCommentTemplate =
  "ready_for_review,<%= sender.login %>,<%= title %>,<%= pr.html_url %>";
const prClosedCommentTemplate =
  "closed,<%= sender.login %>,<%= title %>,<%= pr.html_url %>";
const prMergedCommentTemplate =
  "merged,<%= sender.login %>,<%= title %>,<%= pr.html_url %>";
const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`;
const statusText = "OK";

const events = (webhooks.find((v) => v.name === "pull_request")?.examples ??
  []) as PullRequestEvent[];

const openedEvents =
  events.filter(
    (v) =>
      v.action === "opened" ||
      v.action === "reopened" ||
      v.action === "ready_for_review",
  ) ?? [];

const closedEvents = events.filter((v) => v.action === "closed") ?? [];

const unexpectedEvents =
  events.filter(
    (v) =>
      v.action !== "opened" &&
      v.action !== "reopened" &&
      v.action !== "ready_for_review" &&
      v.action !== "closed",
  ) ?? [];

const getEvent = <T extends PullRequestEvent>(event: T): T => ({
  ...event,
  pull_request: {
    ...event.pull_request,
    title,
    html_url: htmlUrl,
  },
  sender: {
    ...event.sender,
    login,
  },
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

const getConfigs = (
  parsedPullRequest: ParsedPullRequest,
  configs?: Partial<PostCommentsProps>,
): PostCommentsProps => ({
  parsedPullRequest,
  fixStatusId,
  closeStatusId,
  prOpenedCommentTemplate,
  prReopenedCommentTemplate,
  prReadyForReviewCommentTemplate,
  prClosedCommentTemplate,
  prMergedCommentTemplate,
  apiHost,
  apiKey,
  ...configs,
});

const getFetchOptions = (
  comment: string,
  params?: Record<string, unknown>,
): RequestInit => ({
  method: "PATCH",
  body: new URLSearchParams({
    comment,
    ...params,
  }),
});

describe("postComments", () => {
  let fetchSpy = jest.spyOn(global, "fetch");

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, "fetch");
    fetchSpy.mockImplementation(
      async () =>
        await Promise.resolve({
          ok: true,
          statusText,
        } as Response),
    );
  });

  describe.each(openedEvents)(
    "opened, reopened, ready_for_review",
    (_event) => {
      const event = getEvent(_event);
      const comment = `${event.action},${login},${title},${htmlUrl}`;

      it("post a comment to Backlog API", async () => {
        const parsedPullRequest = getParsedPullRequest(event);
        const configs = getConfigs(parsedPullRequest);
        const result = await postComments(configs);

        expect(result.isSuccess).toEqual(true);
        expect(result.value).toEqual(statusText);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
          endpoint,
          getFetchOptions(comment),
        );
      });
      it("post a comment only when change to fixed", async () => {
        const parsedPullRequest = getParsedPullRequest(event, { isFix: true });
        const configs = getConfigs(parsedPullRequest);
        const result = await postComments(configs);

        expect(result.isSuccess).toEqual(true);
        expect(result.value).toEqual(statusText);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
          endpoint,
          getFetchOptions(comment),
        );
      });
      it("post a comment only when change to close", async () => {
        const parsedPullRequest = getParsedPullRequest(event, {
          isClose: true,
        });
        const configs = getConfigs(parsedPullRequest);
        const result = await postComments(configs);

        expect(result.isSuccess).toEqual(true);
        expect(result.value).toEqual(statusText);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(
          endpoint,
          getFetchOptions(comment),
        );
      });
      it("not continue and return message if pr is draft", async () => {
        const event = getEvent({
          ..._event,
          pull_request: { ..._event.pull_request, draft: true },
        } as PullRequestEvent);
        const parsedPullRequest = getParsedPullRequest(event);
        const configs = getConfigs(parsedPullRequest);
        const result = await postComments(configs);

        expect(result.isSuccess).toEqual(false);
        expect(result.error).toEqual("プルリクエストが下書きでした。");
        expect(fetchSpy).toHaveBeenCalledTimes(0);
      });
      it("throw error if fetch failed with a status code other than 200", async () => {
        fetchSpy.mockImplementation(
          async () =>
            await Promise.resolve({
              ok: false,
              statusText: "500",
            } as Response),
        );

        const event = getEvent(_event);
        const parsedPullRequest = getParsedPullRequest(event);
        const configs = getConfigs(parsedPullRequest);

        try {
          await postComments(configs);
        } catch (e) {
          expect(e).toEqual(new Error("500"));
        }
        expect.assertions(1);
      });
    },
  );

  describe.each(closedEvents)("merged", (_event) => {
    const event = getEvent({
      ..._event,
      pull_request: { ..._event.pull_request, merged: true },
    } as PullRequestEvent);
    const comment = `merged,${login},${title},${htmlUrl}`;

    it("post a comment to Backlog API", async () => {
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(endpoint, getFetchOptions(comment));
    });
    it("post a comment and change status when change to fixed", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true });
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        endpoint,
        getFetchOptions(comment, { statusId: fixStatusId }),
      );
    });
    it("post a comment and change status when change to close", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true });
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        endpoint,
        getFetchOptions(comment, { statusId: closeStatusId }),
      );
    });
    it("not continue and return message if pr is draft", async () => {
      const event = getEvent({
        ..._event,
        pull_request: { ..._event.pull_request, draft: true },
      } as PullRequestEvent);
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(false);
      expect(result.error).toEqual("プルリクエストが下書きでした。");
      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });
    it("throw error if fetch failed with a status code other than 200", async () => {
      fetchSpy.mockImplementation(
        async () =>
          await Promise.resolve({
            ok: false,
            statusText: "500",
          } as Response),
      );

      const event = getEvent(_event);
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);

      try {
        await postComments(configs);
      } catch (e) {
        expect(e).toEqual(new Error("500"));
      }
      expect.assertions(1);
    });
  });

  describe.each(closedEvents)("closed", (_event) => {
    const event = getEvent(_event);
    const comment = `closed,${login},${title},${htmlUrl}`;

    it("post a comment to Backlog API", async () => {
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(endpoint, getFetchOptions(comment));
    });
    it("post a comment only when change to fixed", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isFix: true });
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(endpoint, getFetchOptions(comment));
    });
    it("post a comment only when change to close", async () => {
      const parsedPullRequest = getParsedPullRequest(event, { isClose: true });
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(true);
      expect(result.value).toEqual(statusText);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(endpoint, getFetchOptions(comment));
    });
    it("not continue and return message if pr is draft", async () => {
      const event = getEvent({
        ..._event,
        pull_request: { ..._event.pull_request, draft: true },
      } as PullRequestEvent);
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(false);
      expect(result.error).toEqual("プルリクエストが下書きでした。");
      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });
    it("throw error if fetch failed with a status code other than 200", async () => {
      fetchSpy.mockImplementation(
        async () =>
          await Promise.resolve({
            ok: false,
            statusText: "500",
          } as Response),
      );

      const event = getEvent(_event);
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);

      try {
        await postComments(configs);
      } catch (e) {
        expect(e).toEqual(new Error("500"));
      }
      expect.assertions(1);
    });
  });

  describe.each(unexpectedEvents)("unexpected", (_event) => {
    it("not continue and return message", async () => {
      const event = getEvent(_event);
      const parsedPullRequest = getParsedPullRequest(event);
      const configs = getConfigs(parsedPullRequest);
      const result = await postComments(configs);

      expect(result.isSuccess).toEqual(false);
      expect(result.error).toEqual("予期しないイベントでした。");
      expect(fetchSpy).toHaveBeenCalledTimes(0);
    });
  });
});
