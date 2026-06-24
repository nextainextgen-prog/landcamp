"use client";

import { useId, useState, type FormEvent } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Label,
  Switch,
  Table,
  TextField,
} from "@heroui/react";
import { SECTIONS, type SectionKey } from "@/lib/admin/sections";

export type AdminAccount = {
  id: string;
  username: string;
  role: "super_admin" | "admin";
  permissions: SectionKey[];
  is_active: boolean;
  created_at?: string;
};

type FormState = {
  username: string;
  password: string;
  permissions: SectionKey[];
};

const EMPTY: FormState = { username: "", password: "", permissions: [] };

export function UsersManager({
  initialUsers,
  currentUserId,
  isSuperAdmin,
}: {
  initialUsers: AdminAccount[];
  currentUserId: string;
  isSuperAdmin: boolean;
}) {
  const [users, setUsers] = useState<AdminAccount[]>(initialUsers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const formId = useId();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setOpen(true);
  }
  function openEdit(u: AdminAccount) {
    setEditing(u);
    setForm({ username: u.username, password: "", permissions: u.permissions });
    setError(null);
    setOpen(true);
  }

  function togglePerm(key: SectionKey, on: boolean) {
    setForm((f) => ({
      ...f,
      permissions: on ? [...new Set([...f.permissions, key])] : f.permissions.filter((p) => p !== key),
    }));
  }

  async function toggleActive(u: AdminAccount, next: boolean) {
    setBusyId(u.id);
    setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_active: next } : x)));
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, is_active: !next } : x)));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: AdminAccount) {
    if (!window.confirm(`ลบผู้ใช้ "${u.username}" ?`)) return;
    setBusyId(u.id);
    const snapshot = users;
    setUsers((list) => list.filter((x) => x.id !== u.id));
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setUsers(snapshot);
      window.alert("ลบไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!form.username.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (!editing && form.password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setSubmitting(true);
    try {
      let res: Response;
      if (editing) {
        const body: Record<string, unknown> = { permissions: form.permissions };
        if (form.password) body.password = form.password;
        res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/admin/users`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            password: form.password,
            role: "admin",
            permissions: form.permissions,
          }),
        });
      }
      const data = (await res.json()) as { user?: AdminAccount; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "failed");
      const saved = data.user;
      setUsers((list) => (editing ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <Card.Header className="flex flex-row items-center justify-between gap-3">
        <div>
          <Card.Title>ผู้ดูแลระบบ</Card.Title>
          <Card.Description>{users.length} บัญชี</Card.Description>
        </div>
        <Button onPress={openCreate} variant="primary" size="sm">
          + เพิ่มผู้ใช้
        </Button>
      </Card.Header>
      <Card.Content>
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="ผู้ดูแลระบบ">
              <Table.Header>
                <Table.Column isRowHeader>ชื่อผู้ใช้</Table.Column>
                <Table.Column>บทบาท</Table.Column>
                <Table.Column>สิทธิ์เข้าถึง</Table.Column>
                <Table.Column>ใช้งาน</Table.Column>
                <Table.Column>จัดการ</Table.Column>
              </Table.Header>
              <Table.Body>
                {users.map((u) => (
                  <Table.Row key={u.id}>
                    <Table.Cell>
                      {u.username}
                      {u.id === currentUserId ? " (คุณ)" : ""}
                    </Table.Cell>
                    <Table.Cell>{u.role === "super_admin" ? "Super Admin" : "Admin"}</Table.Cell>
                    <Table.Cell className="text-xs text-neutral-600">
                      {u.role === "super_admin"
                        ? "ทุกเมนู"
                        : u.permissions.length
                          ? u.permissions
                              .map((p) => SECTIONS.find((s) => s.key === p)?.label ?? p)
                              .join(", ")
                          : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Switch
                        isSelected={u.is_active}
                        isDisabled={busyId === u.id || u.id === currentUserId || (u.role === "super_admin" && !isSuperAdmin)}
                        onChange={(next) => toggleActive(u, next)}
                        aria-label={`ใช้งาน ${u.username}`}
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
                          isDisabled={u.role === "super_admin" && !isSuperAdmin}
                          onPress={() => openEdit(u)}
                        >
                          แก้
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          isDisabled={busyId === u.id || u.id === currentUserId || (u.role === "super_admin" && !isSuperAdmin)}
                          onPress={() => remove(u)}
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
      </Card.Content>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">{editing ? `แก้ไข ${editing.username}` : "เพิ่มผู้ใช้ใหม่"}</h3>
            <Form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
              {!editing && (
                <TextField isRequired value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))}>
                  <Label>ชื่อผู้ใช้</Label>
                  <Input placeholder="เช่น staff01" autoComplete="off" />
                </TextField>
              )}
              <TextField
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                type="password"
              >
                <Label>{editing ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}</Label>
                <Input type="password" autoComplete="new-password" placeholder="อย่างน้อย 6 ตัวอักษร" />
              </TextField>

              {editing?.role === "super_admin" ? (
                <p className="rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  Super Admin เข้าถึงได้ทุกเมนูโดยอัตโนมัติ
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-neutral-600">สิทธิ์การเข้าถึงเมนู</span>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTIONS.map((s) => (
                      <label key={s.key} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(s.key)}
                          onChange={(e) => togglePerm(s.key, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onPress={() => setOpen(false)} isDisabled={submitting}>
                  ยกเลิก
                </Button>
                <Button variant="primary" type="submit" form={formId} isDisabled={submitting}>
                  {submitting ? "กำลังบันทึก…" : "บันทึก"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </Card>
  );
}
