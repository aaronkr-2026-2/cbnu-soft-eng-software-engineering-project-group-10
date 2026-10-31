/** Public reports API types. */
export type ReportType = 'lost' | 'found';
export type ReportStatus = 'open' | 'recovered';

export interface CatalogReference {
  id: string;
  name: string;
}

export interface ReportSummary {
  id: string;
  report_type: ReportType;
  status: ReportStatus;
  title: string;
  category: CatalogReference;
  location: CatalogReference;
  recovered_at: string | null;
  images: { id: string; url: string; width: number; height: number }[];
  /** YYYY-MM-DD campus calendar date (Asia/Seoul), not a timestamp. */
  occurred_on: string;
  /** UTC ISO 8601 timestamps. */
  created_at: string;
  updated_at: string;
}

export interface ReportDetail extends ReportSummary {
  description: string;
}

export interface ReportListResponse {
  items: ReportSummary[];
  /** Opaque cursor for the next page, or null when exhausted. */
  next_cursor: string | null;
}

/** Validated query values, not raw HTTP input. Runtime validation comes later. */
export interface ReportListQuery {
  limit?: number;
  cursor?: string;
  report_type?: ReportType;
  status?: ReportStatus;
  category_id?: string;
  location_id?: string;
  q?: string;
}

export const REPORT_PAGE_DEFAULT = 20;
export const REPORT_PAGE_MAX = 50;
