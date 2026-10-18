import { CampusItem } from '@/lib/types';

export const SEED_ITEMS: CampusItem[] = [
  {
    id: 'airpods-pro', title: 'AirPods Pro (2nd generation)',
    description: 'White AirPods Pro in a clear silicone case. I may have left them at a study desk on the 2nd floor, near the windows. The case has a small blue sticker.',
    kind: 'lost', category: 'Electronics', location: 'Central Library · 2F', occurredAt: '2026-09-10',
    status: 'open', ownerName: 'Minji Kim', ownerEmail: 'minji@example.com', createdAt: '2026-09-10T10:00:00.000Z'
  },
  {
    id: 'student-card', title: 'University Student ID Card',
    description: 'Found a student card near the Engineering Building entrance. I have kept the personal details private. Please contact me and provide identifying information to claim it.',
    kind: 'found', category: 'ID & Cards', location: 'Engineering Building', occurredAt: '2026-09-09',
    status: 'open', ownerName: 'Daniel Park', ownerEmail: 'daniel@example.com', createdAt: '2026-09-09T09:00:00.000Z'
  },
  {
    id: 'umbrella', title: 'Black Foldable Umbrella',
    description: 'Small black foldable umbrella found by the lounge seating area. No name tag attached.',
    kind: 'found', category: 'Accessories', location: 'Student Center', occurredAt: '2026-09-08',
    status: 'open', ownerName: 'Jisoo Lee', ownerEmail: 'jisoo@example.com', createdAt: '2026-09-08T13:00:00.000Z'
  },
  {
    id: 'charger', title: 'MacBook USB-C Charger',
    description: 'White Apple USB-C charger and cable. Lost after an afternoon class. Possibly left near the computer lab.',
    kind: 'lost', category: 'Electronics', location: 'IT Building · Room 304', occurredAt: '2026-09-07',
    status: 'open', ownerName: 'Alex Nguyen', ownerEmail: 'alex@example.com', createdAt: '2026-09-07T17:00:00.000Z'
  },
  {
    id: 'wallet', title: 'Navy Blue Wallet',
    description: 'Small navy wallet with a zip pocket. Please reach out if you found it. I can verify what is inside.',
    kind: 'lost', category: 'Accessories', location: 'Campus Cafeteria', occurredAt: '2026-09-06',
    status: 'open', ownerName: 'Hana Choi', ownerEmail: 'hana@example.com', createdAt: '2026-09-06T12:00:00.000Z'
  },
  {
    id: 'bottle', title: 'Reusable Water Bottle',
    description: 'Silver stainless-steel water bottle with a black cap. Found on the benches by the gym.',
    kind: 'found', category: 'Other', location: 'Sports Center', occurredAt: '2026-09-05',
    status: 'recovered', ownerName: 'Emma Lee', ownerEmail: 'emma@example.com', createdAt: '2026-09-05T14:00:00.000Z'
  }
];

export function formatDate(date: string) {
  const parsed = new Date(date.slice(0, 10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatFullDate(date: string) {
  const parsed = new Date(date.slice(0, 10) + 'T12:00:00');
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
