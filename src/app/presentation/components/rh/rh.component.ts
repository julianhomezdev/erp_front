import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EmployeeService } from "../../../core/services/employee.service";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { EmployeesComponent } from "./employees-component/employees-component";

@Component({
    
    selector: 'rh-component',
    standalone: true,
    imports: [CommonModule, EmployeesComponent],
    templateUrl: './rh.component.html'
    
    
})


export class RhComponent  {
 
   
    
    
    
    
    
    
    
    
    
    
    
}