import fs from 'fs'

interface commit {
  author: {
    email: string
    name: string
    username: string
  }
  committer: {
    email: string
    name: string
    username: string
  }
  distinct: boolean
  id: string
  message: string
  timestamp: string
  tree_id: string
  url: string
}

export interface commits {
  commits: commit[]
}

/**
 * GitHub の event.json からコミット情報の JSON を取得してパースする
 *
 * @param {string} event.json へのパス
 * @returns {Promise}
 * - resolve {Object} パースされた commits オブジェクト
 * - reject {Error} 取得できない場合、想定しない JSON の場合
 * - reject {string} コミットが1件もない場合
 */

const fetchCommits = async (path: string): Promise<commits> =>
  await readFile(path)
    .then((json) => JSON.parse(json))
    .then(async (data) => {
      if (!Array.isArray(data?.commits)) {
        return await Promise.reject('コミットが1件もありません。')
      }
      if (data.commits.length === 0) {
        return await Promise.reject('コミットが1件もありません。')
      }
      return await Promise.resolve(data)
    })

/**
 * ファイルを読み込む
 *
 * @param path パス
 * @returns {Promise}
 * - resolve {string} ファイルの内容
 * - reject {Error} I/O エラー
 */

const readFile = async (path: string): Promise<string> =>
  await new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err != null) reject(err)
      resolve(data)
    })
  })

export default fetchCommits
