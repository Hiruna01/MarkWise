import { z } from "zod";
import { normalizeRegistration } from "./normalization";
import type { DraftRecord, StudentRecord } from "./types";
export const studentSchema = z.object({
  id: z.string().min(1),
  registration: z
    .string()
    .regex(
      /^IT \d{2} \d{4} \d{2}$/,
      "Use an IT registration number with 8 digits.",
    ),
  mark: z.number().finite().min(0).max(100),
  rowNumber: z.number().int().positive().nullable(),
  page: z.number().int().positive(),
});
export function validateDraft(record: DraftRecord): {
  record?: StudentRecord;
  errors: string[];
} {
  const errors: string[] = [];
  const registration = normalizeRegistration(record.registration);
  if (!/^IT \d{2} \d{4} \d{2}$/.test(registration))
    errors.push("Registration needs IT followed by 8 digits.");
  const mark = record.mark.trim();
  if (
    !/^\d+(?:\.\d+)?$/.test(mark) ||
    !Number.isFinite(Number(mark)) ||
    Number(mark) > 100
  )
    errors.push("Mark must be a number from 0 to 100.");
  const parsed = studentSchema.safeParse({
    ...record,
    registration,
    mark: Number(mark),
  });
  if (!parsed.success && errors.length === 0)
    errors.push("Check the source page and row number.");
  return {
    errors,
    record: errors.length === 0 && parsed.success ? parsed.data : undefined,
  };
}
export function validateRecords(records: DraftRecord[]) {
  const errors = new Map<string, string[]>();
  const groups = new Map<string, string[]>();
  const valid: StudentRecord[] = [];
  for (const draft of records) {
    const result = validateDraft(draft);
    if (result.errors.length) errors.set(draft.id, result.errors);
    if (result.record) valid.push(result.record);
    const key = normalizeRegistration(draft.registration);
    if (key) groups.set(key, [...(groups.get(key) ?? []), draft.id]);
  }
  for (const ids of groups.values())
    if (ids.length > 1)
      for (const id of ids)
        errors.set(id, [
          ...(errors.get(id) ?? []),
          "Duplicate registration. Correct or delete the extra row.",
        ]);
  return { errors, valid };
}
