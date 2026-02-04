import { EquipmentAssignment } from "./equipment-assignment.model";

export interface Equipment {
  id: number;
  code: string;
  name: string;
  description: string;
  serialNumber: string;
  status: string;
  isAvailable: boolean;
  assignments: EquipmentAssignment[];
}