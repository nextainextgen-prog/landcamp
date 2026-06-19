"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
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
  useOverlayState,
} from "@heroui/react";
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
  name: "",
  bank: null,
  account_number: "",
  is_active: true,
};

function bankRequired(type: PaymentAccountType): boolean {
  return type !== "promptpay_phone";
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
  }
}

function validate(input: FormState): string | null {
  if (!input.name.trim()) return "กรุณากรอกชื่อบัญชี";
  if (bankRequired(input.type) && !input.bank?.trim())
    return "กรุณากรอกชื่อธนาคาร";
  const digits = input.account_number.replace(/\D/g, "");
  if (!digits) return "กรุณากรอกเลขที่บัญชี";
  if (input.type === "promptpay_phone" && digits.length !== 10)
    return "เบอร์ PromptPay ต้องมี 10 หลัก";
  if (input.type === "promptpay_id" && digits.length !== 13)
    return "เลขบัตรประชาชนต้องมี 13 หลัก";
  if (input.type === "bank_account" && (digits.length < 10 || digits.length > 12))
    return "เลขที่บัญชีต้องอยู่ระหว่าง 10–12 หลัก";
  return null;
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
  const modal = useOverlayState();
  const formId = useId();

  const rows = useMemo(() => accounts, [accounts]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    modal.open();
  }

  function openEdit(account: PaymentAccount) {
    setEditing(account);
    setForm({
      type: account.type,
      name: account.name,
      bank: account.bank,
      account_number: account.account_number,
      is_active: account.is_active,
    });
    setError(null);
    modal.open();
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
        list.map((a) =>
          a.id === account.id ? { ...a, is_active: prev } : a,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAccount(account: PaymentAccount) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`ลบบัญชี "${account.name}" ใช่หรือไม่?`)
    )
      return;
    setBusyId(account.id);
    const snapshot = accounts;
    setAccounts((list) => list.filter((a) => a.id !== account.id));
    try {
      const res = await fetch(`/api/admin/payment-accounts/${account.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setAccounts(snapshot);
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validate(form);
    if (issue) {
      setError(issue);
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload: PaymentAccountInput = {
      ...form,
      bank: bankRequired(form.type) ? form.bank : null,
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
      if (!res.ok) throw new Error("failed");
      const saved = (await res.json()) as PaymentAccount;
      setAccounts((list) =>
        editing
          ? list.map((a) => (a.id === editing.id ? saved : a))
          : [...list, saved],
      );
      modal.close();
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <div>
          <Card.Title>บัญชีรับเงิน</Card.Title>
          <Card.Description>
            จัดการ PromptPay, บัญชีธนาคาร, และบัญชีนิติบุคคล
          </Card.Description>
        </div>
        <Button onPress={openCreate} variant="primary" size="sm">
          + เพิ่มบัญชี
        </Button>
      </Card.Header>
      <Card.Content>
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
                  <Table.Column>เลขที่บัญชี</Table.Column>
                  <Table.Column>สถานะ</Table.Column>
                  <Table.Column>การจัดการ</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rows.map((account) => (
                    <Table.Row key={account.id}>
                      <Table.Cell>{TYPE_LABEL[account.type]}</Table.Cell>
                      <Table.Cell>{account.name}</Table.Cell>
                      <Table.Cell>{account.bank ?? "—"}</Table.Cell>
                      <Table.Cell className="font-mono">
                        {account.account_number}
                      </Table.Cell>
                      <Table.Cell>
                        <Switch
                          isSelected={account.is_active}
                          isDisabled={busyId === account.id}
                          onChange={(next) => toggleActive(account, next)}
                          aria-label={`เปิดใช้งาน ${account.name}`}
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

      <Modal state={modal}>
        <Modal.Backdrop />
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {editing ? "แก้ไขบัญชี" : "เพิ่มบัญชีใหม่"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
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
                  value={form.name}
                  onChange={(value) => setForm((f) => ({ ...f, name: value }))}
                >
                  <Label>ชื่อบัญชี</Label>
                  <Input placeholder="เช่น คุณสมชาย ใจดี" />
                  <FieldError />
                </TextField>

                {bankRequired(form.type) ? (
                  <TextField
                    isRequired
                    value={form.bank ?? ""}
                    onChange={(value) =>
                      setForm((f) => ({ ...f, bank: value }))
                    }
                  >
                    <Label>ธนาคาร</Label>
                    <Input placeholder="เช่น ธนาคารกสิกรไทย" />
                    <FieldError />
                  </TextField>
                ) : null}

                <TextField
                  isRequired
                  value={form.account_number}
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

                <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                  <div className="text-sm">เปิดใช้งาน</div>
                  <Switch
                    isSelected={form.is_active}
                    onChange={(next) =>
                      setForm((f) => ({ ...f, is_active: next }))
                    }
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
              <Button
                variant="ghost"
                onPress={modal.close}
                isDisabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                type="submit"
                form={formId}
                isDisabled={submitting}
              >
                {submitting ? "กำลังบันทึก…" : "บันทึก"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </Card>
  );
}
