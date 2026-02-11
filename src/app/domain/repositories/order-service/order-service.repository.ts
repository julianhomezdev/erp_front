
import { Observable } from "rxjs";
import { OrderService } from "../../Entities/orderService/order-service.model";



export abstract class OrderServiceRepository {
    
    abstract getAll(): Observable<OrderService[]>;
    
    
}