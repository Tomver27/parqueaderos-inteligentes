import { createAdminClient } from "@/lib/supabase/server";

export type ParkingStats = {
  totalParkings: number;
  freeSpaces: number;
  reservationsToday: number;
};

export async function getParkingStats(): Promise<ParkingStats> {
  const admin = createAdminClient();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [parkingsRes, spacesRes, occupiedRes, reservationsRes] =
    await Promise.all([
      admin.from("Parkings").select("id", { count: "exact", head: true }),
      admin.from("Spaces").select("id", { count: "exact", head: true }),
      admin
        .from("Occupations")
        .select("id", { count: "exact", head: true })
        .is("end_date", null),
      admin
        .from("Reservations")
        .select("id", { count: "exact", head: true })
        .gte("date", today)
        .lt("date", tomorrow),
    ]);

  const totalSpaces = spacesRes.count ?? 0;
  const occupiedSpaces = occupiedRes.count ?? 0;

  return {
    totalParkings: parkingsRes.count ?? 0,
    freeSpaces: totalSpaces - occupiedSpaces,
    reservationsToday: reservationsRes.count ?? 0,
  };
}
