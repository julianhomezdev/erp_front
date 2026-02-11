import { SamplingPlan } from "../project/project-creation.model";

export interface OrderService {
    
    id: number;
    odsCode: string;
    totalValue: number;
    consumedValue: number;
    remainingValue: number;
    isGlobal: boolean;
    samplingPlans: SamplingPlan[];
    
}