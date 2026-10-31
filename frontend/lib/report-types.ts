export type Catalog = { id: string; name: string };
export type Catalogs = { categories: Catalog[]; locations: Catalog[] };
export type ReportImage = {
  id: string;
  url: string;
  width: number;
  height: number;
};
export type Report = {
  id: string;
  title: string;
  description?: string;
  report_type: 'lost' | 'found';
  status: 'open' | 'recovered';
  category: Catalog;
  location: Catalog;
  occurred_on: string;
  created_at: string;
  updated_at: string;
  recovered_at: string | null;
  images: ReportImage[];
};
export type Page<T> = { items: T[]; next_cursor: string | null };
export type ReportDraft = {
  title: string;
  description: string;
  report_type: 'lost' | 'found';
  category_id: string;
  location_id: string;
  occurred_on: string;
};
export type Conversation = {
  id: string;
  report_id: string;
  created_at: string;
  report_title: string;
  report_deleted: boolean;
};
export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_message_id: string;
  body: string;
  created_at: string;
};
