import { Matrix } from "../matrix/matrix.model";
import { MonitoringSite } from "../project/monitoring-site";

export interface SamplingPlan {
    
    samplingPlanCode: string;
    sitesCount?: number;
    matrixTypes?: Matrix[]
    sites: MonitoringSite[];    

    
    
}