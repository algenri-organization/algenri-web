import { z } from "zod";

export const questionTypeSchema = z.enum([
  "short_text",
  "long_text",
  "email",
  "phone",
  "url",
  "number",
  "currency",
  "date",
  "yes_no",
  "single_choice",
  "multiple_choice",
  "file_upload",
  "consent",
]);

export const conditionSchema = z.object({
  fieldId: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "contains"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  helperText: z.string().optional(),
  type: questionTypeSchema,
  required: z.boolean(),
  options: z.array(z.string().min(1)).optional(),
  condition: conditionSchema.optional(),
  planningCategory: z.enum(["launch_required", "phase_1", "future_evolution"]).optional(),
  order: z.number().int().nonnegative(),
}).superRefine((question, ctx) => {
  if (["single_choice", "multiple_choice"].includes(question.type) && (!question.options || question.options.length < 2)) {
    ctx.addIssue({ code: "custom", message: "Choice questions need at least two options.", path: ["options"] });
  }
});

export const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  questions: z.array(questionSchema),
});

export const templateSnapshotSchema = z.object({
  name: z.string().min(1),
  projectType: z.string().min(1),
  version: z.string().min(1),
  privacyNoticeVersion: z.string().min(1),
  sections: z.array(sectionSchema).min(1),
});

export const saveBriefingPayloadSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});
