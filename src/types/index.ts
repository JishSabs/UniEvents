import { Timestamp } from "firebase/firestore";

// ─── User & Roles ────────────────────────────────────────────────────────────

export type UserRole = "student" | "moderator" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  yearOfStudy?: number;
  createdAt: Timestamp;
  isActive: boolean;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export type AnnouncementSource = "official" | "student";
export type AnnouncementCategory =
  | "academic"
  | "event"
  | "sports"
  | "general"
  | "emergency"
  | "gig"
  | "party"
  | "club"
  | "other";
export type PostStatus = "pending" | "approved" | "rejected" | "deleted";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  source: AnnouncementSource;       // official = school, student = student-posted
  category: AnnouncementCategory;
  status: PostStatus;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  imageURL?: string;
  tags?: string[];
  isPinned: boolean;
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedBy?: string;              // uid of moderator/admin who approved
  rejectionReason?: string;
  eventDate?: Timestamp;            // for event announcements
  eventLocation?: string;
}

// ─── Marketplace ─────────────────────────────────────────────────────────────

export type ListingType = "product" | "service" | "job" | "gig";
export type ListingStatus = "active" | "sold" | "closed" | "pending" | "deleted";
export type PriceType = "fixed" | "negotiable" | "free" | "hourly";

export interface MarketplaceListing {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  price?: number;
  priceType: PriceType;
  currency: string;                 // e.g., "USD", "ZWL"
  imageURLs: string[];
  category: string;
  tags?: string[];
  status: ListingStatus;
  authorId: string;
  authorName: string;
  contactInfo: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  location?: string;               // on-campus location or delivery info
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | "announcement_approved"
  | "announcement_rejected"
  | "listing_approved"
  | "new_announcement"
  | "role_changed"
  | "post_deleted";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;              // id of related announcement/listing
  createdAt: Timestamp;
}

// ─── UI / Form helpers ───────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

// ─── Live Transactions ────────────────────────────────────────────────────────

export type TransactionStatus = "active" | "ended";

export interface GeoPoint {
  lat: number;
  lng: number;
  updatedAt: Timestamp;
}

export interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: TransactionStatus;
  buyerSharing: boolean;
  sellerSharing: boolean;
  buyerLocation?: GeoPoint;
  sellerLocation?: GeoPoint;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}