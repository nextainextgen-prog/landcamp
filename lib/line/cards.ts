/**
 * LINE Flex card config + builder. Admins decorate each card type
 * (confirmation / reminder) in /admin/settings/cards; configs are stored in
 * app_settings (keys card_confirm / card_reminder) and rendered into LINE Flex
 * messages here with {{variable}} substitution.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LineCardConfig = {
  enabled: boolean;
  imageUrl: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
};

export type CardKey = "card_confirm" | "card_reminder";

export const CARD_DEFAULTS: Record<CardKey, LineCardConfig> = {
  card_confirm: {
    enabled: true,
    imageUrl: "",
    title: "ยืนยันการจองสำเร็จ ✅",
    body: "สวัสดีคุณ {{name}}\nรหัสจอง {{booking_code}}\nห้อง {{room}}\nเข้าพัก {{check_in}} – {{check_out}}\nยอดรวม {{total}} บาท\n\nขอบคุณที่จองกับ LandCamp Villa 🌲",
    buttonLabel: "ดูเอกสารการจอง",
    buttonUrl: "{{receipt_url}}",
  },
  card_reminder: {
    enabled: true,
    imageUrl: "",
    title: "ใกล้ถึงวันเข้าพักแล้ว! 📅",
    body: "คุณ {{name}} อีกไม่กี่วันก็จะถึงวันเข้าพัก\nรหัสจอง {{booking_code}}\nเช็คอิน {{check_in}}\n\nเดินทางปลอดภัยนะครับ 🚗",
    buttonLabel: "นำทางไป LandCamp",
    buttonUrl: "{{map_url}}",
  },
};

export async function getCardConfig(key: CardKey): Promise<LineCardConfig> {
  const fallback = CARD_DEFAULTS[key];
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (!data?.value) return fallback;
    return { ...fallback, ...(data.value as Partial<LineCardConfig>) };
  } catch {
    return fallback;
  }
}

export function applyVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

function httpsOrAllowed(url: string): boolean {
  return /^(https:\/\/|tel:|line:\/\/|mailto:)/.test(url);
}

/** Builds a LINE Flex message object from a card config + variables. */
export function buildCardFlex(config: LineCardConfig, vars: Record<string, string>) {
  const title = applyVars(config.title, vars).trim();
  const body = applyVars(config.body, vars).trim();
  const imageUrl = applyVars(config.imageUrl, vars).trim();
  const buttonLabel = applyVars(config.buttonLabel, vars).trim();
  const buttonUrl = applyVars(config.buttonUrl, vars).trim();

  const bodyContents: unknown[] = [];
  if (title) bodyContents.push({ type: "text", text: title, weight: "bold", size: "lg", wrap: true, color: "#2c3327" });
  if (body) bodyContents.push({ type: "text", text: body, wrap: true, size: "sm", color: "#555555", margin: "md" });

  const bubble: Record<string, unknown> = {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: bodyContents.length ? bodyContents : [{ type: "text", text: " " }] },
  };

  if (imageUrl.startsWith("https://")) {
    bubble.hero = { type: "image", url: imageUrl, size: "full", aspectRatio: "20:13", aspectMode: "cover" };
  }

  if (buttonLabel && httpsOrAllowed(buttonUrl)) {
    bubble.footer = {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#9a795b",
          action: { type: "uri", label: buttonLabel.slice(0, 40), uri: buttonUrl },
        },
      ],
    };
  }

  return { type: "flex", altText: (title || "LandCamp").slice(0, 390), contents: bubble };
}
