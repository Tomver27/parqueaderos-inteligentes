import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import ReservarPageClient from "@/components/reservar/ReservarPageClient";

const ROLE_CONDUCTOR = 3;

async function getParkingData(parkingId: number) {
  const admin = createAdminClient();

  const [parkingRes, spacesRes, paramsRes] = await Promise.all([
    admin.from("Parkings").select("id, name, address").eq("id", parkingId).single(),
    admin
      .from("Spaces")
      .select("id, name, bookable")
      .eq("id_parking", parkingId)
      .eq("bookable", true)
      .order("name"),
    admin
      .from("Parameters")
      .select("cost_reservation, expires_reservation, deadline_reservation")
      .eq("id_parking", parkingId)
      .single(),
  ]);

  return {
    parking: parkingRes.data,
    spaces: spacesRes.data ?? [],
    params: paramsRes.data ?? null,
  };
}

async function getSpaceAvailability(spaceIds: number[]) {
  if (spaceIds.length === 0) return { occupations: [], reservations: [] };
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [occupationsRes, reservationsRes] = await Promise.all([
    admin
      .from("Occupations")
      .select("id, id_space")
      .in("id_space", spaceIds)
      .is("end_date", null),
    admin
      .from("Reservations")
      .select("id, id_space, date, expires_at, taken")
      .in("id_space", spaceIds)
      .gte("expires_at", now)
      .eq("taken", false),
  ]);

  return {
    occupations: occupationsRes.data ?? [],
    reservations: reservationsRes.data ?? [],
  };
}

async function getConductorVehicles(email: string) {
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("Users")
    .select("id")
    .eq("email", email)
    .single();
  if (!user) return [];

  const { data: vehicles } = await admin
    .from("Vehicle")
    .select("id, plate")
    .eq("id_user", user.id)
    .order("plate");

  return vehicles ?? [];
}

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ parkingId?: string }>;
}) {
  const { parkingId: parkingIdStr } = await searchParams;
  const parkingId = Number(parkingIdStr);

  if (!parkingId) {
    redirect("/parqueaderos");
  }

  const { parking, spaces, params } = await getParkingData(parkingId);
  if (!parking) {
    redirect("/parqueaderos");
  }

  const spaceIds = spaces.map((s) => s.id);
  const { occupations, reservations } = await getSpaceAvailability(spaceIds);

  // Check user auth and role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isConductor = false;
  let vehicles: { id: number; plate: string }[] = [];

  if (user?.email) {
    const admin = createAdminClient();
    const { data: dbUser } = await admin
      .from("Users")
      .select("id_role")
      .eq("email", user.email)
      .single();

    if (dbUser?.id_role === ROLE_CONDUCTOR) {
      isConductor = true;
      vehicles = await getConductorVehicles(user.email);
    }
  }

  return (
    <ReservarPageClient
      parking={parking}
      spaces={spaces}
      occupations={occupations}
      reservations={reservations}
      params={params}
      isConductor={isConductor}
      vehicles={vehicles}
    />
  );
}
