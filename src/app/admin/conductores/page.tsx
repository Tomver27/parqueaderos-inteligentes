import { createAdminClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import { fmtDateCO } from "@/lib/dates";

export default async function AdminConductoresPage() {
  const admin = createAdminClient();
  const { data: conductores } = await admin
    .from("Users")
    .select("id, first_name, last_name, email, phone_number, created_at")
    .eq("id_role", 3)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Conductores</h1>
          <p className="text-slate-400 text-sm">
            {conductores?.length ?? 0} conductor{(conductores?.length ?? 0) !== 1 ? "es" : ""} registrado{(conductores?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {conductores && conductores.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Email</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Teléfono</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Registro</th>
              </tr>
            </thead>
            <tbody>
              {conductores.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone_number}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {fmtDateCO(new Date(c.created_at))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No hay conductores registrados</p>
        </div>
      )}
    </div>
  );
}
