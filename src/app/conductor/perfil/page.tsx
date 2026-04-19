import { createAdminClient, createClient } from "@/lib/supabase/server";
import { UserCircle } from "lucide-react";
import { fmtDateCO } from "@/lib/dates";

async function getConductorProfile(email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("Users")
    .select("id, first_name, second_name, last_name, email, phone_number, document, created_at, DocumentTypes ( name )")
    .eq("email", email)
    .single();
  return data;
}

export default async function ConductorPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user?.email ? await getConductorProfile(user.email) : null;

  if (!profile) {
    return <p className="text-slate-400">No se pudo cargar el perfil.</p>;
  }

  const fields = [
    { label: "Nombre", value: `${profile.first_name} ${profile.second_name ?? ""} ${profile.last_name}`.trim() },
    { label: "Email", value: profile.email },
    { label: "Teléfono", value: profile.phone_number },
    { label: "Documento", value: `${(profile as any).DocumentTypes?.name ?? ""} ${profile.document}`.trim() },
    { label: "Miembro desde", value: fmtDateCO(new Date(profile.created_at)) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Mi perfil</h1>
      <p className="text-slate-400 text-sm mb-6">
        Tu información personal
      </p>

      <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xl font-bold">
            {profile.first_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg">{profile.first_name} {profile.last_name}</p>
            <p className="text-slate-400 text-sm">Conductor</p>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex justify-between items-center text-sm py-2 border-b border-white/[0.05] last:border-0"
            >
              <span className="text-slate-400">{f.label}</span>
              <span className="font-medium">{f.value || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
