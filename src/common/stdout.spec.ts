import { info, startGroup, endGroup, setFailed } from "./stdout";
import {
  info as infoOrig,
  startGroup as startGroupOrig,
  endGroup as endGroupOrig,
  setFailed as setFailedOrig,
  ExitCode,
} from "@actions/core";

describe("stdout", () => {
  describe("info", () => {
    test("should write the given message to log", () => {
      const message = "T";
      info(message);
      const output = process.stdout.toString();
      infoOrig(message);
      const outputOrig = process.stdout.toString();
      expect(output).toStrictEqual(outputOrig);
    });
  });

  describe("startGroup", () => {
    test("should start a new output group", () => {
      const name = "T";
      startGroup(name);
      const output = process.stdout.write.toString();
      startGroupOrig(name);
      const outputOrig = process.stdout.write.toString();
      expect(output).toStrictEqual(outputOrig);
    });
  });

  describe("endGroup", () => {
    test("should end the current output group", () => {
      endGroup();
      const output = process.stdout.write.toString();
      endGroupOrig();
      const outputOrig = process.stdout.write.toString();
      expect(output).toStrictEqual(outputOrig);
    });
  });

  describe("setFailed", () => {
    test("should set the action status to failed and write the error message to log", () => {
      const error = new Error("Test Error");
      setFailed(error);
      const output = process.stdout.write.toString();
      expect(process.exitCode).toBe(ExitCode.Failure);

      setFailedOrig(error);
      const outputOrig = process.stdout.write.toString();
      expect(output).toStrictEqual(outputOrig);
      expect(process.exitCode).toBe(ExitCode.Failure);
    });
  });
});
