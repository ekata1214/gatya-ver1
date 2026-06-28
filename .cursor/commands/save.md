---
description: 全変更をコミットして push（メッセージはユーザーに確認）
---

# Save and publish (`/save`)

リポジトリ全体をコミットして `origin` に push する。`main` への push で **Deploy GitHub Pages** ワークフローが走る。

## 手順

1. **`git status`** と **`git diff`**（必要なら `git diff --staged`）でコミット内容を把握する。
2. **ユーザーにコミットメッセージ（メモ）を聞く**。このターンで既に指定されていればそれを使う。
3. **push 前に確認** — 提案メッセージと変更ファイルの要約を示し、明示的な承認（はい / OK など）を待つ。
4. 承認後:

   ```bash
   bash scripts/git-publish.sh "$(cat <<'EOF'
   <ユーザーのメモ>
   EOF
   )"
   ```

5. スクリプト出力を確認する（`COMMIT_OK` / `COMMIT_NOTHING`）。

## 完了報告（必須・日本語）

コマンド実行後、**必ず日本語**で結果を報告する。テンプレート:

**コミット＆push 成功:**
```
✅ 保存して push しました。

- コミットメッセージ: …
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

- **Never** `git push --force`、**never** amend（ユーザー明示かつ未 push の場合のみ例外）。
- **Never** `--no-verify`、**never** git config 変更。
- 確認ステップをスキップしない。
- 日時や汎用メッセージを勝手に使わない（`/save-now` 用）。
