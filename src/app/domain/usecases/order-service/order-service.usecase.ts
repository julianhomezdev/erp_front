import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { OrderServiceRepository } from "../../repositories/order-service/order-service.repository";
import { OrderService } from "../../Entities/orderService/order-service.model";

@Injectable({
    
    
    providedIn: 'root'
    
})


export class GetOrderServiceUseCase {
    
    
    constructor(private repository: OrderServiceRepository) {}
    
    
    execute(): Observable<OrderService[]> {
        
        return this.repository.getAll();   
        
    }
    
    
    
}