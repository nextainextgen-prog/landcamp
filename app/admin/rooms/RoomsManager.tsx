"use client";

import { useId, useState, type FormEvent } from "react";
import {
  Button,
  Card,
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

export type AdminRoom = {
  id: string;
  slug: string;
  room_type: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  price_weekday: number;
  price_weekend: number;
  max_guests: number;
  is_available: boolean;
  display_order: number;
};

const ROOM_TYPES = [
  { key: "villa-1bed", label: "วิลล่า 1 ห้องนอน" },
  { key: "villa-2bed", label: "วิลล่า 2 ห้องนอน" },
  { key: "train", label: "ตู้รถไฟ" },
  { key: "camper", label: "รถแคมป์" },
];

type FormState = {
  slug: string;
  room_type: string;
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  price_weekday: string;
  price_weekend: string;
  max_guests: string;
  display_order: string;
  is_available: boolean;
};

function toForm(r?: AdminRoom): FormState {
  return {
    slug: r?.slug ?? "",
    room_type: r?.room_type ?? "villa-1bed",
    name_th: r?.name_th ?? "",
    name_en: r?.name_en ?? "",
    description_th: r?.description_th ?? "",
    description_en: r?.description_en ?? "",
    price_weekday: String(r?.price_weekday ?? ""),
    price_weekend: String(r?.price_weekend ?? ""),
    max_guests: String(r?.max_guests ?? ""),
    display_order: String(r?.display_order ?? 0),
    is_available: r?.is_available ?? true,
  };
}

export function RoomsManager({ initialRooms }: { initialRooms: AdminRoom[] }) {
  const [rooms, setRooms] = useState<AdminRoom[]>(initialRooms);
  const [editing, setEditing] = useState<AdminRoom | null>(null);
  const [form, setForm] = useState<FormState>(toForm());
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  function openCreate() {
    setEditing(null);
    setForm(toForm());
    setError(null);
    setOpen(true);
  }
  function openEdit(r: AdminRoom) {
    setEditing(r);
    setForm(toForm(r));
    setError(null);
    setOpen(true);
  }

  async function toggleAvailable(room: AdminRoom, next: boolean) {
    setBusyId(room.id);
    setRooms((list) => list.map((r) => (r.id === room.id ? { ...r, is_available: next } : r)));
    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_available: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRooms((list) => list.map((r) => (r.id === room.id ? { ...r, is_available: !next } : r)));
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...(editing ? {} : { slug: form.slug.trim(), room_type: form.room_type }),
      room_type: form.room_type,
      name_th: form.name_th,
      name_en: form.name_en,
      description_th: form.description_th,
      description_en: form.description_en,
      price_weekday: Number(form.price_weekday),
      price_weekend: Number(form.price_weekend),
      max_guests: Number(form.max_guests),
      display_order: Number(form.display_order) || 0,
      is_available: form.is_available,
    };
    if (
      !payload.name_th ||
      !payload.name_en ||
      !Number.isFinite(payload.price_weekday) ||
      !Number.isFinite(payload.price_weekend) ||
      !payload.max_guests
    ) {
      setError("กรุณากรอกชื่อ ราคา และจำนวนผู้เข้าพักให้ครบ");
      return;
    }
    setSubmitting(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/rooms/${editing.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/rooms`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error();
      const saved = ((await res.json()) as { room: AdminRoom }).room;
      setRooms((list) =>
        editing ? list.map((r) => (r.id === editing.id ? saved : r)) : [...list, saved],
      );
      setOpen(false);
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <div>
          <Card.Title>รายการห้องพัก</Card.Title>
          <Card.Description>{rooms.length} ห้อง</Card.Description>
        </div>
        <Button onPress={openCreate} variant="primary" size="sm">
          + เพิ่มห้อง
        </Button>
      </Card.Header>
      <Card.Content>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="ห้องพัก">
              <Table.Header>
                <Table.Column isRowHeader>ชื่อ</Table.Column>
                <Table.Column>ธรรมดา</Table.Column>
                <Table.Column>วันหยุด</Table.Column>
                <Table.Column>พักได้</Table.Column>
                <Table.Column>เปิดจอง</Table.Column>
                <Table.Column>จัดการ</Table.Column>
              </Table.Header>
              <Table.Body>
                {rooms.map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Cell>
                      <div className="font-medium">{r.name_th}</div>
                      <div className="text-xs text-neutral-500">{r.slug}</div>
                    </Table.Cell>
                    <Table.Cell>฿{r.price_weekday.toLocaleString("en-US")}</Table.Cell>
                    <Table.Cell>฿{r.price_weekend.toLocaleString("en-US")}</Table.Cell>
                    <Table.Cell>{r.max_guests}</Table.Cell>
                    <Table.Cell>
                      <Switch
                        isSelected={r.is_available}
                        isDisabled={busyId === r.id}
                        onChange={(next) => toggleAvailable(r, next)}
                        aria-label={`เปิดจอง ${r.name_th}`}
                      >
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="sm" variant="secondary" onPress={() => openEdit(r)}>
                        แก้
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Card.Content>

      <Modal isOpen={open} onOpenChange={setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editing ? "แก้ไขห้อง" : "เพิ่มห้องใหม่"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <Form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
                  {!editing && (
                    <TextField
                      isRequired
                      value={form.slug}
                      onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
                    >
                      <Label>slug (ตัวระบุห้อง เช่น villa-1)</Label>
                      <Input placeholder="villa-1" />
                    </TextField>
                  )}

                  <Select
                    selectedKey={form.room_type}
                    onSelectionChange={(k) => setForm((f) => ({ ...f, room_type: String(k) }))}
                    aria-label="ประเภทห้อง"
                  >
                    <Label>ประเภท</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {ROOM_TYPES.map((o) => (
                          <ListBoxItem key={o.key} id={o.key}>
                            {o.label}
                          </ListBoxItem>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <TextField isRequired value={form.name_th} onChange={(v) => setForm((f) => ({ ...f, name_th: v }))}>
                      <Label>ชื่อ (ไทย)</Label>
                      <Input />
                    </TextField>
                    <TextField isRequired value={form.name_en} onChange={(v) => setForm((f) => ({ ...f, name_en: v }))}>
                      <Label>ชื่อ (อังกฤษ)</Label>
                      <Input />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <TextField value={form.price_weekday} onChange={(v) => setForm((f) => ({ ...f, price_weekday: v }))}>
                      <Label>ราคาธรรมดา</Label>
                      <Input inputMode="numeric" />
                    </TextField>
                    <TextField value={form.price_weekend} onChange={(v) => setForm((f) => ({ ...f, price_weekend: v }))}>
                      <Label>ราคาวันหยุด</Label>
                      <Input inputMode="numeric" />
                    </TextField>
                    <TextField value={form.max_guests} onChange={(v) => setForm((f) => ({ ...f, max_guests: v }))}>
                      <Label>พักได้ (คน)</Label>
                      <Input inputMode="numeric" />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <TextField value={form.description_th} onChange={(v) => setForm((f) => ({ ...f, description_th: v }))}>
                      <Label>คำอธิบาย (ไทย)</Label>
                      <Input />
                    </TextField>
                    <TextField value={form.description_en} onChange={(v) => setForm((f) => ({ ...f, description_en: v }))}>
                      <Label>คำอธิบาย (อังกฤษ)</Label>
                      <Input />
                    </TextField>
                  </div>

                  <div className="grid grid-cols-2 items-center gap-3">
                    <TextField value={form.display_order} onChange={(v) => setForm((f) => ({ ...f, display_order: v }))}>
                      <Label>ลำดับแสดง</Label>
                      <Input inputMode="numeric" />
                    </TextField>
                    <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
                      <span className="text-sm">เปิดจอง</span>
                      <Switch
                        isSelected={form.is_available}
                        onChange={(next) => setForm((f) => ({ ...f, is_available: next }))}
                        aria-label="เปิดจองห้องนี้"
                      >
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                </Form>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setOpen(false)} isDisabled={submitting}>
                  ยกเลิก
                </Button>
                <Button variant="primary" type="submit" form={formId} isDisabled={submitting}>
                  {submitting ? "กำลังบันทึก…" : "บันทึก"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
