// employees-component.ts
import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EmployeeService } from "../../../../core/services/employee.service";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { Employee } from "../../../../domain/Entities/employee/employee.model";
import { EmployeeAssignment } from "../../../../domain/Entities/employee/employe-assignment.model";

@Component({
    selector: 'employees-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: 'employees-component.html'
})
export class EmployeesComponent implements OnInit, OnDestroy {

    employeesTotal = 0;
    employees: Employee[] = [];
    
    selectedFilter: string = 'TODOS';
    availableCategories: string[] = [];
    filteredEmployees: Employee[] = [];
    
    loading = false;
    error: string | null = null;
    
    private employeeService = inject(EmployeeService);
    private destroy$ = new Subject<void>();
    
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
    
    ngOnInit(): void {
        this.loadAllData();
    }
    
    loadAllData() {
        this.loading = true;
        this.error = null;
        
        forkJoin({
            
            allEmployees: this.employeeService.getAllEmployees(),
            
            assignments: this.employeeService.getEmployeeAssignments()
            
        })
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {
                
               
                
                this.employees = this.mergeEmployeesWithAssignments(
                    
                    response.allEmployees, 
                    
                    response.assignments
                );
                
                this.employeesTotal = this.employees.length;
                
                this.filteredEmployees = this.employees;
                
                this.extractCategories();
                
                this.loading = false;
            },
            error: (err) => {
                
                console.error('Error cargando datos:', err);
                
                this.error = 'Error al cargar datos';
                
                this.loading = false;
            }
        });
    }
    
    private mergeEmployeesWithAssignments(
        
        employees: Employee[], 
        
        assignments: EmployeeAssignment[]
        
    ): Employee[] {

        
        return employees.map(employee => {
            
            const employeeFullName = employee.name.trim().toUpperCase();
            
            const employeeAssignments = assignments.filter(
                
                assignment => {
                    
                    const assignmentName = assignment.name.trim().toUpperCase();
                
                    return assignmentName === employeeFullName;
                
                }
                    
            );
            
            const sortedAssignments = employeeAssignments.sort((a, b) => 
                
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                
            );
            
            return {
                
                ...employee,
                
                assignments: sortedAssignments
                
            };
        });
    }
    
    extractCategories() {
        
        const categoriesSet = new Set(this.employees.map(eq => eq.base));
        
        this.availableCategories = Array.from(categoriesSet).sort();
        
    }
    
    filterByCategory(category: string) {
        
        this.selectedFilter = category;
        
        if (category === 'TODOS') {
            
            this.filteredEmployees = this.employees;
            
        } else {
            
            this.filteredEmployees = this.employees.filter(e => e.base === category);
        }
    }
    
    getCategoryCount(category: string): number {
        
        if (category === 'TODOS') {
            
            return this.employees.length;
            
        }
        return this.employees.filter(e => e.base === category).length;
        
    }
    
    formatDate(dateString: string): string {
        
        const date = new Date(dateString);
        
        return date.toLocaleDateString('es-CO', { 
            
            day: '2-digit', 
            
            month: 'short', 
            
            year: 'numeric' 
            
        });
    }
}