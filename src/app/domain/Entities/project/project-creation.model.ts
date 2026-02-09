export interface CreateProject {
  contract: {
    contractCode: string;
    contractName?: string;
    clientId: number;
    startDate?: string | null;
    endDate?: string | null;
  };
  serviceOrders: Array<{
    odsCode: string;
    odsName?: string;
    startDate?: string | null;
    endDate?: string | null;
    samplingPlans: Array<{
      planCode: string;
      planName?: string;
      startDate?: string | null;
      endDate?: string | null;
      coordinatorId: number;
      sites: Array<{
        name: string;
        matrixId: number;
        executionDate?: string | null;
        hasReport: boolean;
        hasGDB: boolean;
      }>;
      resources: {
        mode: string;
        startDate?: string | null;
        endDate?: string | null;
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
        vehicleQuantity?: number;
      };
      budget: {
        chCode?: string;  
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
        notes?: string;
      };
    }>;
  }>;
  coordinatorIds: number[];
  projectDetails: {
    projectName: string;
    projectDescription?: string;
    priority: string;
  };
  chCode: string;  
}
  export interface ContractData {
    ContractCode: string;
    ContractName: string;
    ClientId: number;
    StartDate: string | null;
    EndDate: string | null;
  }

  export interface ServiceOrder {
    OdsCode: string;
    OdsName: string;
    StartDate: string | null;
    EndDate: string | null;
    SamplingPlans: SamplingPlan[];
  }

  export interface SamplingPlan {
    PlanCode: string;
    StartDate: string | null;
    EndDate: string | null;
    Sites: MonitoringSite[];
    Resources: PlanResources | null;
    Budget: PlanBudget | null;
  }

  export interface MonitoringSite {
    Name: string;
    MatrixId: number;
    ExecutionDate: string | null;
    HasReport: boolean;
    HasGDB: boolean;
    
    IsSubcontracted: boolean;
    SubcontractorName?: string | null;
    
  }

  export interface PlanResources {
    StartDate: string | null;
    EndDate: string | null;
    EmployeeIds: number[];
    EquipmentIds: number[];
    VehicleIds: number[];
  }

  export interface PlanBudget {
    CHCode: string;
    TransportCostChemilab: number;
    TransportBilledToClient: number;
    LogisticsCostChemilab: number;
    LogisticsBilledToClient: number;
    SubcontractingCostChemilab: number;
    SubcontractingBilledToClient: number;
    FluvialTransportCostChemilab: number;
    FluvialTransportBilledToClient: number;
    ReportsCostChemilab: number;
    ReportsBilledToClient: number;
    Notes: string;
  }

  export interface ProjectDetails {
    ProjectName: string;
    ProjectDescription: string;
    Priority: string;
  }