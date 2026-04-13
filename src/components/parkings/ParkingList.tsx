import type { Parking } from "@/types";
import ParkingCard from "./ParkingCard";

type Props = {
  parkings: Parking[];
};

export default function ParkingList({ parkings }: Props) {
  if (parkings.length === 0) {
    return (
      <p className="text-sm text-zinc-400">No hay parqueaderos registrados.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {parkings.map((parking) => (
        <li key={parking.id}>
          <ParkingCard parking={parking} />
        </li>
      ))}
    </ul>
  );
}
