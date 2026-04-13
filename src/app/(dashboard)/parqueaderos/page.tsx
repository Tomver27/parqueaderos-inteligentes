import { createAdminClient } from "@/lib/supabase/server";
import type { ParkingWithSpaces } from "@/types";
import ParkingPageClient from "@/components/parking/ParkingPageClient";

export default async function NearbyParkingPage() {
  const supabase = createAdminClient();

  const { data: parkings } = await supabase
    .from("Parkings")
    .select("id, name, latitude, longitude, address, Spaces(id, name, id_parking, id_typev)")
    .returns<(ParkingWithSpaces & { Spaces: ParkingWithSpaces["spaces"] })[]>();

  const mapped: ParkingWithSpaces[] = (parkings ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    spaces: p.Spaces ?? [],
    totalSpots: (p.Spaces ?? []).length,
  }));

  return <ParkingPageClient parkings={mapped} />;
}
