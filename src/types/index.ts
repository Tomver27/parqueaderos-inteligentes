export type Parking = {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  address: string;
};

export type Space = {
  id: number;
  name: string;
  bookable: boolean;
  id_parking: number;
  id_typev: number;
};

export type ParkingWithSpaces = Parking & {
  totalSpots: number;
  spaces: Space[];
};

export type DocumentType = {
  id: number;
  name: string;
  name_normalized: string;
};

export type Role = {
  id: number;
  name: string;
  description: string;
};

export type TypeVehicle = {
  id: number;
  name: string;
};

export type InviteState =
  | { error: string }
  | { success: true; email: string }
  | undefined;

export type UpdateParamsState = { error: string } | { success: true } | undefined;

export type CreateReservaState =
  | { error: string }
  | {
      success: true;
      reservationId: number;
      referenceCode?: string;
      amount?: number;
      description?: string;
      vehiclePlate?: string;
      parkingName?: string;
      reservationDate?: string;
      buyerEmail?: string;
      buyerName?: string;
    }
  | undefined;

export type AddVehicleState =
  | { error: string }
  | { success: true; vehicleId: number }
  | undefined;

export type Occupation = { id: number; id_space: number };

export type Reservation = {
  id: number;
  id_space: number;
  date: string;
  expires_at: string | null;
  taken: boolean;
};

export type Vehicle = { id: number; plate: string };

export type ParkingParams = {
  id_parking: number;
  cost_reservation: number;
  expires_reservation: number;
  deadline_reservation: number;
  fee: number;
};

export type ReservaParams = Pick<
  ParkingParams,
  "cost_reservation" | "expires_reservation" | "deadline_reservation"
>;

export type SpaceSlot = Pick<Space, "id" | "name" | "bookable">;
export type ParkingInfo = Pick<Parking, "id" | "name" | "address">;
