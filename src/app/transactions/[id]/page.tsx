"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { subscribeToTransaction, updateMyLocation, stopSharing } from "@/lib/transactions";
import { Transaction } from "@/types";
import { Loader2, MapPin, StopCircle, ArrowLeft } from "lucide-react";
import { subscribeToPresence } from "@/lib/presence";
import toast from "react-hot-toast";
import dynamicClient from "next/dynamic";

const Chat = dynamicClient(() => import("@/components/transactions/Chat"), { ssr: false });

const LiveMapInner = dynamic(() => import("@/components/transactions/LiveMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-slate-400" size={28} />
    </div>
  ),
});

export default function TransactionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

    const [buyerOnline, setBuyerOnline] = useState<boolean>(false);
    const [sellerOnline, setSellerOnline] = useState<boolean>(false);

  const [transaction, setTransaction] = useState<Transaction | null | undefined>(undefined);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToTransaction(id, setTransaction);
    return () => unsub();
  }, [id]);

  // subscribe to buyer/seller presence when transaction loads
  useEffect(() => {
    if (!transaction) return;
    const unsubBuyer = transaction.buyerId ? subscribeToPresence(transaction.buyerId, (s) => setBuyerOnline(s?.state === 'online')) : () => {};
    const unsubSeller = transaction.sellerId ? subscribeToPresence(transaction.sellerId, (s) => setSellerOnline(s?.state === 'online')) : () => {};
    return () => { unsubBuyer(); unsubSeller(); };
  }, [transaction]);

  const role: "buyer" | "seller" | null =
    !transaction || !profile
      ? null
      : transaction.buyerId === profile.uid
      ? "buyer"
      : transaction.sellerId === profile.uid
      ? "seller"
      : null;

  const iAmSharing =
    role === "buyer" ? transaction?.buyerSharing : role === "seller" ? transaction?.sellerSharing : false;

  useEffect(() => {
    if (!id || !role || !iAmSharing || transaction?.status !== "active") {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location sharing.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(null);
        updateMyLocation(id, role, pos.coords.latitude, pos.coords.longitude).catch(console.error);
      },
      () => setLocationError("Location permission denied. Turn it on to share your position."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [id, role, iAmSharing, transaction?.status]);

  const handleStop = async () => {
    if (!id) return;
    try {
      await stopSharing(id);
      toast.success("Location sharing stopped");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop sharing");
    }
  };

  if (authLoading || transaction === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Please log in to view this transaction.
      </div>
    );
  }

  if (transaction === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Transaction not found.
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        You are not part of this transaction.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
            <h1 className="text-lg font-semibold text-slate-900">{transaction.listingTitle}</h1>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${buyerOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span>{transaction.buyerName} (buyer)</span>
              </span>
              <span>↔</span>
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${sellerOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                <span>{transaction.sellerName} (seller)</span>
              </span>
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              transaction.status === "active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                transaction.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {transaction.status === "active" ? "Live" : "Ended"}
          </span>
        </div>

        <div className="h-[420px] w-full">
          <LiveMapInner
            buyer={transaction.buyerLocation}
            seller={transaction.sellerLocation}
            buyerName={transaction.buyerName}
            sellerName={transaction.sellerName}
          />
        </div>

        <div className="p-5 bg-white">
          <h2 className="text-sm font-semibold mb-2">Messages</h2>
          <Chat transactionId={transaction.id} currentUserId={profile?.uid} currentUserName={profile?.displayName} />
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={15} />
            {locationError ? (
              <span className="text-amber-600">{locationError}</span>
            ) : transaction.status === "active" ? (
              <span>Sharing your live location with the other person</span>
            ) : (
              <span>Location sharing has ended</span>
            )}
          </div>
          {transaction.status === "active" && (
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <StopCircle size={15} /> Stop Sharing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}