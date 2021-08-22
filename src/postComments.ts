import template from 'lodash.template'
import { parsedCommits } from './parseCommits'

const fixId = '3' // 処理済みの状態 ID
const closeId = '4' // 完了の状態 ID
const updateIssueApiUrlTemplate = template(
  'https://<%=apiHost%>/api/v2/issues/<%=issueKey%>?apiKey=<%=apiKey%>'
) // 「課題情報の更新」APIのURLテンプレート
const commentTemplate = template(
  '<%=name%>さんがプッシュしました\n' +
    '<% commits.forEach(commit=>{%>' +
    '\n+ <%=commit.message%> ([<%=commit.idShort%>](<%=commit.url%>))' +
    '<% }); %>'
) // 通知文章のテンプレート

/**
 * BacklogのAPIにコメントを投稿する
 * @param {Object} パース済みコミットオブジェクト
 * @param {string} API_HOST
 * @param {string} API_KEY
 * @returns {Promise}
 * - resolve {any} Backlog APIからの返却(使わない)
 * - reject {Error} 送信に失敗
 */

const postComments = (
  API_HOST: string,
  API_KEY: string,
  parsedCommits: parsedCommits
): Promise<any> => {
  const promiseArray: Array<Promise<any>> = []
  // アクセスを並列で行うため、Promiseのリストを作る
  Object.values(parsedCommits).forEach((parsedCommit) => {
    // 各種パメータを作成
    // API URL
    const apiUrl = updateIssueApiUrlTemplate({
      apiHost: API_HOST,
      apiKey: API_KEY,
      issueKey: parsedCommit[0].issueKey
    })
    // コメント本文
    const comment = commentTemplate({
      commits: parsedCommit,
      ...parsedCommit[0]
    })
    // キーワード判定による状態変更
    const isFix = parsedCommit.map((commit) => commit.isFix).includes(true)
    const isClose = parsedCommit.map((commit) => commit.isClose).includes(true)
    const status = isClose
      ? { statusId: closeId }
      : isFix
        ? { statusId: fixId }
        : undefined

    // fetchのPromiseをリストに追加
    const fetchBody = {
      comment: comment,
      ...status
    }
    const fetchOptions = {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(fetchBody).toString()
    }
    promiseArray.push(fetch(apiUrl, fetchOptions).then(response => response.json()))

    // 投稿内容をログに残す
    console.info(`${parsedCommit[0].issueKey}:\n${comment}`)
    isFix && console.info(`${parsedCommit[0].issueKey}を処理済みにしました。`)
    isClose && console.info(`${parsedCommit[0].issueKey}を完了にしました。`)
  })

  // 準備したaxiosのPromiseを並列で実行する
  return Promise.all(promiseArray)
}

export default postComments
