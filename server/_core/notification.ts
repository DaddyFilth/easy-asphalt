import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log("[Notification] Owner notification skipped (no Forge service):", payload.title);
  return true;
}
