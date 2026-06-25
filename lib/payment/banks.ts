// Thai banks for the payment-account dropdown. `value` is stored in
// payment_accounts.bank; `label` is the Thai display name.
export const THAI_BANKS: { value: string; label: string }[] = [
  { value: "bbl", label: "ธนาคารกรุงเทพ" },
  { value: "kbank", label: "ธนาคารกสิกรไทย" },
  { value: "ktb", label: "ธนาคารกรุงไทย" },
  { value: "ttb", label: "ธนาคารทหารไทยธนชาต" },
  { value: "scb", label: "ธนาคารไทยพาณิชย์" },
  { value: "bay", label: "ธนาคารกรุงศรีอยุธยา" },
  { value: "kkp", label: "ธนาคารเกียรตินาคินภัทร" },
  { value: "cimb", label: "ธนาคารซีไอเอ็มบีไทย" },
  { value: "tisco", label: "ธนาคารทิสโก้" },
  { value: "uob", label: "ธนาคารยูโอบี" },
  { value: "scbt", label: "ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)" },
  { value: "lhbank", label: "ธนาคารแลนด์ แอนด์ เฮ้าส์" },
  { value: "gsb", label: "ธนาคารออมสิน" },
  { value: "baac", label: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)" },
  { value: "ghb", label: "ธนาคารอาคารสงเคราะห์" },
  { value: "ibank", label: "ธนาคารอิสลามแห่งประเทศไทย" },
];

const BANK_LABELS = new Map(THAI_BANKS.map((b) => [b.value, b.label]));

/** Display label for a stored bank value; falls back to the raw value. */
export function bankLabel(value: string | null): string {
  if (!value) return "";
  return BANK_LABELS.get(value) ?? value;
}
