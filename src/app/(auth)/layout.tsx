import Link from "next/link";
import { Car } from "lucide-react";
import AuthHashHandler from "@/components/auth/AuthHashHandler";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "#0b1120" }}
    >
      <AuthHashHandler />
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
          }}
        >
          <Car size={20} className="text-white" />
        </div>
        <span
          className="text-white"
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Park<span style={{ color: "#06b6d4" }}>Go</span>
        </span>
      </Link>
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
