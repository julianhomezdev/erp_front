import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/development.environment';
import { Location as ProjectLocation } from '../../domain/Entities/location/location.model'; // ✅ IMPORTAR EL MODELO


@Injectable({

  providedIn: 'root'

})
export class LocationService {

  private readonly apiUrl = `${environment.apiUrl}/location`;

  constructor(private http: HttpClient) {}


  getAllLocations(): Observable<ProjectLocation[]> {
    return this.http.get<ProjectLocation[]>(this.apiUrl);
  }


 
}