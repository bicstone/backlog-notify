import { getInput, InputOptions } from "@actions/core"

/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 * copy from https://github.com/actions/toolkit/blob/main/packages/core/src/core.ts
 * MIT License
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
export function getMultilineInput(
  name: string,
  options?: InputOptions
): string[] {
  const inputs: string[] = getInput(name, options)
    .split("\n")
    .filter((x) => x !== "")

  if (options && options.trimWhitespace === false) {
    return inputs
  }

  return inputs.map((input) => input.trim())
}
