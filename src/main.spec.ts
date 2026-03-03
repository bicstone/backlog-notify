import { info, setFailed } from "./common/stdout";
import webhooks from "@octokit/webhooks-examples";

import type { PullRequestEvent, PushEvent } from "@octokit/webhooks-types";

import { main } from "./main";
import { getConfigs } from "./main/getConfigs";
import { fetchEvent } from "./main/fetchEvent";
import { push } from "./push";
import { pr } from "./pr";

vi.mock("./common/stdout");
vi.mock("./main/getConfigs");
vi.mock("./main/fetchEvent");
vi.mock("./push");
vi.mock("./pr");

const pushEvents = (webhooks.find((v) => v.name === "push")?.examples ??
  []) as PushEvent[];

const pushEventsWithCommits = pushEvents.filter((v) => v.commits.length > 0);
const pushEventsWithoutCommits = pushEvents.filter(
  (v) => v.commits.length === 0,
);

const pullRequestEvents = (webhooks.find((v) => v.name === "pull_request")
  ?.examples ?? []) as PullRequestEvent[];

describe("main", () => {
  beforeEach(() => {
    vi.mocked(getConfigs).mockImplementation(() => ({
      projectKey: "projectKey",
      apiHost: "apiHost",
      apiKey: "apiKey",
      githubEventPath: "githubEventPath",
      fixKeywords: ["fixKeyword"],
      closeKeywords: ["closeKeyword"],
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
    }));
  });

  describe.each(pushEventsWithCommits)(
    "push event with commits",
    (pushEvent) => {
      test("main resolve with the message", async () => {
        vi.mocked(fetchEvent).mockImplementation(() => ({
          event: pushEvent,
        }));
        vi.mocked(push).mockImplementation(
          async () => await Promise.resolve("push!"),
        );

        await expect(main()).resolves.not.toThrow();

        expect(push).toHaveBeenCalledTimes(1);
        expect(pr).toHaveBeenCalledTimes(0);

        expect(info).toHaveBeenCalledTimes(1);
        expect(info).toHaveBeenCalledWith("push!");
        expect(setFailed).toHaveBeenCalledTimes(0);
      });
    },
  );

  describe.each(pushEventsWithoutCommits)(
    "push event without commits",
    (pushEvent) => {
      test("main not continue and resolve processing when 0 commits", async () => {
        vi.mocked(fetchEvent).mockImplementation(() => ({
          event: pushEvent,
        }));

        await expect(main()).resolves.not.toThrow();

        expect(push).toHaveBeenCalledTimes(0);
        expect(pr).toHaveBeenCalledTimes(0);

        expect(info).toHaveBeenCalledTimes(1);
        expect(info).toHaveBeenCalledWith("予期しないイベントでした。");
        expect(setFailed).toHaveBeenCalledTimes(0);
      });
    },
  );

  describe.each(pullRequestEvents)("pull request event", (prEvent) => {
    test("main resolve with the message", async () => {
      vi.mocked(fetchEvent).mockImplementation(() => ({
        event: prEvent,
      }));
      vi.mocked(pr).mockImplementation(
        async () => await Promise.resolve("pr!"),
      );

      await expect(main()).resolves.not.toThrow();

      expect(push).toHaveBeenCalledTimes(0);
      expect(pr).toHaveBeenCalledTimes(1);

      expect(info).toHaveBeenCalledTimes(1);
      expect(info).toHaveBeenCalledWith("pr!");
      expect(setFailed).toHaveBeenCalledTimes(0);
    });
  });

  describe("unexpected event", () => {
    test("main not continue and resolve processing when the event cannot be loaded", async () => {
      vi.mocked(fetchEvent).mockImplementation(() => ({
        event: null as unknown as PushEvent,
      }));

      await expect(main()).resolves.not.toThrow();

      expect(push).toHaveBeenCalledTimes(0);
      expect(pr).toHaveBeenCalledTimes(0);

      expect(info).toHaveBeenCalledTimes(1);
      expect(info).toHaveBeenCalledWith("予期しないイベントでした。");
      expect(setFailed).toHaveBeenCalledTimes(0);
    });

    test("main calls setFailed when an error", async () => {
      const error = Error("error!");
      vi.mocked(fetchEvent).mockImplementation(() => {
        throw error;
      });

      await expect(main()).resolves.not.toThrow();

      expect(push).toHaveBeenCalledTimes(0);
      expect(pr).toHaveBeenCalledTimes(0);

      expect(setFailed).toHaveBeenCalledTimes(1);
      expect(setFailed).toHaveBeenCalledWith(error);
    });

    test("main calls setFailed when an unexpected error", async () => {
      const error = "error!";
      vi.mocked(fetchEvent).mockImplementation(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- expected unexpected error
        throw error;
      });

      await expect(main()).resolves.not.toThrow();

      expect(push).toHaveBeenCalledTimes(0);
      expect(pr).toHaveBeenCalledTimes(0);

      expect(setFailed).toHaveBeenCalledTimes(1);
      expect(setFailed).toHaveBeenCalledWith(error);
    });
  });
});
