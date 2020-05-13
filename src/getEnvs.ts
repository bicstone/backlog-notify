const projectKeyRegex = /^[A-Z\d_]+$/; // プロジェクトキーの正規表現
const apiHostRegex = /^[a-z-\d]+\.backlog(\.com|\.jp|tool\.com)$/; // HOSTの正規表現
const apiKeyRegex = /^[a-zA-z\d]+$/; // API キーの正規表現
const githubEventPathRegex = /event\.json$/; // event.jsonの 正規表現

interface Envs {
  PROJECT_KEY: string;
  API_HOST: string;
  API_KEY: string;
  GITHUB_EVENT_PATH: string;
}

/**
 * 環境変数を取得し、バリデーションして返す
 * @returns {Promise}
 * - resolve {Object} 環境変数オブジェクト
 * - reject {Error} バリデーションエラー
 */

export const getEnvs = (): Promise<Envs> =>
  new Promise((resolve, reject) => {
    // PROJECT_KEY のチェック
    const PROJECT_KEY = process.env.PROJECT_KEY || "";
    if (projectKeyRegex.test(PROJECT_KEY) === false) {
      return reject(
        new Error(`PROJECT_KEY が正しくありません。 (${PROJECT_KEY})`)
      );
    }

    // API_HOST のチェック
    const API_HOST = process.env.API_HOST || "";
    if (apiHostRegex.test(API_HOST) === false) {
      return reject(new Error(`API_HOST が正しくありません。 (${API_HOST})`));
    }

    // API_KEY のチェック
    const API_KEY = process.env.API_KEY || "";
    if (apiKeyRegex.test(API_KEY) === false) {
      return reject(new Error(`API_KEY が正しくありません。`));
    }

    // GITHUB_EVENT_PATH のチェック
    const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH || "";
    if (githubEventPathRegex.test(GITHUB_EVENT_PATH) === false) {
      return reject(
        new Error(`event.json を受け取れません。 (${GITHUB_EVENT_PATH})`)
      );
    }
    return resolve({
      PROJECT_KEY: PROJECT_KEY,
      API_HOST: API_HOST,
      API_KEY: API_KEY,
      GITHUB_EVENT_PATH: GITHUB_EVENT_PATH
    });
  });

export default getEnvs;
