import { Client } from "../client/client.model";
import { Contract } from "../contract/contract.model";
import { Coordinator } from "../coordinator/coordinator.model";
import { EmployeeAssignmentResponse } from "../employee/employee-assignment-response.model";
import { OrderService } from "../orderService/order-service.model";
import { VehicleAssignmentResponse } from "../vehicle/vehicle-assignment-response.model";
import { ProjectBudgetResponse } from "./project-budget-response.model";

export interface ProjectResponse {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    client: Client;
    orderService: OrderService;
    contract?: Contract;
    Location?: Location;
    coordinator: Coordinator;
    employeeAssignments: EmployeeAssignmentResponse[];
    vehicleAssignments: VehicleAssignmentResponse[];
    budget?: ProjectBudgetResponse;
    
    
}