import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EmployeeService } from "../../../../core/services/employee.service";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { Employee } from "../../../../domain/Entities/employee/employee.model";

@Component({

    selector: 'employees-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: 'employees-component.html'


})

export class EmployeesComponent implements OnInit, OnDestroy {


    // Personas
    employeesTotal = 0;
    employees: Employee[] = [];
    
    
    
    loading = false;
    error : string | null = null;
    
    
    private employeeService = inject(EmployeeService)
    
    
    private destroy$ = new Subject<void>();
    
    
    ngOnDestroy(): void {
        
        
        
    }
    
    
    
    ngOnInit(): void {
        
        
        this.loadAllData();
        
        
    }
    
 
    
    
    loadAllData() {
        
        this.loading= true;
        
        this.error = null;
        
        forkJoin({
            
            
            allEmployees: this.employeeService.getAllEmployees()
        
            
        })
        
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {
               
                
                this.employeesTotal = response.allEmployees.length;

                this.employees = response.allEmployees;
                
                this.loading = false;
                
            },
            error: (err) => {
                
                console.error('Error cargando datos:', err);
                
                this.error= 'Error al cargar datos';
                
                this.loading = false;
                
            }
            
        });
        
        
    }

}