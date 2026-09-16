export interface DraftRecord {
  id: string;
  registration: string;
  mark: string;
  rowNumber: number | null;
  page: number;
  raw: string;
  method: "text" | "ocr" | "manual";
  notes: string[];
}
export interface StudentRecord {
  id: string;
  registration: string;
  mark: number;
  rowNumber: number | null;
  page: number;
}
export interface QualityWarning {
  id: string;
  message: string;
  page?: number;
}
export interface SourcePage {
  page: number;
  text: string;
  method: "text" | "ocr";
}
export interface ExtractionResult {
  records: DraftRecord[];
  warnings: QualityWarning[];
  pages: SourcePage[];
  totalPages: number;
}
export interface Progress {
  stage:
    | "Reading PDF"
    | "Detecting tables"
    | "Recognizing scanned page"
    | "Validating records"
    | "Calculating statistics";
  percent: number;
  detail: string;
}
export interface MarkBand {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}
export interface ClassStatistics {
  total: number;
  count: number;
  absent: number;
  zeros: number;
  mean: number | null;
  median: number | null;
  modes: number[];
  min: number | null;
  max: number | null;
  range: number | null;
  stdDev: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  passCount: number;
  failCount: number;
  passRate: number;
  failRate: number;
  positions: Map<number, { above: number; below: number; equal: number }>;
  includedIds: Set<string>;
  bands: MarkBand[];
  included: StudentRecord[];
  sortedMarks: number[];
}
export interface StudentStatistics {
  rank: number;
  tied: number;
  percentile: number;
  above: number;
  below: number;
  difference: number;
  zScore: number | null;
  quartile: number;
  top: number[];
  band: string;
  passed: boolean;
}
