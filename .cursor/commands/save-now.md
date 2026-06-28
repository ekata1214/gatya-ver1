---
description: 全変更を UTC ISO 日時メッセージで即コミット＆push
---

# Save now (`/save-now`)

確認なしで全変更をコミットして push する。コミットメッセージは **UTC の ISO 8601 日時**（例: `2026-06-28T07:55:00Z`）。

## 手順

1. **`git status`** を簡潔に確認する。
2. 即実行（確認しない）:

   ```bash
   MSG="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
   bash scripts/git-publish.sh "$MSG"
   ```

3. スクリプト出力を確認する（`COMMIT_OK` / `COMMIT_NOTHING`）。

## 完了報告（必須・日本語）

コマンド実行後、**必ず日本語**で結果を報告する。テンプレート:

**コミット＆push 成功:**
```
✅ 日時メッセージで保存して push しました。

- コミットメッセージ: 2026-06-28T07:55:00Z
- コミット: abc1234（main）
- GitHub Pages が再デプロイされます（Actions 有効時）
```

**コミットする変更がなかった場合:**
```
ℹ️ コミットする変更はありませんでした。push は行っていません。
```

**失敗した場合:**
```
❌ 保存に失敗しました。

- 理由: （エラー内容）
```

## ルール

- **Never** `git push --force`、**never** amend、**never** `--no-verify`、**never** git config 変更。
- メッセージや確認を求めない（それは `/save` 用）。
