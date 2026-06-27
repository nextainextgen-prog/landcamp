/**
 * แปลงจำนวนเงิน (บาท) เป็นข้อความภาษาไทย เช่น 3500 → "สามพันห้าร้อยบาทถ้วน"
 * รองรับสตางค์และหลักล้าน
 */
const DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function readGroup(numStr: string): string {
  let result = "";
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const d = Number(numStr[i]);
    const place = len - 1 - i;
    if (d === 0) continue;
    if (place === 0 && d === 1 && len > 1) result += "เอ็ด";
    else if (place === 1 && d === 2) result += "ยี่สิบ";
    else if (place === 1 && d === 1) result += "สิบ";
    else result += DIGITS[d] + PLACES[place];
  }
  return result;
}

function readInt(n: number): string {
  const s = String(n);
  if (s === "0") return "ศูนย์";
  if (s.length > 6) {
    const high = s.slice(0, s.length - 6);
    const low = s.slice(s.length - 6);
    return readGroup(high) + "ล้าน" + (Number(low) === 0 ? "" : readGroup(low));
  }
  return readGroup(s);
}

export function bahtText(amount: number): string {
  const baht = Math.floor(amount);
  const satang = Math.round((amount - baht) * 100);
  let s = readInt(baht) + "บาท";
  s += satang > 0 ? readInt(satang) + "สตางค์" : "ถ้วน";
  return s;
}
