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
  | { success: true; reservationId: number }
  | undefined;
