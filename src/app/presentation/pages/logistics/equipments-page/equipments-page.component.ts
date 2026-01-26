import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { EquipmentsDashboard } from "../../../components/logistics/equipments/equipments-dashboard.component";

@Component({

    selector: 'equipments-page',
    standalone: true,
    imports: [CommonModule, EquipmentsDashboard],
    templateUrl: './equipments-page.component.html'


})



export class EquipmentsPage {}