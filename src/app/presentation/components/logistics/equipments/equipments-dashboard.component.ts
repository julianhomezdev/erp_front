import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { EquipmentService } from "../../../../core/services/equipment.service";
import { Equipment } from "../../../../domain/Entities/Equipment/equipment.model";
import { forkJoin, Subject, takeUntil } from "rxjs";

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

            equipments: this.equipmentService.getAllEquipment(),
            
            
            
        })
        
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {

                this.equipmentsTotal = response.equipments.length
                
                this.equipments = response.equipments
                                
                this.loading = false;
                
            },
            error: (err) => {
                
                console.error('Error cargando datos de equipos:', err);
                
                this.error= 'Error cargando datos de equipos';
                
                this.loading = false;
                
            }
            
        });
        
        
    }

}