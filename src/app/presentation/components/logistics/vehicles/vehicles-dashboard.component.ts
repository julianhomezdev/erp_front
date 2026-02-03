import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { VehicleService } from "../../../../core/services/vehicle.service";
import { forkJoin, Subject, takeUntil } from "rxjs";
import { Vehicle } from "../../../../domain/Entities/vehicle/vehicle.model";
import { Router } from "@angular/router";
import { VehicleAssignment } from "../../../../domain/Entities/vehicle/vehicle-assignment.model";

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
        
        this.loading = true;
        this.error = null;

        forkJoin({
            
            allVehicles: this.vehicleService.getAllVehicles(),
            
            avaibleVehicles: this.vehicleService.getAvailableVehiclesWithOutDate(),
            
            vehicles: this.vehicleService.getAllVehicles(),
            
            assignments: this.vehicleService.getVehicleAssignments()
            
        })
        
        .pipe(takeUntil(this.destroy$))
        
        .subscribe({
            
            next: (response) => {
                
                this.vehiclesTotal = response.allVehicles.length;
                
                this.avaibleVehicles = response.avaibleVehicles.length;
                
                this.vehicles = this.mergeVehiclesWithAssignments(
                    
                    response.vehicles
                    ,
                    response.assignments
                    
                );
                
                this.loading = false;
                
            },
            
            error: (err) => {
                
                console.error('Error detallado:', err);
                
                console.error('Status:', err.status);
                
                console.error('Status Text:', err.statusText);
                
                console.error('URL:', err.url);
                
                console.error('Response body:', err.error);
                
                this.error = `Error cargando datos de camionetas: ${err.status} - ${err.statusText}`;
                
                this.loading = false;
            }
            
        });
    
    }
    
    mergeVehiclesWithAssignments(
        
        vehicles: Vehicle[],
        
        assignments: VehicleAssignment[]
        
        
    ) : Vehicle[] {
        
        return vehicles.map(vehicle => {
            
            
            const vehiclePlate = vehicle.plateNumber.trim().toUpperCase();
            
            const vehicleAssignments = assignments.filter(
                
                assignment => {
                    
                    
                    const assignmentPlate = assignment.numberPlate.trim().toUpperCase();
                    
                    return assignmentPlate === vehiclePlate;
                
                }
                
            );
            
            const sortedAssignments = vehicleAssignments.sort((a, b) =>
            
                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            
            
            );
            
            return  {
                
                ...vehicle,
                
                assignments: sortedAssignments
                
                
            };
            
        });
        
        
        
    }


    onVehicleClick(vehicleId: number) {

         this.router.navigate(['/logistics/vehicles', vehicleId]);

    }

    onAddVehicle() {

        this.router.navigate(['/logistics/vehicles', 'new']);

    }
    
    formatDate(dateString: string): string {
        
        
        const date = new Date(dateString);
        
        return date.toLocaleDateString('es-CO',  {
            
            day: '2-digit', 
            
            month: 'short', 
            
            year: 'numeric'
     
            
        });
        
        
        
    }

}