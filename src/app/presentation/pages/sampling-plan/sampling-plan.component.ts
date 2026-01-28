import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { SamplingPlanComponent } from "../../components/sampling-plan/sampling-plan.component";

@Component({
        
    selector: 'sampling-plan-page',
    standalone: true,
    imports: [CommonModule,SamplingPlanComponent],
    templateUrl: './sampling-plan.component.html',
        
})

export  class SamplingPlanPage {}

