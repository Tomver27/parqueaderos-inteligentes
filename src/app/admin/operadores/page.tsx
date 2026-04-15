import { createAdminClient } from "@/lib/supabase/server";
import { UserCog } from "lucide-react";
import InviteOperadorForm from "@/components/admin/InviteOperadorForm";
import ResendInviteButton from "@/components/admin/ResendInviteButton";

export default async function AdminOperadoresPage() {
  const admin = createAdminClient();

  const [{ data: operadores }, { data: parkings }] = await Promise.all([
    admin
      .from("Users")
      .select("id, first_name, last_name, email, phone_number")
      .eq("id_role", 2),
    admin.from("Parkings").select("id, name").order("name"),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Operadores</h1>
          <p className="text-slate-400 text-sm">
            Gestión de cuentas de operador
          </p>
        </div>
      </div>

      <InviteOperadorForm parkings={parkings ?? []} />

      {operadores && operadores.length > 0 ? (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Email</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Teléfono</th>
                <th className="text-right px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((op) => (
                <tr key={op.id} className="border-b border-white/[0.05] hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{op.first_name} {op.last_name}</td>
                  <td className="px-4 py-3 text-slate-400">{op.email}</td>
                  <td className="px-4 py-3 text-slate-400">{op.phone_number}</td>
                  <td className="px-4 py-3 text-right">
                    <ResendInviteButton email={op.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <UserCog size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">No hay operadores registrados</p>
        </div>
      )}
    </div>
  );
}
