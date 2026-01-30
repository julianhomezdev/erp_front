import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import * as XLSX from 'xlsx';
import { FormsModule } from '@angular/forms';


@Component({
  
  selector: 'project-dashboard-component',
  
  standalone: true,
  
  imports: [CommonModule, RouterModule, FormsModule],
  
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
  
  
  // Date filters
  filterStartDate: string = '';
  filterEndDate: string = '';
  
  ngOnInit(): void {
    this.loadProjects();
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

    const excelData = this.prepareExcelData();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    const columnWidths = [
      { wch: 20 }, // Proyecto
      { wch: 15 }, // Código Contrato
      { wch: 25 }, // Cliente
      { wch: 25 }, // Coordinador
      { wch: 12 }, // Fecha Inicio
      { wch: 12 }, // Fecha Fin
      { wch: 15 }, // Código ODS
      { wch: 20 }, // Nombre ODS
      { wch: 12 }, // ODS Inicio
      { wch: 12 }, // ODS Fin
      { wch: 15 }, // Código Plan
      { wch: 12 }, // Plan Inicio
      { wch: 12 }, // Plan Fin
      { wch: 30 }, // Sitios
      { wch: 30 }, // Personal
      { wch: 30 }, // Equipos
      { wch: 30 }, // Vehículos
      { wch: 15 }, // Costo Transporte
      { wch: 15 }, // Facturado Transporte
      { wch: 15 }, // Costo Logística
      { wch: 15 }, // Facturado Logística
      { wch: 15 }, // Costo Subcontratación
      { wch: 15 }, // Facturado Subcontratación
      { wch: 15 }, // Costo T. Fluvial
      { wch: 15 }, // Facturado T. Fluvial
      { wch: 15 }, // Costo Informes
      { wch: 15 }, // Facturado Informes
      { wch: 15 }, // Costo Total
      { wch: 15 }, // Total Facturado
      { wch: 15 }, // Utilidad
      { wch: 10 }, // Margen %
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');
    
    const fileName = `Proyectos_${this.getExportFileName()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    
    
  }
  
   private prepareExcelData(): any[] {
    const data: any[] = [];

    this.filteredProjects.forEach(project => {
      // Si el proyecto no tiene ODS ni planes, crear una fila básica
      if (!project.serviceOrders || project.serviceOrders.length === 0) {
        data.push(this.createProjectRow(project, null, null));
        return;
      }

      project.serviceOrders.forEach((ods: any) => {
        // Si la ODS no tiene planes, crear una fila con ODS pero sin plan
        if (!ods.samplingPlans || ods.samplingPlans.length === 0) {
          data.push(this.createProjectRow(project, ods, null));
          return;
        }

        // Crear una fila por cada plan
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

    // Datos de ODS
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

    // Datos del Plan
    if (plan) {
      row['Código Plan'] = plan.planCode || '';
      row['Fecha Inicio Plan'] = plan.startDate || '';
      row['Fecha Fin Plan'] = plan.endDate || '';
      
      // Sitios
      row['Sitios'] = plan.sites?.map((s: any) => 
        `${s.name} (${s.matrixName})`
      ).join('; ') || '';
      
      // Recursos
      row['Personal'] = plan.resources?.employees?.map((e: any) => 
        `${e.firstName} `
      ).join(', ') || '';
      
      row['Equipos'] = plan.resources?.equipment?.map((e: any) => 
        `${e.name} (${e.code})`
      ).join(', ') || '';
      
      row['Vehículos'] = plan.resources?.vehicles?.map((v: any) => 
        v.plateNumber
      ).join(', ') || '';
      
      // Presupuesto detallado
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
  
  
  calculateMargin(budget: any) : number {
    
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