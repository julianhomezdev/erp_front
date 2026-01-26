export interface Vehicle {
    id: number;
    plateNumber: string;
    brand?: string;
    model?: string;
    year?: number;
    status: string;
    ownership?: number;
    costPerDay?: number;
    supplierId?: number;
    locationId?: number;
}

export interface CreateVehicle {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  locationId?: number;
}

export interface UpdateVehicle {
  brand: string;
  model: string;
  year: number;
  status: string;
  locationId?: number;
}