import { track } from "@vercel/analytics";

/**
 * Product events: a fixed list of names and NO properties, so nothing about a user's money,
 * file or answers can be sent. Counts only. (Vercel custom events need a plan that supports them;
 * without it they are simply not recorded.)
 */
export type ProductEvent =
  | "statement_file_chosen"
  | "review_shown"
  | "review_question_answered"
  | "review_saved"
  | "review_compared_saved"
  | "review_reminder_added"
  | "review_full_report_opened";

export function logEvent(name: ProductEvent): void {
  try {
    track(name);
  } catch {
    // analytics must never break the tool
  }
}
