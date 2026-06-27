import type { ReactNode } from "react";

/**
 * Shared inline-SVG icon set for the whole /admin/settings area.
 * Single source of truth used by the settings hub, the persistent sidebar
 * and the section sub-pages — no emoji anywhere.
 */
export const SETTINGS_ICON_PATHS: Record<string, ReactNode> = {
  finance: <><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10.5h19M16 14.5h2.5" /></>,
  receipt: <><path d="M6 2.5h12v19l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z" /><path d="M9 8h6M9 12h6" /></>,
  kpi: <><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></>,
  users: <><circle cx="9" cy="8" r="3.3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3.3 3.3 0 0 1 0 6.4M21 20c0-2.5-1.4-4.7-3.5-5.6" /></>,
  customer: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" /><path d="M9 12l2 2 4-4" /></>,
  chat: <><path d="M21 11.4c0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L4 20.5l1.2-3.7A7.3 7.3 0 0 1 3 11.4C3 7.2 7 3.8 12 3.8s9 3.4 9 7.6Z" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.4" /><path d="M21 16l-5-5-8 8" /></>,
  email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7.5 9 6 9-6" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  template: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  cms: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  audit: <><path d="M4 6h9M4 12h6M4 18h6" /><circle cx="17.5" cy="15.5" r="3.5" /><path d="M17.5 14v1.6l1.2 1" /></>,
  privacy: <><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6Z" /><circle cx="12" cy="11" r="1.6" /><path d="M12 12.6V15" /></>,
  backup: <><path d="M12 3v11M12 14l-3.5-3.5M12 14l3.5-3.5" /><path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></>,
  // EasySlip / payments verification (Phase 2)
  slip: <><rect x="4" y="2.5" width="16" height="19" rx="2" /><path d="M8 7h8M8 11h8M8 15h5" /><circle cx="17" cy="17" r="3.6" fill="white" /><path d="m15.4 17 1.1 1.1 2-2.2" /></>,
  // Pop-up announcement (Phase 4)
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1Z" /><path d="M18 8a4 4 0 0 1 0 8" /></>,
  // generic action icons reused across panels
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><path d="M7.5 15h9" /></>,
  // chrome
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 8 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 14H4a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 5.7 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 16 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></>,
};

export function SettingIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {SETTINGS_ICON_PATHS[name] ?? SETTINGS_ICON_PATHS.clock}
    </svg>
  );
}
