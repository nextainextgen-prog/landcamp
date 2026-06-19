"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Label,
  NumberField,
  Switch,
} from "@heroui/react";
import type { PaymentSettings } from "./types";

export function DepositCard({
  initialSettings,
}: {
  initialSettings: PaymentSettings;
}) {
  const [enabled, setEnabled] = useState<boolean>(initialSettings.deposit_enabled);
  const [percent, setPercent] = useState<number>(
    Number.isFinite(initialSettings.deposit_percent)
      ? initialSettings.deposit_percent
      : 50,
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  async function save() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deposit_enabled: enabled,
          deposit_percent: percent,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("ok");
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
    }
  }

  const safePercent = Number.isFinite(percent) ? percent : 50;

  return (
    <Card>
      <Card.Header>
        <Card.Title>เงินมัดจำ</Card.Title>
        <Card.Description>
          เปิด/ปิด ตัวเลือกการชำระเงินมัดจำสำหรับการจอง
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
          <div className="text-sm font-medium">เปิดตัวเลือกมัดจำ</div>
          <Switch
            isSelected={enabled}
            onChange={setEnabled}
            aria-label="เปิดตัวเลือกมัดจำ"
          />
        </div>

        {enabled ? (
          <div className="flex flex-col gap-2">
            <NumberField
              value={safePercent}
              onChange={(value) =>
                setPercent(Number.isFinite(value) ? value : 50)
              }
              minValue={1}
              maxValue={100}
              step={1}
              aria-label="เปอร์เซ็นต์มัดจำ"
            >
              <Label>มัดจำ</Label>
              <NumberField.Group>
                <NumberField.DecrementButton>−</NumberField.DecrementButton>
                <NumberField.Input />
                <NumberField.IncrementButton>+</NumberField.IncrementButton>
              </NumberField.Group>
            </NumberField>
            <p className="text-xs text-neutral-500">
              มัดจำ {safePercent}% ของยอดรวม — ส่วนที่เหลือเก็บวันเข้าพัก
            </p>
          </div>
        ) : null}
      </Card.Content>
      <Card.Footer className="flex items-center justify-between gap-3">
        <div className="text-xs">
          {status === "ok" ? (
            <span className="text-green-600">บันทึกเรียบร้อย</span>
          ) : status === "err" ? (
            <span className="text-red-600">
              บันทึกไม่สำเร็จ — กรุณาลองใหม่
            </span>
          ) : null}
        </div>
        <Button variant="primary" onPress={save} isDisabled={saving}>
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
