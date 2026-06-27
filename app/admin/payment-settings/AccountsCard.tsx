"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Modal,
  Select,
  Switch,
  Table,
  TextField,
} from "@heroui/react";
import { ActionButton } from "@/components/admin/ActionButton";
import { useConfirmAction } from "@/components/admin/useConfirmAction";
import { THAI_BANKS, bankLabel } from "@/lib/payment/banks";
import type {
  PaymentAccount,
  PaymentAccountInput,
  PaymentAccountType,
} from "./types";

const TYPE_OPTIONS: { key: PaymentAccountType; label: string }[] = [
  { key: "promptpay_phone", label: "PromptPay เบอร์" },
  { key: "promptpay_id", label: "PromptPay เลขบัตร" },
  { key: "bank_account", label: "บัญชีธนาคาร" },
  { key: "corporate", label: "นิติบุคคล" },
  { key: "qr_code", label: "QR Code ชำระเงิน" },
];

const TYPE_LABEL: Record<PaymentAccountType, string> = TYPE_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.key] = opt.label;
    return acc;
  },
  {} as Record<PaymentAccountType, string>,
);

type FormState = PaymentAccountInput;

const EMPTY_FORM: FormState = {
  type: "promptpay_phone",
  account_name: "",
  account_name_en: "",
  bank: null,
  account_number: "",
  qr_image: null,
  is_active: true,
};

function bankRequired(type: PaymentAccountType): boolean {
  return type === "bank_account" || type === "corporate";
}

function isQr(type: PaymentAccountType): boolean {
  return type === "qr_code";
}

function accountNumberHint(type: PaymentAccountType): string {
  switch (type) {
    case "promptpay_phone":
      return "เบอร์โทร 10 หลัก เช่น 0812345678";
    case "promptpay_id":
      return "เลขบัตรประชาชน 13 หลัก";
    case "bank_account":
      return "เลขที่บัญชีธนาคาร 10–12 หลัก";
    case "corporate":
      return "เลขที่บัญชีนิติบุคคล";
    case "qr_code":
      return "";
  }
}

function validate(input: FormState): string | null {
  if (!input.account_name.trim()) return "กรุณากรอกชื่อบัญชี";

  if (isQr(input.type)) {
    if (!input.qr_image) return "กรุณาอัปโหลดรูป QR Code";
    return null;
  }

  if (bankRequired(input.type) && !input.bank?.trim())
    return "กรุณาเลือกธนาคาร";
  const digits = (input.account_number ?? "").replace(/\D/g, "");
  if (!digits) return "กรุณากรอกเลขที่บัญชี";
  if (input.type === "promptpay_phone" && digits.length !== 10)
    return "เบอร์ PromptPay ต้องมี 10 หลัก";
  if (input.type === "promptpay_id" && digits.length !== 13)
    return "เลขบัตรประชาชนต้องมี 13 หลัก";
  if (input.type === "bank_account" && (digits.length < 10 || digits.length > 12))
    return "เลขที่บัญชีต้องอยู่ระหว่าง 10–12 หลัก";
  return null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AccountsCard({
  initialAccounts,
}: {
  initialAccounts: PaymentAccount[];
}) {
  const [accounts, setAccounts] = useState<PaymentAccount[]>(initialAccounts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const formId = useId();
  const qrFileRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirmAction();

  const rows = useMemo(() => accounts, [accounts]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(account: PaymentAccount) {
    setEditing(account);
    setForm({
      type: account.type,
      account_name: account.account_name,
      account_name_en: account.account_name_en ?? "",
      bank: account.bank,
      account_number: account.account_number ?? "",
      qr_image: account.qr_image,
      is_active: account.is_active,
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function onQrFile(file: File) {
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file);
    } catch {
      setError("อ่านไฟล์รูปไม่สำเร็จ");
      return;
    }
    setForm((f) => ({ ...f, qr_image: dataUrl }));

    // Best-effort: read the account holder name (TH/EN) off the QR image.
    setExtracting(true);
    try {
      const res = await fetch("/api/admin/qr-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ base64: dataUrl }),
      });
      const data = (await res.json()) as {
        name_th?: string | null;
        name_en?: string | null;
        found?: boolean;
      };
      if (data.found) {
        setForm((f) => ({
          ...f,
          account_name: f.account_name.trim() ? f.account_name : data.name_th ?? f.account_name,
          account_name_en: (f.account_name_en ?? "").trim()
            ? f.account_name_en
            : data.name_en ?? f.account_name_en,
        }));
      }
    } catch {
      // ignore — names can be typed manually
    } finally {
      setExtracting(false);
    }
  }

  async function toggleActive(account: PaymentAccount, next: boolean) {
    setBusyId(account.id);
    const prev = account.is_active;
    setAccounts((list) =>
      list.map((a) => (a.id === account.id ? { ...a, is_active: next } : a)),
    );
    try {
      const res = await fetch(`/api/admin/payment-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setAccounts((list) =>
        list.map((a) => (a.id === account.id ? { ...a, is_active: prev } : a)),
      );
    } finally {
      setBusyId(null);
    }
  }

  function deleteAccount(account: PaymentAccount) {
    confirm({
      title: "ลบบัญชี",
      message: `ลบบัญชี "${account.account_name}" ใช่หรือไม่?`,
      danger: true,
      confirmLabel: "ลบ",
      run: async () => {
        const res = await fetch(`/api/admin/payment-accounts/${account.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      },
      onSuccess: () => {
        setAccounts((list) => list.filter((a) => a.id !== account.id));
      },
    });
  }

  async function saveAccount() {
    const issue = validate(form);
    if (issue) {
      setError(issue);
      throw new Error(issue);
    }
    setError(null);
    setSubmitting(true);

    const qr = isQr(form.type);
    const payload: PaymentAccountInput = {
      type: form.type,
      account_name: form.account_name,
      account_name_en: (form.account_name_en ?? "").trim() ? form.account_name_en : null,
      is_active: form.is_active,
      bank: qr || !bankRequired(form.type) ? null : form.bank,
      account_number: qr ? null : form.account_number,
      qr_image: qr ? form.qr_image : null,
    };

    try {
      const res = editing
        ? await fetch(`/api/admin/payment-accounts/${editing.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/payment-accounts`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      const saved = ((await res.json()) as { account: PaymentAccount }).account;
      setAccounts((list) =>
        editing
          ? list.map((a) => (a.id === editing.id ? saved : a))
          : [...list, saved],
      );
      // Let the success check show briefly before closing the modal.
      setTimeout(() => closeModal(), 1200);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <Card>
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <div>
          <Card.Title>บัญชีรับเงิน</Card.Title>
          <Card.Description>
            จัดการ PromptPay, บัญชีธนาคาร, นิติบุคคล และ QR Code ชำระเงิน
          </Card.Description>
        </div>
        <Button onPress={openCreate} variant="primary" size="sm">
          + เพิ่มบัญชี
        </Button>
      </Card.Header>
      <Card.Content>
        <div className="mb-4 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden>
            <path d="M12 2 4 5v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V5l-8-3Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div className="flex flex-col gap-1">
            <span>
              ตั้งบัญชีรับเงิน <strong>ที่นี่ที่เดียว</strong> — บัญชีในหน้านี้ใช้ทั้ง <strong>แสดงให้ลูกค้าโอนเข้า</strong> และ
              <strong> ตรวจสลิปอัตโนมัติ</strong> (เทียบบัญชีปลายทางบนสลิปกับบัญชีที่เปิดใช้งานไว้ที่นี่) ไม่ต้องไปตั้งค่าบน EasySlip dashboard อีก
            </span>
            <span className="text-xs text-emerald-700/80">
              หมายเหตุ: ระบบเทียบจากเลขบัญชี 4 ตัวท้าย (EasySlip ปิดเลขกลางไว้) — ใส่เลขบัญชีให้ถูกต้องครบถ้วน
            </span>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            ยังไม่มีบัญชี — กด &ldquo;เพิ่มบัญชี&rdquo; เพื่อเริ่มต้น
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="รายการบัญชีรับเงิน">
                <Table.Header>
                  <Table.Column isRowHeader>ประเภท</Table.Column>
                  <Table.Column>ชื่อบัญชี</Table.Column>
                  <Table.Column>ธนาคาร</Table.Column>
                  <Table.Column>เลขที่บัญชี / QR</Table.Column>
                  <Table.Column>สถานะ</Table.Column>
                  <Table.Column>การจัดการ</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rows.map((account) => (
                    <Table.Row key={account.id}>
                      <Table.Cell>{TYPE_LABEL[account.type]}</Table.Cell>
                      <Table.Cell>{account.account_name}</Table.Cell>
                      <Table.Cell>{bankLabel(account.bank) || "—"}</Table.Cell>
                      <Table.Cell className="font-mono">
                        {account.type === "qr_code"
                          ? "🖼 QR"
                          : (account.account_number ?? "—")}
                      </Table.Cell>
                      <Table.Cell>
                        <Switch
                          isSelected={account.is_active}
                          isDisabled={busyId === account.id}
                          onChange={(next) => toggleActive(account, next)}
                          aria-label={`เปิดใช้งาน ${account.account_name}`}
                        >
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={busyId === account.id}
                            onPress={() => openEdit(account)}
                          >
                            แก้
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            isDisabled={busyId === account.id}
                            onPress={() => deleteAccount(account)}
                          >
                            ลบ
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card.Content>

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  {editing ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Form id={formId} className="flex flex-col gap-4">
                  <Select
                    selectedKey={form.type}
                    onSelectionChange={(key) => {
                      const next = String(key) as PaymentAccountType;
                      setForm((f) => ({
                        ...f,
                        type: next,
                        bank: bankRequired(next) ? (f.bank ?? "") : null,
                      }));
                    }}
                    aria-label="ประเภทบัญชี"
                  >
                    <Label>ประเภท</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {TYPE_OPTIONS.map((opt) => (
                          <ListBoxItem key={opt.key} id={opt.key}>
                            {opt.label}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <TextField
                    isRequired
                    value={form.account_name}
                    onChange={(value) => setForm((f) => ({ ...f, account_name: value }))}
                  >
                    <Label>ชื่อบัญชี (ไทย)</Label>
                    <Input placeholder="เช่น คุณสมชาย ใจดี" />
                    <FieldError />
                  </TextField>

                  <TextField
                    value={form.account_name_en ?? ""}
                    onChange={(value) => setForm((f) => ({ ...f, account_name_en: value }))}
                  >
                    <Label>ชื่อบัญชี (อังกฤษ)</Label>
                    <Input placeholder="e.g. MR. SOMCHAI JAIDEE" />
                  </TextField>

                  {isQr(form.type) ? (
                    <div className="flex flex-col gap-2">
                      <Label>QR Code รับเงิน</Label>
                      <p className="text-xs text-neutral-500">
                        กรอกเลขบัญชีอัตโนมัติผ่าน QR code รับเงิน
                      </p>
                      <input
                        ref={qrFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) onQrFile(f);
                          e.target.value = "";
                        }}
                      />
                      {form.qr_image ? (
                        <div className="flex flex-col items-center gap-2 rounded-md border border-neutral-200 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                          <img src={form.qr_image} alt="QR preview" className="h-40 w-40 object-contain" />
                          <Button size="sm" variant="ghost" onPress={() => qrFileRef.current?.click()}>
                            เปลี่ยนรูป QR
                          </Button>
                        </div>
                      ) : (
                        <Button variant="secondary" onPress={() => qrFileRef.current?.click()}>
                          อัพโหลด QR รับเงิน
                        </Button>
                      )}
                      {extracting && (
                        <p className="text-xs text-neutral-500">กำลังอ่านชื่อจาก QR…</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {bankRequired(form.type) ? (
                        <Select
                          selectedKey={form.bank ?? ""}
                          onSelectionChange={(key) =>
                            setForm((f) => ({ ...f, bank: String(key) }))
                          }
                          aria-label="ธนาคาร"
                        >
                          <Label>ธนาคาร</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {THAI_BANKS.map((b) => (
                                <ListBoxItem key={b.value} id={b.value}>
                                  {b.label}
                                </ListBoxItem>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      ) : null}

                      <TextField
                        isRequired
                        value={form.account_number ?? ""}
                        onChange={(value) =>
                          setForm((f) => ({ ...f, account_number: value }))
                        }
                      >
                        <Label>เลขที่บัญชี</Label>
                        <Input placeholder={accountNumberHint(form.type)} />
                        <p className="text-xs text-neutral-500">
                          {accountNumberHint(form.type)}
                        </p>
                        <FieldError />
                      </TextField>
                    </>
                  )}

                  <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                    <div className="text-sm">เปิดใช้งาน</div>
                    <Switch
                      isSelected={form.is_active}
                      onChange={(next) => setForm((f) => ({ ...f, is_active: next }))}
                      aria-label="เปิดใช้งานบัญชีนี้"
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </div>

                  {error ? (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  ) : null}
                </Form>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" onPress={closeModal} isDisabled={submitting}>
                  ยกเลิก
                </Button>
                <ActionButton
                  variant="primary"
                  size="md"
                  onClick={saveAccount}
                  pendingLabel="กำลังบันทึก…"
                  doneLabel="สำเร็จ"
                  onError={(e) =>
                    setError(
                      e instanceof Error
                        ? e.message
                        : "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
                    )
                  }
                >
                  บันทึก
                </ActionButton>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
    {dialog}
    </>
  );
}
