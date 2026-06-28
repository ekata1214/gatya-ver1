---
description: 変更を git stash に退避（作業ツリーを一時保存）
---

# Trash (`/trash`)

未コミットの変更を **`git stash`** で退避する。作業ツリーをきれいにしたいときに使う。

## 手順

1. 実行前に **`git status`** で退避対象を確認する。
2. 実行:

   ```bash
   bash scripts/git-stash.sh
   ```

3. スクリプト出力を確認する（`STASH_OK` / `STASH_NOTHING`）。

## 完了報告（必須・日本語）

コマンド実行後、**必ず日本語**で結果を報告する。テンプレート:

**退避できた場合:**
```
✅ 変更を stash に退避しました。

- 最新の stash: stash@{0}: …
- 作業ツリーはクリーンです。
- 戻すとき: git stash pop
```

**退避する変更がなかった場合:**
```
ℹ️ 退避する変更はありませんでした。作業ツリーはすでにクリーンです。
```

**失敗した場合:**
```
❌ stash に失敗しました。

- 理由: （エラー内容）
```

## ルール

- **Never** `git stash drop` や `git reset --hard` を勝手に実行しない。
- **Never** git config を変更しない。
- ユーザーが明示しない限り `git stash pop` は実行しない。
