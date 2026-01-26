import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Employee } from '../../domain/Entities/employee/employee.model';



@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5271/api/Employees';
  
  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  
  getEmployeesByBase(base: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/base/${base}`);
  }


  getAvailableEmployees(startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/available?startDate=${startDate}&endDate=${endDate}`);
  }
}