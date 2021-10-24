import fs from "fs"
import { mocked } from "ts-jest/utils"
import { fetchEvent } from "../src/fetchEvent"
import pushEvent from "./github/events/push.json"

jest.mock("fs")

const path = "event.json"
const encoding = "utf8"

describe("fetchEvent", () => {
  test("fetchEvent return parsed event", () => {
    mocked(fs.readFileSync).mockImplementation(() => JSON.stringify(pushEvent))

    expect(fetchEvent({ path })).toStrictEqual({ event: pushEvent })
    expect(fs.readFileSync).toHaveBeenCalled()
    expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    expect(fs.readFileSync).toHaveBeenCalledWith(path, encoding)
  })
})
