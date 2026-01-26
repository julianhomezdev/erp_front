import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { LogisticsDashboard } from "../../components/logistics/dashboard-view/dashboard-view.component";
import { VehiclesDashboard } from "../../components/logistics/vehicles/vehicles-dashboard.component";

@Component({
    
    selector: 'logistics-page',
    standalone: true,
    imports: [CommonModule, VehiclesDashboard],
    templateUrl: './logistics-page.component.html'
            
})



export class LogisticsPage {}