import { Coordinator } from "../coordinator/coordinator.model";
import { EmployeeAssignment } from "../employee/employe-assignment.model";
import { OrderService } from "../orderService/order-service.model";
import { VehicleAssignment } from "../vehicle/vehicle-assignment.model";
import { ProjectBudget } from "./project-budget.model";
import { SamplingPlan } from "./project-creation.model";

export interface CreateProject {
    
    
  contract: {
    
    contractCode: string;
    
    contractName: string;
    
    clientId: number;
    
    startDate: string | null;
    
    endDate: string | null;
    
    
  };
  
  chCode: string;
  
  serviceOrders: Array<{
    
    odsCode: string;
    
    odsName: string;
    
    startDate: string | null;
    
    endDate: string | null;
    
    samplingPlans: Array<{
        
      planCode: string;
      
      planName: string;
      
      startDate: string | null;
      
      endDate: string | null;
      
      coordinatorId: number;
      
      sites: Array<{
        
        name: string;
        
        matrixId: number;
        
        matrixName?: string;
        
        executionDate: string | null;
        
        hasReport: boolean;
        
        hasGDB: boolean;
        
      }>;
      
      resources: {
        
        mode: string;
        
        startDate: string | null;
        
        endDate: string | null;
        
        locationId?: number | null;
        
        employeeIds: number[];
        
        equipmentIds: number[];
        
        vehicleIds: number[];
        
        employeeQuantities: Array<{
            
          categoryName: string;
          
          quantity: number;
          
        }>;
        
        equipmentQuantities: Array<{
            
          categoryName: string;
          
          quantity: number;
          
        }>;
        
        vehicleQuantity: number;
        
      };
      
      budget: {
        
        transportCostChemilab: number;
        
        transportBilledToClient: number;
        
        logisticsCostChemilab: number;
        
        logisticsBilledToClient: number;
        
        subcontractingCostChemilab: number;
        
        subcontractingBilledToClient: number;
        
        fluvialTransportCostChemilab: number;
        
        fluvialTransportBilledToClient: number;
        
        reportsCostChemilab: number;
        
        reportsBilledToClient: number;
        
        notes: string | null;
      
    };
    }>;
  }>;
  coordinatorIds: number[];
  
  projectDetails: {
    
    projectName: string;
    
    projectDescription: string;
    
    priority: string;
  };
  
  projectResourceAssignementMode?: number; 
}