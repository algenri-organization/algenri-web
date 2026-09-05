export type ProjectStage =
  | "lead"
  | "diagnostic"
  | "briefing"
  | "proposal"
  | "contract"
  | "onboarding"
  | "development"
  | "validation"
  | "publication"
  | "training"
  | "delivery"
  | "support"
  | "case";

export type BriefingStatus = "not_started" | "in_progress" | "completed" | "archived";
export type TemplateStatus = "draft" | "review" | "published" | "archived";
export type PlanningCategory = "launch_required" | "phase_1" | "future_evolution";
export type QuestionType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "currency"
  | "date"
  | "yes_no"
  | "single_choice"
  | "multiple_choice"
  | "file_upload"
  | "consent";

export type ConditionOperator = "equals" | "not_equals" | "contains";

export type BriefingCondition = {
  fieldId: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
};

export type BriefingQuestion = {
  id: string;
  label: string;
  helperText?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  condition?: BriefingCondition;
  planningCategory?: PlanningCategory;
  order: number;
};

export type BriefingSection = {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: BriefingQuestion[];
};

export type BriefingTemplateSnapshot = {
  name: string;
  projectType: string;
  version: string;
  privacyNoticeVersion: string;
  sections: BriefingSection[];
};

export type BriefingTemplateSource = {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  parser: "mammoth";
  importedAt: string;
  warnings: string[];
};

export type BriefingTemplateRecord = BriefingTemplateSnapshot & {
  id: string;
  status: TemplateStatus;
  source: BriefingTemplateSource;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type BriefingInstance = {
  id: string;
  projectId: string;
  clientId: string;
  templateId: string;
  templateVersion: string;
  templateSnapshot: BriefingTemplateSnapshot;
  slug: string;
  accessTokenHash: string;
  status: BriefingStatus;
  progress: number;
  startedAt: string | null;
  lastSavedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};
