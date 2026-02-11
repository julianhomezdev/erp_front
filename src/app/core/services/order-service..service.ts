import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/development.environment";
import { OrderService } from "../../domain/Entities/orderService/order-service.model";
import { Observable } from "rxjs";
import { ReusableOds, ReusableOdsSummary } from "../../domain/Entities/orderService/reusable-ods-summary.model";

@Injectable({
    
    providedIn: 'root'
    
})


export class OrderServiceService {
    
    
    
    private http = inject(HttpClient);
    
    private readonly apiUrl = `${environment.apiUrl}/OrderService`;
    
    
    
    getLastOds(): Observable<OrderService> {
        
        return this.http.get<OrderService>(this.apiUrl)
        
    }
    
    createNewOds():  Observable<OrderService> {
        
        return this.http.post<OrderService>(this.apiUrl, {})
        
    }


    // Obtener las ods ya creadas para poder reusar su configuración 
    getReusableOdsList():  Observable<ReusableOdsSummary[]> {


        return this.http.get<ReusableOdsSummary[]>(`${this.apiUrl}/reusable`)



    }

    // Obtener la config de una ods reusable elegida
    getReusableOds(odsCode : string): Observable<ReusableOds> {

        return this.http.get<ReusableOds>(`${this.apiUrl}/reusable/${odsCode}`)


    }
    
    
    
}