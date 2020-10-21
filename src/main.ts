import getEnvs from './getEnvs'
import fetchCommits from './fetchCommits'
import parseCommits from './parseCommits'
import postComments from './postComments'

(async (): Promise<any> => {
  // 環境変数の読み込み
  const { PROJECT_KEY, API_HOST, API_KEY, GITHUB_EVENT_PATH } = await getEnvs()

  // event.json の読み込み
  const commits = await fetchCommits(GITHUB_EVENT_PATH)

  // コミットの解析
  const parsedCommits = await parseCommits(commits, PROJECT_KEY)

  // バックログAPIへ送信
  const response = await postComments(API_HOST, API_KEY, parsedCommits)

  return Promise.resolve(response)
})()
  .then(() =>
    // 正常終了(catchに送るためreject)
    Promise.reject('正常に送信しました。')
  )
  .catch((error) => {
    // String ならば、info ログを残し正常終了。
    // Error ならば、error ログを残し異常終了。
    if (typeof error === 'string') {
      console.info(error)
      process.exit(0)
    }
    console.error(error)
    process.exit(1)
  })
