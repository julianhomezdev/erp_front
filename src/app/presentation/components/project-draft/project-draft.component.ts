import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ProjectDraftService } from "../../../core/services/project-draft.service";
import { Router } from "@angular/router";

@Component({
    
    selector: 'project-draft-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './project-draft.component.html'
    
    
})

export class ProjectDraftComponent implements OnInit {
    
    private draftService = inject(ProjectDraftService);
    
    private router = inject(Router);
    
    
    drafts: any[] = [];
    
    loading = true;
    
    ngOnInit(): void {
        
        this.loadDrafts();
        
    }
    
    openDraft(draftId: number): void {
        
        this.router.navigate(['/planner'], {
            
            queryParams: { draftId }
            
        });
        
    }
    
    
    deleteDraft(draftId: number): void {
    if (!confirm('¿Eliminar este borrador?')) return;
    
    this.draftService.deleteDraft(draftId).subscribe({
        next: () => {
        this.drafts = this.drafts.filter(d => d.Id !== draftId);
        }
    });
    }
    
    loadDrafts(): void {
        
        this.draftService.getDrafts().subscribe({
            
            next: (data) => {
                
                
                this.drafts = data;
                this.loading = false;
                
            },
            
            error: () => this.loading = false
            
        });
        
    }
    
    
    
    
    
}