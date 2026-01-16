import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coordinator } from '../../domain/Entities/coordinator/coordinator.model';
import { environment } from '../../environments/development.environment';

@Injectable({

  providedIn: 'root'

})
export class ProjectCoordinatorService {

  private readonly apiUrl = `${environment.apiUrl}/ProjectCoordinator`;

  constructor(private http: HttpClient) {}

  
  getAllCoordinators(): Observable<Coordinator[]> {
    return this.http.get<Coordinator[]>(this.apiUrl);
  }

  
}