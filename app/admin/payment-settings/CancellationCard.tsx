"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Label,
  NumberField,
  Switch,
} from "@heroui/react";
import type { CancellationPolicy, CancellationTier } from "./types";

const DEFAULT_TIER: CancellationTier = { days_before: 7, refund_percent: 0 };

function sortTiers(tiers: CancellationTier[]): CancellationTier[] {
  return [...tiers].sort((a, b) => b.days_before - a.days_before);
}

export function CancellationCard({
  initialPolicy,
}: {
  initialPolicy: CancellationPolicy;
}) {
  const [enabled, setEnabled] = useState<boolean>(initialPolicy.enabled);
  const [tiers, setTiers] = useState<CancellationTier[]>(
    initialPolicy.tiers.length > 0
      ? initialPolicy.tiers
      : [
          { days_before: 30, refund_percent: 100 },
          { days_before: 14, refund_percent: 50 },
          { days_before: 7, refund_percent: 0 },
        ],
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  function updateTier(
    index: number,
    patch: Partial<CancellationTier>,
  ): void {
    setTiers((list) =>
      list.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );
  }

  function addTier(): void {
    setTiers((list) => [...list, { ...DEFAULT_TIER }]);
  }

  function removeTier(index: number): void {
    setTiers((list) => list.filter((_, i) => i !== index));
  }

  async function save() {
    setError(null);
    setStatus("idle");

    if (enabled) {
      if (tiers.length === 0) {
        setError("ต้องมีอย่างน้อย 1 tier เมื่อเปิดนโยบายยกเลิก");
        return;
      }
      for (const tier of tiers) {
        if (
          !Number.isFinite(tier.days_before) ||
          tier.days_before < 0 ||
          tier.days_before > 365
        ) {
          setError("จำนวนวันต้องอยู่ระหว่าง 0–365");
          return;
        }
        if (
          !Number.isFinite(tier.refund_percent) ||
          tier.refund_percent < 0 ||
          tier.refund_percent > 100
        ) {
          setError("เปอร์เซ็นต์คืนเงินต้องอยู่ระหว่าง 0–100");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/cancellation-policy", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, tiers: sortTiers(tiers) }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("ok");
      setTiers(sortTiers(tiers));
    } catch {
      setStatus("err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>นโยบายการยกเลิก</Card.Title>
        <Card.Description>
          ตั้งกฎคืนเงินตามจำนวนวันที่ยกเลิกล่วงหน้า
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2">
          <div className="text-sm font-medium">เปิดนโยบายยกเลิก</div>
          <Switch
            isSelected={enabled}
            onChange={setEnabled}
            aria-label="เปิดนโยบายยกเลิก"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>

        {enabled ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-3 rounded-md border border-neutral-200 p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <NumberField
                    value={tier.days_before}
                    onChange={(value) =>
                      updateTier(index, {
                        days_before: Number.isFinite(value) ? value : 0,
                      })
                    }
                    minValue={0}
                    maxValue={365}
                    step={1}
                    aria-label={`Tier ${index + 1} จำนวนวัน`}
                  >
                    <Label>ยกเลิกมากกว่า (วัน)</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton>−</NumberField.DecrementButton>
                      <NumberField.Input />
                      <NumberField.IncrementButton>+</NumberField.IncrementButton>
                    </NumberField.Group>
                  </NumberField>

                  <NumberField
                    value={tier.refund_percent}
                    onChange={(value) =>
                      updateTier(index, {
                        refund_percent: Number.isFinite(value) ? value : 0,
                      })
                    }
                    minValue={0}
                    maxValue={100}
                    step={1}
                    aria-label={`Tier ${index + 1} เปอร์เซ็นต์คืนเงิน`}
                  >
                    <Label>คืนเงิน (%)</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton>−</NumberField.DecrementButton>
                      <NumberField.Input />
                      <NumberField.IncrementButton>+</NumberField.IncrementButton>
                    </NumberField.Group>
                  </NumberField>

                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => removeTier(index)}
                    >
                      ลบ
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Button variant="secondary" size="sm" onPress={addTier}>
                + เพิ่ม tier
              </Button>
            </div>

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
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
