import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'project-dashboard-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css']
})
export class ProjectDashboardComponent implements OnInit {
  
  private projectService = inject(ProjectService);
  private router = inject(Router);
  
  projects: any[] = [];
  loading = true;
  selectedProject: any = null;
  
  ngOnInit(): void {
    this.loadProjects();
  }
  
  loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando proyectos:', error);
        this.loading = false;
      }
    });
  }
  
  viewProject(projectId: number): void {
    this.projectService.getProjectById(projectId).subscribe({
      next: (data) => {
        this.selectedProject = data;
      },
      error: (error) => {
        console.error('Error cargando detalles:', error);
      }
    });
  }
  
  closeModal(): void {
    this.selectedProject = null;
  }
  
  editProject(projectId: number): void {
    this.router.navigate(['/projects', projectId, 'edit']);
  }
  
  deleteProject(projectId: number): void {
    if (!confirm('¿Está seguro de eliminar este proyecto?')) return;
    
    this.projectService.deleteProject(projectId).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== projectId);
      },
      error: (error) => {
        console.error('Error eliminando proyecto:', error);
      }
    });
  }
  
  createNewProject(): void {
    this.router.navigate(['/planner']);
  }

  // ← AGREGAR ESTOS 3 MÉTODOS
  getEmployeeNames(employees: any[]): string {
    return employees.map(e => `${e.firstName} ${e.lastName}`).join(', ');
  }

  getEquipmentNames(equipment: any[]): string {
  return equipment.map(e => `${e.name} (${e.code})`).join(', ');
}

  getVehiclePlates(vehicles: any[]): string {
    return vehicles.map(v => v.plateNumber).join(', ');
  }
}