import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { VehiclesDashboard } from "../../../components/logistics/vehicles/vehicles-dashboard.component";

@Component({

    selector: 'vehicles-page',
    standalone: true,
    imports: [CommonModule, VehiclesDashboard],
    templateUrl: './vehicles-page.component.html'


})


export class VehiclesPage {}