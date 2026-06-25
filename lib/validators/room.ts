// Runtime validator for admin room create/update payloads (no zod).

export type RoomType = "villa-1bed" | "villa-2bed" | "train" | "camper";

const ROOM_TYPES: readonly RoomType[] = ["villa-1bed", "villa-2bed", "train", "camper"];

export interface RoomInput {
  slug?: string;
  room_type?: RoomType;
  name_th?: string;
  name_en?: string;
  description_th?: string;
  description_en?: string;
  price_weekday?: number;
  price_weekend?: number;
  max_guests?: number;
  is_available?: boolean;
  display_order?: number;
  /** jsonb: [{ src, alt: {th,en} }] */
  images?: unknown[];
  /** jsonb: [{ th, en }] */
  amenities?: unknown[];
  /** jsonb: { startingPrice, bedSize, roomSize, layout, breakfast, extraBed, services, checkIn, checkOut, badge } */
  details?: Record<string, unknown>;
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}
function int(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

export function validateRoomInput(
  input: unknown,
  options: { partial?: boolean } = {},
): ValidationResult<RoomInput> {
  if (!isObj(input)) return { ok: false, errors: { _root: "Body must be an object." } };
  const partial = options.partial === true;
  const errors: Record<string, string> = {};
  const data: RoomInput = {};

  const reqStr = (key: keyof RoomInput, field: string) => {
    if (input[field] !== undefined) {
      const s = str(input[field]);
      if (s === null) errors[field] = `${field} must be a non-empty string.`;
      else (data[key] as string) = s;
    } else if (!partial) {
      errors[field] = `${field} is required.`;
    }
  };

  reqStr("slug", "slug");
  reqStr("name_th", "name_th");
  reqStr("name_en", "name_en");
  reqStr("description_th", "description_th");
  reqStr("description_en", "description_en");

  if (input.room_type !== undefined) {
    if (typeof input.room_type !== "string" || !ROOM_TYPES.includes(input.room_type as RoomType)) {
      errors.room_type = `room_type must be one of: ${ROOM_TYPES.join(", ")}.`;
    } else {
      data.room_type = input.room_type as RoomType;
    }
  } else if (!partial) {
    errors.room_type = "room_type is required.";
  }

  const reqInt = (
    key: keyof RoomInput,
    field: string,
    min: number,
    required: boolean,
  ) => {
    if (input[field] !== undefined) {
      const n = int(input[field]);
      if (n === null || n < min) errors[field] = `${field} must be an integer >= ${min}.`;
      else (data[key] as number) = n;
    } else if (!partial && required) {
      errors[field] = `${field} is required.`;
    }
  };

  reqInt("price_weekday", "price_weekday", 0, true);
  reqInt("price_weekend", "price_weekend", 0, true);
  reqInt("max_guests", "max_guests", 1, true);
  reqInt("display_order", "display_order", 0, false);

  if (input.is_available !== undefined) {
    if (typeof input.is_available !== "boolean") errors.is_available = "is_available must be a boolean.";
    else data.is_available = input.is_available;
  }

  // jsonb passthrough (shape validated lightly).
  if (input.images !== undefined) {
    if (!Array.isArray(input.images)) errors.images = "images must be an array.";
    else data.images = input.images;
  }
  if (input.amenities !== undefined) {
    if (!Array.isArray(input.amenities)) errors.amenities = "amenities must be an array.";
    else data.amenities = input.amenities;
  }
  if (input.details !== undefined) {
    if (!isObj(input.details)) errors.details = "details must be an object.";
    else data.details = input.details;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data };
}
