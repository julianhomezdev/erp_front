import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/development.environment';
import { Client } from '../../domain/Entities/client/client.model';

@Injectable({

  providedIn: 'root'

})
export class ClientService {

  private readonly apiUrl = `${environment.apiUrl}/Client`;

  constructor(private http: HttpClient) {}


  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }


  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }
}