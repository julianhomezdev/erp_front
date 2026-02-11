import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectCreationService } from '../../../core/services/project-creation.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { VehicleService } from '../../../core/services/vehicle.service';

@Component({
  selector: 'project-edit-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-edit.component.html'
})
export class ProjectEditComponent implements OnInit {
  @Input() planId!: number;
  @Input() projectId!: number;
  @Output() saved = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  private projectService = inject(ProjectService);
  private creationService = inject(ProjectCreationService);
  private employeeService = inject(EmployeeService);
  private equipmentService = inject(EquipmentService);
  private vehicleService = inject(VehicleService);

  plan: any = null;
  loading = false;
  
  // Datos para formulario
  resourceMode: 'QUANTITY' | 'DETAILED' = 'QUANTITY';
  startDate: string = '';
  endDate: string = '';
  
  // Modo QUANTITY
  employeeCategories: string[] = [];
  equipmentCategories: string[] = [];
  employeeQuantities: { categoryName: string; quantity: number }[] = [];
  equipmentQuantities: { categoryName: string; quantity: number }[] = [];
  vehicleQuantity: number = 0;
  
  // Modo DETAILED
  availableEmployees: any[] = [];
  availableEquipment: any[] = [];
  availableVehicles: any[] = [];
  selectedEmployeeIds: number[] = [];
  selectedEquipmentIds: number[] = [];
  selectedVehicleIds: number[] = [];

  ngOnInit(): void {
    this.loadPlanData();
    this.loadAvailableResources();
  }

  loadPlanData(): void {
    this.loading = true;
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        // Buscar el plan específico
        const plan = project.serviceOrders
          .flatMap((ods: any) => ods.samplingPlans)
          .find((p: any) => p.id === this.planId);
        
        if (plan) {
          this.plan = plan;
          this.resourceMode = plan.resourceMode || 'QUANTITY';
          this.startDate = plan.resourceStartDate || '';
          this.endDate = plan.resourceEndDate || '';
          
          if (plan.resourceMode === 'QUANTITY') {
            this.employeeQuantities = plan.employeeQuantities || [];
            this.equipmentQuantities = plan.equipmentQuantities || [];
            this.vehicleQuantity = plan.vehicleQuantity || 0;
          } else {
            this.selectedEmployeeIds = plan.resources?.employees?.map((e: any) => e.id) || [];
            this.selectedEquipmentIds = plan.resources?.equipment?.map((e: any) => e.id) || [];
            this.selectedVehicleIds = plan.resources?.vehicles?.map((v: any) => v.id) || [];
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando plan:', error);
        this.loading = false;
      }
    });
  }

  loadAvailableResources(): void {
    if (!this.startDate || !this.endDate) return;
    
    // Cargar empleados disponibles
    this.employeeService.getAvailableEmployees(this.startDate, this.endDate).subscribe({
      next: (employees) => {
        this.availableEmployees = employees;
        // Cargar categorías
        this.employeeCategories = [...new Set(employees.map((e: any) => e.position))];
      }
    });

    // Cargar equipos disponibles
    this.equipmentService.getAvailableEquipment(this.startDate, this.endDate).subscribe({
      next: (equipment) => {
        this.availableEquipment = equipment;
        this.equipmentCategories = [...new Set(equipment.map((e: any) => e.name))];
      }
    });

    // Cargar vehículos disponibles
    this.vehicleService.getAvailableVehicles(this.startDate, this.endDate).subscribe({
      next: (vehicles) => {
        this.availableVehicles = vehicles;
      }
    });
  }

  addEmployeeQuantity(): void {
    this.employeeQuantities.push({ categoryName: '', quantity: 1 });
  }

  removeEmployeeQuantity(index: number): void {
    this.employeeQuantities.splice(index, 1);
  }

  addEquipmentQuantity(): void {
    this.equipmentQuantities.push({ categoryName: '', quantity: 1 });
  }

  removeEquipmentQuantity(index: number): void {
    this.equipmentQuantities.splice(index, 1);
  }

  saveResources(): void {
    this.loading = true;
    
    const resourcesData: any = {
      mode: this.resourceMode,
      startDate: this.startDate,
      endDate: this.endDate
    };

    if (this.resourceMode === 'QUANTITY') {
      resourcesData.employeeQuantities = this.employeeQuantities.filter(eq => eq.categoryName && eq.quantity > 0);
      resourcesData.equipmentQuantities = this.equipmentQuantities.filter(eq => eq.categoryName && eq.quantity > 0);
      resourcesData.vehicleQuantity = this.vehicleQuantity;
    } else {
      resourcesData.employeeIds = this.selectedEmployeeIds;
      resourcesData.equipmentIds = this.selectedEquipmentIds;
      resourcesData.vehicleIds = this.selectedVehicleIds;
    }

    this.creationService.updatePlanResources(this.planId, resourcesData).subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
        alert('Recursos actualizados exitosamente');
      },
      error: (error) => {
        console.error('Error actualizando recursos:', error);
        this.loading = false;
        alert('Error al actualizar recursos');
      }
    });
  }

  toggleEmployeeSelection(employeeId: number): void {
    const index = this.selectedEmployeeIds.indexOf(employeeId);
    if (index === -1) {
        this.selectedEmployeeIds.push(employeeId);
    } else {
        this.selectedEmployeeIds.splice(index, 1);
    }
    }

    toggleEquipmentSelection(equipmentId: number): void {
        const index = this.selectedEquipmentIds.indexOf(equipmentId);
        if (index === -1) {
            this.selectedEquipmentIds.push(equipmentId);
        } else {
            this.selectedEquipmentIds.splice(index, 1);
        }
        }

    toggleVehicleSelection(vehicleId: number): void {
        const index = this.selectedVehicleIds.indexOf(vehicleId);
        if (index === -1) {
            this.selectedVehicleIds.push(vehicleId);
        } else {
            this.selectedVehicleIds.splice(index, 1);
        }
    }

  cancel(): void {
    this.canceled.emit();
  }
}