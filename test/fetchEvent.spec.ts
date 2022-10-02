import fs from "fs"
import { fetchEvent } from "../src/fetchEvent"
import pushEvent from "./github/events/push.json"

jest.mock("fs")
const mockedFs = fs as jest.Mocked<typeof fs>

const path = "event.json"
const encoding = "utf8"

describe("fetchEvent", () => {
  test("fetchEvent return parsed event", () => {
    mockedFs.readFileSync.mockImplementation(() => JSON.stringify(pushEvent))

    expect(fetchEvent({ path })).toStrictEqual({ event: pushEvent })
    expect(mockedFs.readFileSync).toHaveBeenCalledTimes(1)
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(path, encoding)
  })
})
