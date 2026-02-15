# マッチングアプリ仕様書

## 概要

いいねを送り、相手が許可（いいね返し）したらメッセージ交換ができるマッチングアプリ。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド/DB | Supabase (Auth, PostgreSQL, Realtime) |
| デプロイ | Vercel（想定） |

---

## 機能一覧とコミット計画

機能ごとにコミットするため、以下の順番で段階的に実装する。

### Phase 1: プロジェクト初期セットアップ

- Next.js + TypeScript + Tailwind CSS のプロジェクト作成
- Supabase クライアント設定
- 共通レイアウト（ヘッダー、ナビゲーション）

### Phase 2: 認証機能

- メールアドレス + パスワードによるサインアップ
- ログイン / ログアウト
- 認証状態によるページ保護（ミドルウェア）
- 認証関連のUIページ（ログイン画面、サインアップ画面）

### Phase 3: プロフィール機能

- プロフィール作成・編集画面
- プロフィール情報:
  - ニックネーム（必須）
  - 自己紹介文（任意）
  - 年齢（必須）
  - 性別（必須）
  - プロフィール画像（Supabase Storage）
- プロフィール表示画面

### Phase 4: ユーザー一覧・いいね機能

- ユーザー一覧画面（自分以外のユーザーをカード形式で表示）
- いいねボタン（相手にいいねを送る）
- いいね済みの状態管理（重複いいね防止）
- 自分が送ったいいね一覧
- 自分に届いたいいね一覧

### Phase 5: マッチング機能

- 相互いいねの検出 → マッチング成立
- マッチング成立時の通知表示
- マッチング一覧画面（マッチした相手の一覧）

### Phase 6: メッセージ機能

- マッチした相手とのメッセージ画面
- メッセージの送信・受信
- Supabase Realtime によるリアルタイム更新
- メッセージ一覧（トーク一覧）画面
- 未読メッセージの表示

---

## データベース設計

### profiles テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | auth.users.id と一致 |
| nickname | text | ニックネーム |
| bio | text | 自己紹介 |
| age | integer | 年齢 |
| gender | text | 性別（male / female / other） |
| avatar_url | text | プロフィール画像URL |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |

### likes テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | |
| from_user_id | uuid (FK) | いいねした側の user id |
| to_user_id | uuid (FK) | いいねされた側の user id |
| created_at | timestamptz | いいね日時 |

- ユニーク制約: (from_user_id, to_user_id)

### matches テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | |
| user1_id | uuid (FK) | マッチしたユーザー1 |
| user2_id | uuid (FK) | マッチしたユーザー2 |
| created_at | timestamptz | マッチ成立日時 |

- ユニーク制約: (user1_id, user2_id)
- user1_id < user2_id の順序で格納（重複防止）

### messages テーブル

| カラム | 型 | 説明 |
|--------|------|------|
| id | uuid (PK) | |
| match_id | uuid (FK) | 対応するマッチ |
| sender_id | uuid (FK) | 送信者の user id |
| content | text | メッセージ本文 |
| is_read | boolean | 既読フラグ |
| created_at | timestamptz | 送信日時 |

---

## 画面一覧

| 画面 | パス | 説明 |
|------|------|------|
| ログイン | /login | メール+パスワードでログイン |
| サインアップ | /signup | 新規ユーザー登録 |
| ユーザー一覧 | / | 他ユーザーをカード形式で表示 |
| プロフィール編集 | /profile/edit | 自分のプロフィール編集 |
| プロフィール詳細 | /profile/[id] | ユーザーのプロフィール詳細 |
| いいね一覧 | /likes | 送った/もらったいいね一覧 |
| マッチング一覧 | /matches | マッチした相手の一覧 |
| メッセージ | /messages | トーク一覧 |
| トーク画面 | /messages/[matchId] | 個別のメッセージ画面 |

---

## RLS（Row Level Security）ポリシー

- **profiles**: 誰でも閲覧可能、本人のみ編集可能
- **likes**: 本人が送ったいいねの作成・閲覧、自分宛てのいいねの閲覧
- **matches**: マッチした当事者のみ閲覧可能
- **messages**: マッチした当事者のみ送信・閲覧可能
