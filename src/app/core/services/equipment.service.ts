import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/development.environment';
import { Equipment } from '../../domain/Entities/Equipment/equipment.model';
import { EquipmentAssignment } from '../../domain/Entities/Equipment/equipment-assignment.model';


@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/equipment`;

  getAllEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.apiUrl);
  }



  getAvailableEquipment(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available?startDate=${startDate}&endDate=${endDate}`);
  }
  
  getEquipmentAssignments(): Observable<EquipmentAssignment[]> {
      
      
      return this.http.get<EquipmentAssignment[]>(`${this.apiUrl}/assignments`);
      
    }
  
}
