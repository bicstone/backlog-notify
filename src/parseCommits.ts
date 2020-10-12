import template from "lodash/template";
import { commits } from "./fetchCommits";

const fixKeywords = ["#fix", "#fixes", "#fixed"]; // 処理済みにするキーワード
const closeKeywords = ["#close", "#closes", "#closed"]; // 完了にするキーワード
const commitKeywordRegexTemplate = template(
  `^(<%=PROJECT_KEY%>\\-\\d+)\\s?` + // 課題キー
    `(.*?)?` + // メッセージ
    `\\s?(${fixKeywords.join("|")}|${closeKeywords.join("|")})?$`
); // コミットメッセージを解析する正規表現テンプレート

export interface parsedCommits {
  [key: string]: Array<parsedCommit>;
}

export interface parsedCommit {
  issueKey: string;
  isFix: boolean;
  isClose: boolean;
  email: string;
  name: string;
  username: string;
  distinct: boolean;
  id: string;
  idShort: string;
  message: string;
  timestamp: string;
  tree_id: string;
  url: string;
}

/**
 * コミットメッセージを解析して解析済みのオブジェクトで返す
 * @param {Object} コミットのオブジェクト
 * @param {string} 課題キー
 * @returns {Promise}
 * - resolve {Object} 解析済みのオブジェクト
 * - reject {string} 1件もない場合
 */
const parseCommits = (
  data: commits,
  PROJECT_KEY: string
): Promise<parsedCommits> =>
  new Promise((resolve, reject) => {
    let ret: parsedCommits = {};

    data.commits.forEach((commit) => {
      // コミットメッセージを正規表現にかける
      // [1] => 課題キー(必須) PROJECT_1-1
      // [2] => コミットメッセージ(任意) テスト
      // [3] => キーワード(任意) #fix
      // TODO: 複数の課題キーがある場合
      let result = commit.message.match(
        RegExp(commitKeywordRegexTemplate({ PROJECT_KEY: PROJECT_KEY }), "s")
      );

      // 課題キーがなければスキップ
      if (result === null) {
        return;
      }

      // オブジェクトを作成
      let parse = {
        issueKey: result[1],
        isFix: fixKeywords.includes(result[3]),
        isClose: closeKeywords.includes(result[3]),
        email: commit.author.email,
        name: commit.author.name,
        username: commit.author.username,
        distinct: commit.distinct,
        id: commit.id,
        idShort: commit.id.slice(0, 10),
        message: result[2],
        timestamp: commit.timestamp,
        tree_id: commit.tree_id,
        url: commit.url,
      };

      // 返却オブジェクトに代入
      if (ret[result[1]] === undefined) {
        ret[result[1]] = [];
      }

      ret[result[1]].push(parse);
    });

    // 課題キーの付いたコミットがなければ終了
    if (Object.keys(ret).length === 0) {
      return reject("課題キーの付いたコミットが1件もありません。");
    }

    return resolve(ret);
  });

export default parseCommits;
