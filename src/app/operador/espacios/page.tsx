import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ParkingSquare } from "lucide-react";

async function getOperadorSpaces(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: assignments } = await admin
    .from("ParkingOperators")
    .select("id_parking")
    .eq("id_user", user.id);

  const parkingIds = assignments?.map((a) => a.id_parking) ?? [];
  if (parkingIds.length === 0) return [];

  const { data: spaces } = await admin
    .from("Spaces")
    .select("id, name, id_parking, id_typev, Parkings ( name ), TypeVehicles ( name )")
    .in("id_parking", parkingIds)
    .order("name");

  return spaces ?? [];
}

export default async function OperadorEspaciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const spaces = user?.email ? await getOperadorSpaces(user.email) : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Espacios</h1>
      <p className="text-slate-400 text-sm mb-6">
        Estado de los espacios de tu parqueadero
      </p>

      {spaces.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {spaces.map((s: any) => (
            <div
              key={s.id}
              className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-4 text-center"
            >
              <ParkingSquare size={20} className="mx-auto mb-2 text-violet-400" />
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {s.TypeVehicles?.name ?? "General"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <ParkingSquare size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400 text-sm">Sin espacios asignados</p>
        </div>
      )}
    </div>
  );
}
