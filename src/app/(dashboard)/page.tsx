import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import ParkingList from "@/components/parkings/ParkingList";
import ParkingMapWrapper from "@/components/map/ParkingMapWrapper";
import type { Parking } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: parkings, error } = await supabase
    .from("Parkings")
    .select("id, name, latitude, longitude, address")
    .returns<Parking[]>();

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-red-500">
          Error al cargar parqueaderos: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Parqueaderos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {parkings.length} sede{parkings.length !== 1 ? "s" : ""} registrada
            {parkings.length !== 1 ? "s" : ""}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-100"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <div className="h-[420px] w-full overflow-hidden rounded-xl border border-zinc-200 shadow-sm">
        <ParkingMapWrapper parkings={parkings} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
          Sedes
        </h2>
        <ParkingList parkings={parkings} />
      </section>
    </main>
  );
}
