import { SamplingPlan } from "../samplingPlan/sampling-plan.model";

export interface ReusableOdsSummary {

    odsCode: string;
    odsName: string;
    quantitySamplingPlans: number;

}

export interface ReusableOds {

    odsCode: string;
    odsName: string;
    samplingPlans: SamplingPlan[];
}