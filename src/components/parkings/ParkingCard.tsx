import type { Parking } from "@/types";

type Props = {
  parking: Parking;
};

export default function ParkingCard({ parking }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900">{parking.name}</h3>
          <p className="mt-1 text-xs text-zinc-400">{parking.address}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Activo
        </span>
      </div>
    </div>
  );
}
