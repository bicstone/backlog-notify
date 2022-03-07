import * as fs from "fs"
import * as path from "path"
import { getMultilineInput } from "../src/getMultilineInput"

/**
 * copy from https://github.com/actions/toolkit/blob/main/packages/core/src/core.ts
 * MIT License
 */

const testEnvVars = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  INPUT_MY_INPUT_LIST: "val1\nval2\nval3",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  INPUT_LIST_WITH_TRAILING_WHITESPACE: "  val1  \n  val2  \n  ",
}

describe("@actions/core", () => {
  beforeAll(() => {
    const filePath = path.join(__dirname, `test`)
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath)
    }
  })

  beforeEach(() => {
    for (const key in testEnvVars) {
      process.env[key] = testEnvVars[key as keyof typeof testEnvVars]
    }
    process.stdout.write = jest.fn()
  })

  it("getMultilineInput works", () => {
    expect(getMultilineInput("my input list")).toEqual(["val1", "val2", "val3"])
  })

  it("getMultilineInput trims whitespace by default", () => {
    expect(getMultilineInput("list with trailing whitespace")).toEqual([
      "val1",
      "val2",
    ])
  })

  it("getMultilineInput trims whitespace when option is explicitly true", () => {
    expect(
      getMultilineInput("list with trailing whitespace", {
        trimWhitespace: true,
      })
    ).toEqual(["val1", "val2"])
  })

  it("getMultilineInput does not trim whitespace when option is false", () => {
    expect(
      getMultilineInput("list with trailing whitespace", {
        trimWhitespace: false,
      })
    ).toEqual(["  val1  ", "  val2  ", "  "])
  })
})
