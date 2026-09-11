"use client";

import { auth } from "@/lib/firebase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startTransaction } from "@/lib/transactions";
import { Navigation } from "lucide-react";
import toast from "react-hot-toast";
import { MarketplaceListing } from "@/types";
import { cn, timeAgo, formatPrice } from "@/lib/utils";
import {
  MessageCircle,
  Phone,
  Mail,
  Trash2,
  MapPin,
  Briefcase,
  Wrench,
  ShoppingBag,
  Star,
} from "lucide-react";
import Image from "next/image";

interface ListingCardProps {
  listing: MarketplaceListing;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  currentUserId?: string;
  currentUserName?: string;
}

const TYPE_CONFIG = {
  product: { label: "For Sale", icon: ShoppingBag, color: "bg-blue-500" },
  service: { label: "Service", icon: Wrench, color: "bg-sky-500" },
  job: { label: "Hiring", icon: Briefcase, color: "bg-purple-500" },
  gig: { label: "Gig", icon: Star, color: "bg-orange-500" },
};

export default function ListingCard({
  listing,
  canDelete,
  onDelete,
  currentUserId,
  currentUserName,
}: ListingCardProps) {
  const config = TYPE_CONFIG[listing.type];
  const TypeIcon = config.icon;
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const isOwner = currentUserId === listing.authorId;

  const handleStartTransaction = async () => {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      toast.error("Please log in to start a transaction");
      return;
    }
    if (!currentUserName) {
      toast.error("User information is missing");
      return;
    }
    if (firebaseUser.uid === listing.authorId) {
      toast.error("You cannot start a transaction on your own listing");
      return;
    }

    setStarting(true);
    try {
      const id = await startTransaction({
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: firebaseUser.uid,
        buyerName: currentUserName,
        sellerId: listing.authorId,
        sellerName: listing.authorName,
      });
      router.push(`/transactions/${id}`);
    } catch (err: any) {
      console.error("TRANSACTION ERROR:", err);
      toast.error(err?.message || "Failed to start transaction");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-slate-50">
        {listing.imageURLs.length > 0 ? (
          <Image
            src={listing.imageURLs[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <TypeIcon size={28} className="text-slate-300" />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
          <span className={cn("flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white shadow-sm", config.color)}>
            <TypeIcon size={9} /> <span className="hidden xs:inline">{config.label.toUpperCase()}</span>
          </span>
        </div>

        {listing.priceType === "negotiable" && (
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white bg-amber-500 shadow-sm">
              NEG
            </span>
          </div>
        )}
        {listing.priceType === "free" && (
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
            <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white bg-emerald-500 shadow-sm">
              FREE
            </span>
          </div>
        )}

        {canDelete && (
          <button
            onClick={() => onDelete?.(listing.id)}
            className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete listing"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="p-2 sm:p-3.5 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 mb-1">
          {listing.title}
        </h3>

        {listing.price !== undefined && (
          <div className="mb-1.5">
            <span className="text-sm sm:text-lg font-bold text-indigo-600">
              {listing.priceType === "free"
                ? "Free"
                : formatPrice(listing.price, listing.currency)}
            </span>
            {listing.priceType === "hourly" && (
              <span className="text-[10px] sm:text-xs text-slate-400 ml-1">/hr</span>
            )}
          </div>
        )}

        {listing.location && (
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 mb-1.5">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-2 mt-auto pt-1.5 border-t border-slate-50">
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">{listing.authorName}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-300 shrink-0 ml-1">{timeAgo(listing.createdAt)}</p>
        </div>

        {/* Compact contact icons */}
        <div className="flex gap-1 mb-1.5">
          {listing.contactInfo.whatsapp && (
            <a
              href={`https://wa.me/${listing.contactInfo.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              title="WhatsApp"
            >
              <MessageCircle size={13} />
            </a>
          )}
          {listing.contactInfo.phone && (
            <a
              href={`tel:${listing.contactInfo.phone}`}
              className="flex-1 flex items-center justify-center py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              title="Call"
            >
              <Phone size={13} />
            </a>
          )}
          {listing.contactInfo.email && (
            <a
              href={`mailto:${listing.contactInfo.email}`}
              className="flex-1 flex items-center justify-center py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Email"
            >
              <Mail size={13} />
            </a>
          )}
        </div>

        {!isOwner && currentUserId && (
          <button
            onClick={handleStartTransaction}
            disabled={starting}
            className="w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg text-[10px] sm:text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <Navigation size={11} />
            {starting ? "Starting…" : "Start Transaction"}
          </button>
        )}
      </div>
    </div>
  );
}