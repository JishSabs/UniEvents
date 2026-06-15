import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Timestamp } from "firebase/firestore";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

export function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  return format(timestamp.toDate(), "MMM d, yyyy");
}

export function formatDateTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "";
  return format(timestamp.toDate(), "MMM d, yyyy · h:mm a");
}

export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export const ANNOUNCEMENT_CATEGORIES = [
  { value: "academic", label: "Academic" },
  { value: "event", label: "Event" },
  { value: "sports", label: "Sports" },
  { value: "general", label: "General" },
  { value: "emergency", label: "Emergency" },
  { value: "gig", label: "Gig / Performance" },
  { value: "party", label: "Party / Social" },
  { value: "club", label: "Club / Society" },
  { value: "other", label: "Other" },
];

export const MARKETPLACE_CATEGORIES = [
  { value: "textbooks", label: "Textbooks & Notes" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing & Fashion" },
  { value: "food", label: "Food & Beverages" },
  { value: "tutoring", label: "Tutoring" },
  { value: "design", label: "Design & Creative" },
  { value: "tech", label: "Tech & Programming" },
  { value: "transport", label: "Transport & Delivery" },
  { value: "accommodation", label: "Accommodation" },
  { value: "other", label: "Other" },
];

export const LISTING_TYPES = [
  { value: "product", label: "Product for Sale" },
  { value: "service", label: "Service Offered" },
  { value: "job", label: "Hiring / Looking for Help" },
  { value: "gig", label: "Gig / Freelance" },
];
