import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { VehicleService } from "../../../../core/services/vehicle.service";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { Vehicle } from "../../../../domain/Entities/vehicle/vehicle.model";
import { Router } from "@angular/router";

@Component({

    selector: 'vehicles-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './vehicles-dashboard.component.html'



})

export class VehiclesDashboard implements OnInit, OnDestroy {


    // Camionetas
    vehiclesTotal = 0;
    avaibleVehicles = 0;
    vehicles :Vehicle[] = [];
    loading = false;
    error : string | null = null;
    
    
    private vehicleService = inject(VehicleService);
    private router = inject(Router);
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
            
            allVehicles: this.vehicleService.getAllVehicles(),
            
            avaibleVehicles: this.vehicleService.getAvailableVehiclesWithOutDate(),
            
            vehicles: this.vehicleService.getAllVehicles()
            
        })
        
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {
                
                this.vehiclesTotal = response.allVehicles.length;
                
                this.avaibleVehicles = response.avaibleVehicles.length;

                this.vehicles = response.vehicles;
                                
                this.loading = false;
                
            },
            error: (err) => {
                
                console.error('Error cargando datos de camionetas:', err);
                
                this.error= 'Error cargando datos de camionetas';
                
                this.loading = false;
                
            }
            
        });
        
        
    }


    onVehicleClick(vehicleId: number) {

         this.router.navigate(['/logistics/vehicles', vehicleId]);

    }

    onAddVehicle() {

        this.router.navigate(['/logistics/vehicles', 'new']);

    }

}