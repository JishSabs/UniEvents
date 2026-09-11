import Spinner from "./Spinner";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ message, fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? "min-h-screen flex items-center justify-center px-4 py-20 bg-slate-50"
          : "flex items-center justify-center py-20"
      }
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Spinner size={32} />
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}
