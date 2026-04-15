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
    .select("id, name, bookable, id_parking, id_typev, Parkings ( name ), TypeVehicles ( name )")
    .in("id_parking", parkingIds)
    .order("name");

  // Active occupations (end_date IS NULL) for these spaces
  const spaceIds = spaces?.map((s) => s.id) ?? [];
  const { data: occupations } = spaceIds.length
    ? await admin
        .from("Occupations")
        .select("id_space")
        .in("id_space", spaceIds)
        .is("end_date", null)
    : { data: [] };

  const occupiedSet = new Set(occupations?.map((o) => o.id_space) ?? []);

  return (spaces ?? []).map((s) => ({ ...s, occupied: occupiedSet.has(s.id) }));
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
              className={`rounded-xl border p-4 text-center ${
                s.occupied
                  ? "border-red-500/30 bg-red-950/30"
                  : "border-white/[0.07] bg-[#0f172a]"
              }`}
            >
              <ParkingSquare
                size={20}
                className={`mx-auto mb-2 ${s.occupied ? "text-red-400" : "text-violet-400"}`}
              />
              <p className="font-semibold text-sm">{s.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {s.TypeVehicles?.name ?? "General"}
              </p>
              <div className="mt-2 flex flex-col items-center gap-1">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.bookable
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {s.bookable ? "Reservable" : "Uso libre"}
                </span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    s.occupied
                      ? "bg-red-500/15 text-red-400"
                      : "bg-emerald-500/15 text-emerald-400"
                  }`}
                >
                  {s.occupied ? "Ocupado" : "Disponible"}
                </span>
              </div>
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
