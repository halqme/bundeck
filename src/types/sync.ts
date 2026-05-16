/** 同期メッセージの型定義 */
export type SyncMessage =
  | { type: "navigate"; index: number }
  | { type: "pointer"; x: number; y: number; active: boolean };
