"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createParking, updateParking, type ParkingFormState } from "@/lib/actions/admin";
import { Building2, MapPin, Plus, X } from "lucide-react";
import type { Parking } from "@/types";
import LocationPickerWrapper from "@/components/map/LocationPickerWrapper";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/[0.07] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm";

interface Props {
  parking?: Parking;
  defaultOpen?: boolean;
}

export default function ParkingForm({ parking, defaultOpen = false }: Props) {
  const isCreating = !parking;
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [lat, setLat] = useState(parking?.latitude ?? "");
  const [lng, setLng] = useState(parking?.longitude ?? "");
  const [pickerKey, setPickerKey] = useState(0);

  const action = isCreating ? createParking : updateParking;
  const [state, formAction, isPending] = useActionState<ParkingFormState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.success) handleClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  function handleOpen() {
    setLat(parking?.latitude ?? "");
    setLng(parking?.longitude ?? "");
    setPickerKey((k) => k + 1);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.search.includes("parqueadero")) {
      router.replace("/admin/parqueaderos", { scroll: false });
    }
  }

  if (!open) {
    return isCreating ? (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
      >
        <Plus size={16} />
        Nuevo parqueadero
      </button>
    ) : (
      <button
        onClick={handleOpen}
        className="px-3 py-1 rounded text-sm bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition"
      >
        Editar
      </button>
    );
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold">
              {isCreating ? "Nuevo parqueadero" : "Editar parqueadero"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {state.error && (
          <div
            className="rounded-lg px-4 py-2 text-sm mb-4"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {!isCreating && <input type="hidden" name="id" value={parking.id} />}
          <input type="hidden" name="latitude" value={lat} />
          <input type="hidden" name="longitude" value={lng} />

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nombre *
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={parking?.name ?? ""}
              placeholder="Ej: Parqueadero Norte"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Dirección *
            </label>
            <input
              type="text"
              name="address"
              required
              defaultValue={parking?.address ?? ""}
              placeholder="Ej: Calle 123 #45-67"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Ubicación en mapa *
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Haz clic en el mapa para colocar el marcador. Puedes arrastrarlo para ajustar.
            </p>
            <div className="isolate h-56 rounded-lg overflow-hidden border border-white/[0.07]">
              <LocationPickerWrapper
                key={pickerKey}
                lat={hasCoords ? parsedLat : undefined}
                lng={hasCoords ? parsedLng : undefined}
                onChange={(la, ln) => {
                  setLat(la.toFixed(6));
                  setLng(ln.toFixed(6));
                }}
              />
            </div>
            {hasCoords ? (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="text-blue-400 shrink-0" />
                <span className="font-mono">
                  {parsedLat.toFixed(6)}, {parsedLng.toFixed(6)}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-400/80">
                Sin ubicación seleccionada
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.07] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !hasCoords}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
            >
              {isPending ? "Guardando..." : isCreating ? "Crear" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
