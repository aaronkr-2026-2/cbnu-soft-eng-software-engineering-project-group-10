export type ItemKind = 'lost' | 'found';
export type ItemStatus = 'open' | 'recovered';
export type ItemCategory = 'Electronics' | 'ID & Cards' | 'Accessories' | 'Clothing' | 'Bags' | 'Other';

export const CATEGORIES: ItemCategory[] = [
  'Electronics', 'ID & Cards', 'Accessories', 'Clothing', 'Bags', 'Other'
];

export type CampusItem = {
  id: string;
  title: string;
  description: string;
  kind: ItemKind;
  category: ItemCategory;
  location: string;
  occurredAt: string;
  image?: string;
  status: ItemStatus;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
};

export type Session = { name: string; email: string };
export type ItemDraft = Pick<CampusItem, 'title' | 'description' | 'kind' | 'category' | 'location' | 'occurredAt' | 'image'>;
