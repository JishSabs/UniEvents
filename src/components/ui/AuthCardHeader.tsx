interface AuthCardHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthCardHeader({ title, subtitle }: AuthCardHeaderProps) {
  return (
    <div className="bg-cyan-600 px-8 py-10 text-center">
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-cyan-600 text-2xl font-bold">U</span>
      </div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-cyan-200 text-sm mt-2">{subtitle}</p>
    </div>
  );
}
