"use client";

import { MarketplaceListing } from "@/types";
import { cn, timeAgo, formatPrice } from "@/lib/utils";
import {
  MessageCircle,
  Phone,
  Mail,
  Trash2,
  MapPin,
  Tag,
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
}

const TYPE_CONFIG = {
  product: { label: "For Sale", icon: ShoppingBag, color: "bg-blue-100 text-blue-700" },
  service: { label: "Service", icon: Wrench, color: "bg-teal-100 text-teal-700" },
  job: { label: "Hiring", icon: Briefcase, color: "bg-purple-100 text-purple-700" },
  gig: { label: "Gig", icon: Star, color: "bg-orange-100 text-orange-700" },
};

export default function ListingCard({ listing, canDelete, onDelete }: ListingCardProps) {
  const config = TYPE_CONFIG[listing.type];
  const TypeIcon = config.icon;

  return (
    <div className="card-hover bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Image */}
      {listing.imageURLs.length > 0 ? (
        <div className="h-48 relative overflow-hidden">
          <Image
            src={listing.imageURLs[0]}
            alt={listing.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", config.color)}>
              <TypeIcon size={11} /> {config.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <TypeIcon size={36} className="text-slate-300" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Title & price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2"
            style={{ fontFamily: "var(--font-display)" }}>
            {listing.title}
          </h3>
          {listing.price !== undefined && (
            <div className="text-right shrink-0">
              <p className="text-base font-bold text-[#0f2d6b]">
                {listing.priceType === "free"
                  ? "Free"
                  : formatPrice(listing.price, listing.currency)}
              </p>
              {listing.priceType === "negotiable" && (
                <p className="text-xs text-slate-400">Negotiable</p>
              )}
              {listing.priceType === "hourly" && (
                <p className="text-xs text-slate-400">/hr</p>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1 leading-relaxed">
          {listing.description}
        </p>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-500">
                <Tag size={9} /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {listing.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <MapPin size={11} />
            <span className="truncate">{listing.location}</span>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 mt-auto">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <p className="text-xs font-medium text-slate-700">{listing.authorName}</p>
              <p className="text-xs text-slate-400">{timeAgo(listing.createdAt)}</p>
            </div>
            {canDelete && (
              <button
                onClick={() => onDelete?.(listing.id)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                title="Delete listing"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Contact buttons */}
          <div className="flex gap-2">
            {listing.contactInfo.whatsapp && (
              <a
                href={`https://wa.me/${listing.contactInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
              >
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
            {listing.contactInfo.phone && (
              <a
                href={`tel:${listing.contactInfo.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Phone size={12} /> Call
              </a>
            )}
            {listing.contactInfo.email && (
              <a
                href={`mailto:${listing.contactInfo.email}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                <Mail size={12} /> Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
