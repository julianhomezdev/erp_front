import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root'})

export class ConfigService {
    
    
    config!: any;
    
    
    loadConfig() {
        
        return fetch('/assets/config/config.json')
        
            .then(res => res.json())
        
            .then(data => this.config = data);
 
    }
    
    
    get apiUrl() {
        
        return this.config.backUrl
        
    }
    
    
    
}