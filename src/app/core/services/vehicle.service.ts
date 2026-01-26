import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateVehicle, UpdateVehicle, Vehicle } from '../../domain/Entities/vehicle/vehicle.model';
import { environment } from '../../environments/development.environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  
  
  private http = inject(HttpClient);
  
  
  private apiUrl = `${environment.apiUrl}/Vehicle`;

  getAllVehicles(): Observable<Vehicle[]> {
    
    
    return this.http.get<Vehicle[]>(this.apiUrl);
    
    
  }

  getAvailableVehicles(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available?startDate=${startDate}&endDate=${endDate}`);
  }

  getAvailableVehiclesWithOutDate(): Observable<Vehicle[]> {
    
    
    return this.http.get<Vehicle[]>(`${this.apiUrl}/available/all`);
    
    
  }

  getVehicleById(id: number): Observable<Vehicle> {

    return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);

  }

  createVehicle(vehicle: CreateVehicle): Observable<Vehicle> {

    return this.http.post<Vehicle>(this.apiUrl, vehicle);

  }

  updateVehicle(id: number, vehicle: UpdateVehicle): Observable<Vehicle> {

    return this.http.put<Vehicle>(`${this.apiUrl}/${id}`, vehicle);

  }

  deleteVehicle(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);
    
  }

}