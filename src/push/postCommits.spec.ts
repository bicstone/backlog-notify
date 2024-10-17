import type { ParsedCommits } from "./parseCommits";
import { postComments, type Response as ApiResponse } from "./postComments";
import type { ParsedRef } from "./parseRef";

const fixStatusId = "fixStatusId";
const closeStatusId = "closeStatusId";
const pushCommentTemplate =
  "<%= commits[0].author.name %>さんが[<%= ref.name %>](<%= ref.url %>)にプッシュしました" +
  "\n" +
  "<% commits.forEach(commit=>{ %>" +
  "\n" +
  "+ <%= commit.comment %> ([<% print(commit.id.slice(0, 7)) %>](<%= commit.url %>))" +
  "<% }); %>";
const apiHost = "level5-judgelight-.backlog.com";
const apiKey = "GO1GO1maniac";

const projectKey = "BUNBUN_NINE9";
const issueKey = `${projectKey}-1`;
const comment = "＼(ﾟヮﾟ)＞＼(ﾟヮﾟ)／＼(ﾟヮﾟ)／＜(ﾟヮ^)";

const baseCommit = {
  id: "e83c5163316f89bfbde7d9ab23ca2e25604af290",

  tree_id: "tree_id89012345",
  distinct: true,
  timestamp: "timestamp",
  url: "url",
  author: {
    name: "author.name",
    email: "author.email",
    username: "author.username",
  },
  committer: {
    name: "committer.name",
    email: "committer.email",
  },
  added: ["added"],
  removed: ["removed"],
  modified: ["modified"],
  message: `${issueKey} ${comment}`,
  comment,
  issueKey,
  keywords: "",
  isFix: false,
  isClose: false,
};

const baseCommits: ParsedCommits = {
  [issueKey]: [baseCommit],
};

const baseParsedRef: ParsedRef = {
  name: "branch-name",
  url: "https://example.com/foo/bar/tree/branch-name",
};

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
        } as Response),
    );
  });

  test("parseCommits post a comment to Backlog API", async () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`;
    const parsedCommits: ParsedCommits = baseCommits;
    const parsedRef: ParsedRef = baseParsedRef;
    const response: ApiResponse = {
      commits: parsedCommits[issueKey],
      issueKey,
      isFix: false,
      isClose: false,
    };

    await expect(
      postComments({
        parsedCommits,
        parsedRef,
        fixStatusId,
        closeStatusId,
        pushCommentTemplate,
        apiHost,
        apiKey,
      }),
    ).resolves.toStrictEqual([response]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      endpoint,
      getFetchOptions(
        `${baseCommit.author.name}さんが[${baseParsedRef.name}](${baseParsedRef.url})にプッシュしました` +
          "\n" +
          "\n" +
          `+ ${baseCommit.comment} ` +
          `([${baseCommit.id.slice(0, 7).slice(0, 7)}](${baseCommit.url}))`,
      ),
    );
  });

  test("parseCommits post a comment and change status when change to fixed", async () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`;
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
        {
          ...baseCommit,
          message: `${issueKey} ${comment} #fixed`,
          keywords: "#fixed",
          isFix: true,
        },
      ],
    };
    const parsedRef: ParsedRef = baseParsedRef;
    const response: ApiResponse = {
      commits: parsedCommits[issueKey],
      issueKey,
      isFix: true,
      isClose: false,
    };

    await expect(
      postComments({
        parsedCommits,
        parsedRef,
        fixStatusId,
        closeStatusId,
        pushCommentTemplate,
        apiHost,
        apiKey,
      }),
    ).resolves.toStrictEqual([response]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      endpoint,
      getFetchOptions(
        `${baseCommit.author.name}さんが[${baseParsedRef.name}](${baseParsedRef.url})にプッシュしました` +
          "\n" +
          "\n" +
          `+ ${baseCommit.comment} ` +
          `([${baseCommit.id.slice(0, 7)}](${baseCommit.url}))`,
        { statusId: fixStatusId },
      ),
    );
  });

  test("parseCommits post a comment and change status when change to close", async () => {
    const endpoint = `https://${apiHost}/api/v2/issues/${issueKey}?apiKey=${apiKey}`;
    const parsedCommits: ParsedCommits = {
      [issueKey]: [
        {
          ...baseCommit,
          message: `${issueKey} ${comment} #closed`,
          keywords: "#closed",
          isClose: true,
        },
      ],
    };
    const parsedRef: ParsedRef = baseParsedRef;
    const response: ApiResponse = {
      commits: parsedCommits[issueKey],
      issueKey,
      isFix: false,
      isClose: true,
    };

    await expect(
      postComments({
        parsedCommits,
        parsedRef,
        fixStatusId,
        closeStatusId,
        pushCommentTemplate,
        apiHost,
        apiKey,
      }),
    ).resolves.toStrictEqual([response]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      endpoint,
      getFetchOptions(
        `${baseCommit.author.name}さんが[${baseParsedRef.name}](${baseParsedRef.url})にプッシュしました` +
          "\n" +
          "\n" +
          `+ ${baseCommit.comment} ` +
          `([${baseCommit.id.slice(0, 7)}](${baseCommit.url}))`,
        { statusId: closeStatusId },
      ),
    );
  });

  test("parseCommits post 2 comments to Backlog API when 2 issueKeys", async () => {
    const parsedCommits: ParsedCommits = {
      [`${projectKey}-1`]: [
        {
          ...baseCommit,
          issueKey: `${projectKey}-1`,
          message: `${projectKey}-1 ${comment}`,
        },
      ],
      [`${projectKey}-2`]: [
        {
          ...baseCommit,
          issueKey: `${projectKey}-2`,
          message: `${projectKey}-2 ${comment}`,
        },
        {
          ...baseCommit,
          issueKey: `${projectKey}-2`,
          message: `${projectKey}-2 ${comment}`,
        },
      ],
    };
    const parsedRef: ParsedRef = baseParsedRef;
    const response1: ApiResponse = {
      commits: parsedCommits[`${projectKey}-1`],
      issueKey: `${projectKey}-1`,
      isFix: false,
      isClose: false,
    };
    const response2: ApiResponse = {
      commits: parsedCommits[`${projectKey}-2`],
      issueKey: `${projectKey}-2`,
      isFix: false,
      isClose: false,
    };

    await expect(
      postComments({
        parsedCommits,
        parsedRef,
        fixStatusId,
        closeStatusId,
        pushCommentTemplate,
        apiHost,
        apiKey,
      }),
    ).resolves.toStrictEqual([response1, response2]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("throw error if fetch failed with a status code other than 200", async () => {
    fetchSpy.mockImplementation(
      async () =>
        await Promise.resolve({
          ok: false,
          statusText: "500",
        } as Response),
    );

    try {
      await postComments({
        parsedCommits: baseCommits,
        parsedRef: baseParsedRef,
        fixStatusId,
        closeStatusId,
        pushCommentTemplate,
        apiHost,
        apiKey,
      });
    } catch (e) {
      expect(e).toEqual(new Error("500"));
    }
    expect.assertions(1);
  });
});
