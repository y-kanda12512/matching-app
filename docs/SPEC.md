# マッチングアプリ仕様書

## 概要

いいねを送り、相手が許可（いいね返し）したらメッセージ交換ができるマッチングアプリ。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| バックエンド/DB | Firebase (Auth, Firestore, Storage) |
| デプロイ | Vercel（想定） |

---

## 機能一覧とコミット計画

機能ごとにコミットするため、以下の順番で段階的に実装する。

### Phase 1: プロジェクト初期セットアップ

- Next.js + TypeScript + Tailwind CSS のプロジェクト作成
- Firebase クライアント設定
- 共通レイアウト（ヘッダー、ナビゲーション）

### Phase 2: 認証機能

- メールアドレス + パスワードによるサインアップ
- ログイン / ログアウト
- 認証状態の管理（AuthContext）
- 認証関連のUIページ（ログイン画面、サインアップ画面）

### Phase 3: プロフィール機能

- プロフィール作成・編集画面
- プロフィール情報:
  - ニックネーム（必須）
  - 自己紹介文（任意）
  - 年齢（必須）
  - 性別（必須）
  - プロフィール画像（Firebase Storage）
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
- Firestore のリアルタイムリスナーによるリアルタイム更新
- メッセージ一覧（トーク一覧）画面
- 未読メッセージの表示

---

## Firestore データ構造

### users コレクション

```
users/{uid}
├── nickname: string        // ニックネーム
├── bio: string             // 自己紹介
├── age: number             // 年齢
├── gender: string          // 性別（male / female / other）
├── avatarUrl: string       // プロフィール画像URL
├── createdAt: timestamp    // 作成日時
└── updatedAt: timestamp    // 更新日時
```

### likes コレクション

```
likes/{likeId}
├── fromUserId: string      // いいねした側の uid
├── toUserId: string        // いいねされた側の uid
└── createdAt: timestamp    // いいね日時
```

### matches コレクション

```
matches/{matchId}
├── userIds: string[]       // マッチしたユーザー2人の uid 配列
├── user1Id: string         // ユーザー1の uid
├── user2Id: string         // ユーザー2の uid
└── createdAt: timestamp    // マッチ成立日時
```

### messages サブコレクション

```
matches/{matchId}/messages/{messageId}
├── senderId: string        // 送信者の uid
├── content: string         // メッセージ本文
├── isRead: boolean         // 既読フラグ
└── createdAt: timestamp    // 送信日時
```

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

## Firestore セキュリティルール

- **users**: 誰でも閲覧可能、本人のみ編集可能
- **likes**: 本人が送ったいいねの作成・閲覧、自分宛てのいいねの閲覧
- **matches**: マッチした当事者のみ閲覧可能
- **messages**: マッチした当事者のみ送信・閲覧可能
