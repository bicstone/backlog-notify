import * as os from "node:os";

const cmd = "::";
enum ExitCode {
  success = 0,
  failure = 1,
}

/**
 * Writes info to log with newline.
 */
export function info(message: string): void {
  process.stdout.write(message + os.EOL);
}

/**
 * Begin an output group.
 */
export function startGroup(name: string): void {
  process.stdout.write(`${cmd}group${cmd}${name}${os.EOL}`);
}

/**
 * End an output group.
 */
export function endGroup(): void {
  process.stdout.write(`${cmd}endgroup${cmd}${os.EOL}`);
}

/**
 * Sets the action status to failed.
 */
export function setFailed(message: string | Error): void {
  const error = message instanceof Error ? message.toString() : message;
  process.exitCode = ExitCode.failure;
  process.stdout.write(`${cmd}error${cmd}${error}${os.EOL}`);
}
