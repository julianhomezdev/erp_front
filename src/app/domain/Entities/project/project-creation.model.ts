  export interface CreateProject {
    Contract: ContractData;
    ServiceOrders: ServiceOrder[];
    CoordinatorIds: number[];
    ProjectDetails: ProjectDetails;
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