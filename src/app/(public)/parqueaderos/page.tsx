import { createAdminClient } from "@/lib/supabase/server";
import type { ParkingWithSpaces } from "@/types";
import ParkingPageClient from "@/components/parking/ParkingPageClient";

type RawSpace = {
  id: number;
  name: string;
  bookable: boolean;
  id_parking: number;
  id_typev: number;
  Occupations: { id: number; end_date: string | null }[];
  Reservations: { id: number; expires_at: string | null; taken: boolean }[];
};

type RawParking = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
  Spaces: RawSpace[];
};

export default async function NearbyParkingPage() {
  const supabase = createAdminClient();

  const { data: parkings } = await supabase
    .from("Parkings")
    .select(`
      id, name, latitude, longitude, address,
      Spaces(
        id, name, bookable, id_parking, id_typev,
        Occupations(id, end_date),
        Reservations(id, expires_at, taken)
      )
    `)
    .returns<RawParking[]>();

  const now = new Date();

  const mapped: ParkingWithSpaces[] = (parkings ?? []).map((p) => {
    const spaces = p.Spaces ?? [];

    const availableSpots = spaces.filter(
      (s) =>
        !s.bookable &&
        !s.Occupations?.some((o) => o.end_date === null),
    ).length;

    const reservableSpots = spaces.filter(
      (s) =>
        s.bookable &&
        !s.Reservations?.some(
          (r) => !r.taken && r.expires_at && new Date(r.expires_at) >= now,
        ),
    ).length;

    return {
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      address: p.address,
      spaces: spaces.map(({ id, name, bookable, id_parking, id_typev }) => ({
        id,
        name,
        bookable,
        id_parking,
        id_typev,
      })),
      totalSpots: spaces.length,
      availableSpots,
      reservableSpots,
    };
  });

  return <ParkingPageClient parkings={mapped} />;
}
