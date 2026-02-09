import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';
import { ProjectEditComponent } from '../project-edit/project-edit.component';

@Component({
  selector: 'project-dashboard-component',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProjectEditComponent],
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css']
})
export class ProjectDashboardComponent implements OnInit {
  
  private projectService = inject(ProjectService);
  private router = inject(Router);
  
  projects: any[] = [];
  filteredProjects: any[] = [];
  loading = true;
  selectedProject: any = null;
  filterStartDate: string = '';
  filterEndDate: string = '';

  showResourceEditModal = false;
  selectedPlanForEdit: any = null;
  
  ngOnInit(): void {
    this.loadProjects();
  }

  editResources(planId: number): void {
    const plan = this.findPlanById(planId);
    if (plan) {
      this.selectedPlanForEdit = plan;
      this.showResourceEditModal = true;
    }
  }

  assignDetailedResources(planId: number): void {
    const plan = this.findPlanById(planId);
    if (plan) {
      this.selectedPlanForEdit = {
        ...plan,
        resourceMode: 'DETAILED' 
      };
      this.showResourceEditModal = true;
    }
  }
  
  private findPlanById(planId: number): any {
    if (!this.selectedProject?.serviceOrders) return null;
    
    for (const ods of this.selectedProject.serviceOrders) {
      for (const plan of ods.samplingPlans) {
        if (plan.id === planId) {
          return plan;
        }
      }
    }
    return null;
  }

  closeResourceEditModal(): void {
    this.showResourceEditModal = false;
    this.selectedPlanForEdit = null;
  }

  onResourcesSaved(): void {
    this.closeResourceEditModal();
    // Recargar los detalles del proyecto
    if (this.selectedProject?.id) {
      this.viewProject(this.selectedProject.id);
    }
  }

  loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.filteredProjects = [...data];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando proyectos:', error);
        this.loading = false;
      }
    });
  }
  
  applyDateFilters(): void {
    if (!this.filterStartDate && !this.filterEndDate) {
      this.filteredProjects = [...this.projects];
      return;
    }

    this.filteredProjects = this.projects.filter(project => {
      const projectStartDate = project.initialDate ? new Date(project.initialDate) : null;
      const projectEndDate = project.finalDate ? new Date(project.finalDate) : null;
      const filterStart = this.filterStartDate ? new Date(this.filterStartDate) : null;
      const filterEnd = this.filterEndDate ? new Date(this.filterEndDate) : null;

      if (filterStart && projectEndDate && projectEndDate < filterStart) {
        return false;
      }
      if (filterEnd && projectStartDate && projectStartDate > filterEnd) {
        return false;
      }
      return true;
    });
  }
  
  clearFilters(): void {
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filteredProjects = [...this.projects];
  }
  
  exportToExcel(): void {
    if (this.filteredProjects.length === 0) {
      alert('No hay proyectos para exportar');
      return;
    }

    this.loading = true;
    
    const projectDetailPromises = this.filteredProjects.map(project => 
      this.projectService.getProjectById(project.id).toPromise()
    );

    Promise.all(projectDetailPromises).then(detailedProjects => {
      const excelData = this.prepareExcelData(detailedProjects);
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      const columnWidths = [
        { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
        { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');
      
      const fileName = `Proyectos_${this.getExportFileName()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      this.loading = false;
    }).catch(error => {
      console.error('Error cargando detalles para exportar:', error);
      alert('Error al cargar los detalles de los proyectos');
      this.loading = false;
    });
  }
  
  private prepareExcelData(detailedProjects: any[]): any[] {
    const data: any[] = [];

    detailedProjects.forEach(project => {
      if (!project.serviceOrders || project.serviceOrders.length === 0) {
        data.push(this.createProjectRow(project, null, null));
        return;
      }

      project.serviceOrders.forEach((ods: any) => {
        if (!ods.samplingPlans || ods.samplingPlans.length === 0) {
          data.push(this.createProjectRow(project, ods, null));
          return;
        }

        ods.samplingPlans.forEach((plan: any) => {
          data.push(this.createProjectRow(project, ods, plan));
        });
      });
    });

    return data;
  }
  
  private createProjectRow(project: any, ods: any | null, plan: any | null): any {
    const row: any = {
      'Proyecto': project.projectName || 'Sin nombre',
      'Código Contrato': project.contract?.contractCode || '',
      'Cliente': project.client?.name || '',
      'Coordinador': project.coordinator?.name || '',
      'Fecha Inicio Proyecto': project.initialDate || '',
      'Fecha Fin Proyecto': project.finalDate || '',
    };

    if (ods) {
      row['Código ODS'] = ods.odsCode || '';
      row['Nombre ODS'] = ods.odsName || '';
      row['Fecha Inicio ODS'] = ods.startDate || '';
      row['Fecha Fin ODS'] = ods.endDate || '';
    } else {
      row['Código ODS'] = '';
      row['Nombre ODS'] = '';
      row['Fecha Inicio ODS'] = '';
      row['Fecha Fin ODS'] = '';
    }

    if (plan) {
      row['Código Plan'] = plan.planCode || '';
      row['Fecha Inicio Plan'] = plan.startDate || '';
      row['Fecha Fin Plan'] = plan.endDate || '';
      
      row['Sitios'] = plan.sites?.map((s: any) => 
        `${s.name} (${s.matrixName})`
      ).join('; ') || '';
      
      row['Personal'] = plan.resources?.employees?.map((e: any) => {
        const lastName = e.lastName || '';
        return `${e.firstName} ${lastName}`.trim();
      }).join(', ') || '';
      
      row['Equipos'] = plan.resources?.equipment?.map((e: any) => 
        `${e.name} (${e.code})`
      ).join(', ') || '';
      
      row['Vehículos'] = plan.resources?.vehicles?.map((v: any) => 
        v.plateNumber
      ).join(', ') || '';
      
      const budget = plan.budget || {};
      row['Costo Transporte'] = budget.transportCostChemilab || 0;
      row['Facturado Transporte'] = budget.transportBilledToClient || 0;
      row['Costo Logística'] = budget.logisticsCostChemilab || 0;
      row['Facturado Logística'] = budget.logisticsBilledToClient || 0;
      row['Costo Subcontratación'] = budget.subcontractingCostChemilab || 0;
      row['Facturado Subcontratación'] = budget.subcontractingBilledToClient || 0;
      row['Costo Transporte Fluvial'] = budget.fluvialTransportCostChemilab || 0;
      row['Facturado Transporte Fluvial'] = budget.fluvialTransportBilledToClient || 0;
      row['Costo Informes'] = budget.reportsCostChemilab || 0;
      row['Facturado Informes'] = budget.reportsBilledToClient || 0;
      row['Costo Total'] = budget.totalCost || 0;
      row['Total Facturado'] = budget.totalBilled || 0;
      row['Utilidad'] = budget.totalProfit || 0;
      row['Margen %'] = this.calculateMargin(budget);
      row['Notas Presupuesto'] = budget.notes || '';
    } else {
      row['Código Plan'] = '';
      row['Fecha Inicio Plan'] = '';
      row['Fecha Fin Plan'] = '';
      row['Sitios'] = '';
      row['Personal'] = '';
      row['Equipos'] = '';
      row['Vehículos'] = '';
      row['Costo Transporte'] = 0;
      row['Facturado Transporte'] = 0;
      row['Costo Logística'] = 0;
      row['Facturado Logística'] = 0;
      row['Costo Subcontratación'] = 0;
      row['Facturado Subcontratación'] = 0;
      row['Costo Transporte Fluvial'] = 0;
      row['Facturado Transporte Fluvial'] = 0;
      row['Costo Informes'] = 0;
      row['Facturado Informes'] = 0;
      row['Costo Total'] = 0;
      row['Total Facturado'] = 0;
      row['Utilidad'] = 0;
      row['Margen %'] = 0;
      row['Notas Presupuesto'] = '';
    }

    return row;
  }
  
  private getExportFileName(): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    if (this.filterStartDate && this.filterEndDate) {
      return `${this.filterStartDate}_a_${this.filterEndDate}`;
    } else if (this.filterStartDate) {
      return `desde_${this.filterStartDate}`;
    } else if (this.filterEndDate) {
      return `hasta_${this.filterEndDate}`;
    }
    
    return dateStr;
  }
  
  calculateMargin(budget: any): number {
    if (!budget || !budget.totalBilled || budget.totalBilled === 0) {
      return 0;
    }
    const totalProfit = budget.totalProfit || 0;
    const totalBilled = budget.totalBilled;
    return (totalProfit / totalBilled) * 100;
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
        this.filteredProjects = this.filteredProjects.filter(p => p.id !== projectId);
      },
      error: (error) => {
        console.error('Error eliminando proyecto:', error);
      }
    });
  }
  
  createNewProject(): void {
    this.router.navigate(['/planner']);
  }

  getEmployeeNames(employees: any[]): string {
    return employees.map(e => {
      const lastName = e.lastName || '';
      return `${e.firstName} ${lastName}`.trim();
    }).join(', ');
  }

  getEquipmentNames(equipment: any[]): string {
    return equipment.map(e => `${e.name} (${e.code})`).join(', ');
  }

  getVehiclePlates(vehicles: any[]): string {
    return vehicles.map(v => v.plateNumber).join(', ');
  }
}