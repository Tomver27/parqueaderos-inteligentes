import { createAdminClient, createClient } from "@/lib/supabase/server";
import SpacesTable from "@/components/operador/SpacesTable";
import EditSpaceForm from "@/components/operador/EditSpaceForm";
import { Plus } from "lucide-react";

async function getOperadorData(email: string) {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return { spaces: [], vehicleTypes: [], parkingIds: [] };

  const { data: assignments } = await admin
    .from("ParkingOperators")
    .select("id_parking")
    .eq("id_user", user.id);

  const parkingIds = assignments?.map((a) => a.id_parking) ?? [];
  if (parkingIds.length === 0) return { spaces: [], vehicleTypes: [], parkingIds };

  const { data: spaces } = await admin
    .from("Spaces")
    .select("id, name, bookable, id_parking, id_typev, Parkings ( name ), TypeVehicles ( name )")
    .in("id_parking", parkingIds)
    .order("id_parking, name");

  const spaceIds = spaces?.map((s) => s.id) ?? [];
  const { data: occupations } = spaceIds.length
    ? await admin
        .from("Occupations")
        .select("id_space")
        .in("id_space", spaceIds)
        .is("end_date", null)
    : { data: [] };

  const occupiedSet = new Set(occupations?.map((o) => o.id_space) ?? []);

  const { data: vehicleTypes } = await admin
    .from("TypeVehicles")
    .select("id, name")
    .order("name");

  return {
    spaces: (spaces ?? []).map((s) => ({ ...s, occupied: occupiedSet.has(s.id) })),
    vehicleTypes: vehicleTypes ?? [],
    parkingIds,
  };
}

export default async function OperadorEspaciosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { spaces, vehicleTypes, parkingIds } = user?.email
    ? await getOperadorData(user.email)
    : { spaces: [], vehicleTypes: [], parkingIds: [] };

  const groupedSpaces = new Map<number, any[]>();
  spaces.forEach((space: any) => {
    if (!groupedSpaces.has(space.id_parking)) {
      groupedSpaces.set(space.id_parking, []);
    }
    groupedSpaces.get(space.id_parking)!.push(space);
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Espacios</h1>
          <p className="text-slate-400 text-sm">
            Administra los espacios de tu parqueadero
          </p>
        </div>
        {parkingIds.length > 0 && (
          <EditSpaceForm
            vehicleTypes={vehicleTypes}
            parkingId={parkingIds[0]}
          />
        )}
      </div>

      {groupedSpaces.size > 0 ? (
        <div className="space-y-8">
          {Array.from(groupedSpaces.entries()).map(([parkingId, parkingSpaces]) => (
            <div key={parkingId}>
              <h2 className="text-lg font-semibold mb-4">
                {parkingSpaces[0]?.Parkings?.name || `Parqueadero ${parkingId}`}
              </h2>
              <SpacesTable
                spaces={parkingSpaces}
                vehicleTypes={vehicleTypes}
                parkingId={parkingId}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-[#0f172a] p-12 text-center">
          <p className="text-slate-400 text-sm">Sin espacios asignados</p>
        </div>
      )}
    </div>
  );
}
