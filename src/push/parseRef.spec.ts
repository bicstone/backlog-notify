import { parseRef } from "./parseRef";

describe("parseRef", () => {
  test("parseRef return a parsed ref (branch)", () => {
    expect(parseRef("refs/heads/main", "url")).toStrictEqual({
      name: "main",
      url: "url/tree/main",
    });
  });

  test("parseRef return a parsed ref (tag)", () => {
    expect(parseRef("refs/tags/v1.0.0", "url")).toStrictEqual({
      name: "v1.0.0",
      url: "url/tree/v1.0.0",
    });
  });

  test("parseRef return undefined when name does not found", () => {
    expect(parseRef("refs", "url")).toStrictEqual(undefined);
  });
});
