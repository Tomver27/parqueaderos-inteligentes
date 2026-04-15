"use client";

import { useState } from "react";
import { RotateCw, Check } from "lucide-react";
import { resendInvite } from "@/lib/actions/admin";

export default function ResendInviteButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setStatus("loading");
    const result = await resendInvite(email);
    if (result.error) {
      setErrorMsg(result.error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <Check size={12} /> Enviada
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-400 transition-all hover:bg-white/[0.05] disabled:opacity-50"
        title="Reenviar invitación"
      >
        <RotateCw size={12} className={status === "loading" ? "animate-spin" : ""} />
        {status === "loading" ? "Enviando..." : "Reenviar"}
      </button>
      {status === "error" && (
        <span className="text-[10px] text-red-400">{errorMsg}</span>
      )}
    </div>
  );
}
