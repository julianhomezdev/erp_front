import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/development.environment";
import { Supplier } from "../../domain/Entities/supplier/supplier.model";
import { Observable } from "rxjs";

@Injectable({

    providedIn: 'root'


})

export class SupplierService {


    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/Suppliers`;

    getSuppliers(): Observable<Supplier[]> {

        return this.http.get<Supplier[]>(this.apiUrl);

    }

    getSupplierById(id: number): Observable<Supplier> {

        return this.http.get<Supplier>(`${this.apiUrl}/${id}`);

    }


}