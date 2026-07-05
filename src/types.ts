/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Investor' | 'Entrepreneur';

export interface UserProfile {
  companyName?: string;
  bio?: string;
  website?: string;
  sector?: string;
  stage?: string; // e.g. Pre-seed, Seed, Series A
  fundingTarget?: number;
  investmentThesis?: string;
  preferredStages?: string[];
  preferredSectors?: string[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  balance: number;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  stock: number;
  creatorId: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  hostId: string;
  hostName: string;
  hostEmail: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  version: number;
  signatureData?: string; // base64 drawing data
  status: 'Pending' | 'Signed';
  signedAt?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: 'Deposit' | 'Withdraw' | 'Transfer';
  amount: number;
  details: string;
  status: 'Pending' | 'Completed' | 'Failed';
  recipientId?: string;
  recipientName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  require2FA?: boolean;
  tempToken?: string; // Used for 2FA verification step
}
