import { EmployeeAssignment } from "./employe-assignment.model";

export interface Employee {
  
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    base: string;
    isAvailable: boolean;
    assignments?: EmployeeAssignment[];
  
}