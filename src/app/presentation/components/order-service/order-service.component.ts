import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { OrderServiceService } from "../../../core/services/order-service..service";
import { OrderService } from "../../../domain/Entities/orderService/order-service.model";

@Component({
    selector: 'order-service-component',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './order-service.component.html'
})
export class OrderServiceComponent implements OnInit, OnDestroy {
    
    loading = false;
    errorMessage = '';
    successMessage = '';
    lastOds: string = '';
    
    private orderServiceService = inject(OrderServiceService);
  
    ngOnDestroy(): void {
        this.lastOds = "";
    }
    
    ngOnInit(): void {
        this.loadLastOds();
    }
    
    onCancel(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }
    
    generateOds(): void {
        
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';
        
        this.orderServiceService.createNewOds().subscribe({
            next: (ods: OrderService) => {
                //this.successMessage = `Orden de servicio ${ods.odsCode} creada exitosamente`;
                //this.lastOds = ods.odsCode;
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = 'Error al crear la orden de servicio';
                console.error('Error: ', error);
                this.loading = false;
            }
            
        });
        
    }
    
    loadLastOds(): void {
        this.loading = true;
        this.errorMessage = '';
        
        this.orderServiceService.getLastOds().subscribe({
            next: (ods: OrderService) => {
                
                console.log(ods);
                //this.lastOds = ods.odsCode;
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = "Error al cargar la última orden de servicio";
                console.error('Error: ', error);
                this.loading = false;
            }
        });
    }
}