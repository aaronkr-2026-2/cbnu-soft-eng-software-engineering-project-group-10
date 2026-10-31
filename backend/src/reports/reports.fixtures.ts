import type { ReportDetail, ReportListResponse } from './reports.contract.js';

/** Entirely fictional contract examples; never inserted into the database. */
export const reportDetailFixture = {
  id: '00000000-0000-4000-8000-000000000001',
  report_type: 'lost',
  status: 'open',
  recovered_at: null,
  images: [],
  title: 'Blue notebook near the library',
  description:
    'Fictional example: a plain blue notebook with no identifying details.',
  category: { id: '00000000-0000-4000-8000-000000000010', name: 'Other' },
  location: { id: '00000000-0000-4000-8000-000000000020', name: 'Library' },
  occurred_on: '2026-10-28',
  created_at: '2026-10-29T01:00:00.000Z',
  updated_at: '2026-10-29T01:00:00.000Z',
} satisfies ReportDetail;

const { description: _description, ...summary } = reportDetailFixture;

export const reportListFixture = {
  items: [summary],
  next_cursor: null,
} satisfies ReportListResponse;

export const emptyReportListFixture = {
  items: [],
  next_cursor: null,
} satisfies ReportListResponse;
