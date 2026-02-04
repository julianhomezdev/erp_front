import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EquipmentService } from "../../../../core/services/equipment.service";
import { Equipment } from "../../../../domain/Entities/Equipment/equipment.model";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { EquipmentAssignment } from "../../../../domain/Entities/Equipment/equipment-assignment.model";

@Component({


    selector: 'equipments-dashboard',
    
    standalone: true,
    
    imports: [CommonModule],
    
    templateUrl: './equipments-dashboard.component.html'


})



export class EquipmentsDashboard implements OnInit, OnDestroy {


    loading = false;
    error : string | null = null;

    private equipmentService =  inject(EquipmentService)


    equipmentsTotal = 0;   
    equipments: Equipment[] = [];
    filteredEquipments: Equipment[] = [];
    
    selectedFilter: string = 'TODOS';
    availableCategories: string[] = [];

    private destroy$ = new Subject<void>();



    ngOnDestroy(): void {
        
        this.destroy$.next();
        
        this.destroy$.complete();

    }


    ngOnInit(): void {
        
        this.loadAllData();

    }


    loadAllData() {
        
        this.loading= true;
        
        this.error = null;
        
        forkJoin({

            equipments: this.equipmentService.getAllEquipment(),
            
            assignments: this.equipmentService.getEquipmentAssignments()
      
        })
        
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {

                this.equipmentsTotal = response.equipments.length;
                
                this.equipments = this.mergeEquipmentsWithAssignments(
                    
                    response.equipments,
                    response.assignments
                    
                    
                )
        
                this.filteredEquipments = this.equipments;
                
                this.extractCategories();
                                
                this.loading = false;
                
            },
            error: (err) => {
                
                console.error('Error cargando datos de equipos:', err);
                
                this.error= 'Error cargando datos de equipos';
                
                this.loading = false;
                
            }
            
        });
        
        
    }
    
    
    mergeEquipmentsWithAssignments(
        
        equipments: Equipment[],
        
        assignments: EquipmentAssignment[]
        
        
    ): Equipment[] {
        
        return equipments.map(equipment => {
            
            const equipmentCode = equipment.code.trim().toUpperCase();
            
            const equipmentAssignments = assignments.filter(
                
                assignment => {
                    
                    
                    const assignmentCode = assignment.code.trim().toUpperCase();
                    
                    return assignmentCode === equipmentCode;
                    
                    
                }  
                
            );
            
            
            const sortedAssignments = equipmentAssignments.sort((a, b) =>
            
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            
            
            );
            
            
            return  {
                
                
                ...equipment,
                
                assignments: sortedAssignments
                
                
            };
            
        });
        
    }
    
    
    extractCategories() {
        
        const categoriesSet = new Set(this.equipments.map(eq => eq.name));
        
        this.availableCategories = Array.from(categoriesSet).sort();
        
    }
    
    filterByCategory(category: string) {
        
        
        this.selectedFilter = category;
        
        if(category === 'TODOS') {
            
            this.filteredEquipments = this.equipments;
            
        } else {
            
            this.filteredEquipments = this.equipments.filter(eq => eq.name === category);
            
        }
        
    }
    
    
    getCategoryCount(category: string): number {
        
        if (category === 'TODOS') {
            
            return this.equipments.length;
            
        }
        
        return this.equipments.filter(eq => eq.name === category).length;
        
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