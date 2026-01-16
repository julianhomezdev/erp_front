import { CommonModule } from '@angular/common';
import { Component,  OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Employee } from '../../../domain/Entities/employee/employee.model';
import { Vehicle } from '../../../domain/Entities/vehicle/vehicle.model';
import { ProjectCreationResult } from '../../../domain/Entities/project/project-creation.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ProjectCreationService } from '../../../core/services/project-creation.service';
import { ClientService } from '../../../core/services/client.service';
import { Equipment } from '../../../domain/Entities/Equipment/equipment.model';
import { Client } from '../../../domain/Entities/client/client.model';
import { ProjectCoordinatorService } from '../../../core/services/project-coordinator.service';
import { Coordinator } from '../../../domain/Entities/coordinator/coordinator.model';
import { Location as ProjectLocation } from '../../../domain/Entities/location/location.model';
import { LocationService } from '../../../core/services/location.service';


interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-project-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './project-wizard.component.html',
  styleUrls: ['./project-wizard.component.css']
})
export class ProjectWizardComponent implements OnInit {
  
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private equipmentService = inject(EquipmentService);
  private vehicleService = inject(VehicleService);
  private clientService =  inject(ClientService);
  private projectCoordService = inject(ProjectCoordinatorService);
  private locationService = inject(LocationService);
  private projectCreationService = inject(ProjectCreationService);
  
  
  currentStep = 1;
  loading = false;
  successMessage = '';
  errorMessage = '';
  showFinalDashboard = false;
  projectResult: ProjectCreationResult | null = null;
  
  contractForm!: FormGroup;
  coordinatorForm!: FormGroup;
  projectForm!: FormGroup;
  resourcesForm!: FormGroup;
  budgetForm!: FormGroup;
  

  locations: ProjectLocation[] = [];
  projectCoordinators: Coordinator[] = [];
  clients: Client[] = [];
  employees: Employee[] = [];
  selectedEmployees: Employee[] = [];
  employeeSearchTerm = '';

  equipment: Equipment[] = [];
  selectedEquipment: Equipment[] = [];
  equipmentSearchTerm = '';

  vehicles: Vehicle[] = [];
  selectedVehicles: Vehicle[] = [];
  vehicleSearchTerm = '';
  
  steps: WizardStep[] = [
    { id: 1, title: 'Contrato', description: 'Información del contrato base', icon: '📄' },
    { id: 2, title: 'Coordinador', description: 'Asignación por zona y volumen', icon: '👥' },
    { id: 3, title: 'Proyecto', description: 'Detalles del proyecto', icon: '📋' },
    { id: 4, title: 'Recursos', description: 'Personal, equipos y vehículos', icon: '🔧' },
    { id: 5, title: 'Presupuesto', description: 'Estimación de costos', icon: '💰' }
  ];
  

  
  
  ngOnInit(): void {
    this.initializeForms();
    this.loadData();
    this.setupLocationListener();
  }
  
  initializeForms(): void {
    this.contractForm = this.fb.group({
      contractCode: ['', Validators.required],
      contractName: ['', Validators.required],
      clientId: ['', Validators.required],
      contractValue: ['', [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
    
    this.coordinatorForm = this.fb.group({
      coordinatorId: ['', Validators.required],
      locationId: ['', Validators.required],
      volume: ['', [Validators.required, Validators.min(1)]]
    });
    
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      projectDescription: ['', Validators.required],
      estimatedDuration: ['', [Validators.required, Validators.min(1)]],
      priority: ['media', Validators.required]
    });
    
    this.resourcesForm = this.fb.group({
      locationId: ['', Validators.required],
      selectedEmployeeIds: [[]],
      selectedEquipmentIds: [[]],
      selectedVehicleIds: [[]]
    });
    
    this.budgetForm = this.fb.group({
      personalCost: [0, [Validators.required, Validators.min(0)]],
      equipmentCost: [0, [Validators.required, Validators.min(0)]],
      transportCost: [0, [Validators.required, Validators.min(0)]],
      materialsCost: [0, [Validators.required, Validators.min(0)]],
      otherCosts: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }
  
  loadData(): void {

    this.locationService.getAllLocations().subscribe({
    next: (locations) => {
      this.locations = locations;
     
    },
    error: (error) => {
      this.errorMessage = 'Error al cargar ubicaciones';
    }
  });


    this.projectCoordService.getAllCoordinators().subscribe({

      next: (projectCoordinators) => this.projectCoordinators = projectCoordinators,

      error: (error) => {
        console.error('Error cargando coordinadores:', error);
        this.errorMessage = 'Error al cargar coordinadores';
      }


    })


    this.employeeService.getAllEmployees().subscribe({
      next: (employees) => this.employees = employees,
      error: (error) => {
        console.error('Error cargando empleados:', error);
        this.errorMessage = 'Error al cargar empleados';
      }

    });

    this.clientService.getAllClients().subscribe({
          next: (clients) => this.clients = clients,
          error: (error) => {
            console.error('Error cargando clientes:', error);
            this.errorMessage = 'Error al cargar clientes';
          }
        });


    this.equipmentService.getAllEquipment().subscribe({
      next: (equipment) => this.equipment = equipment,
      error: (error) => {
        console.error('Error cargando equipos:', error);
        this.errorMessage = 'Error al cargar equipos';
      }
    });

    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles) => this.vehicles = vehicles,
      error: (error) => {
        console.error('Error cargando vehículos:', error);
        this.errorMessage = 'Error al cargar vehículos';
      }
    });
  }

  setupLocationListener(): void {
    this.resourcesForm.get('locationId')?.valueChanges.subscribe(() => {
      this.selectedEmployees = [];
      this.selectedEquipment = [];
      this.selectedVehicles = [];
      this.resourcesForm.patchValue({
        selectedEmployeeIds: [],
        selectedEquipmentIds: [],
        selectedVehicleIds: []
      });
    });
  }

  getClientName(): string {

    const clientId = this.contractForm.value.clientId;
    const client = this.clients.find(c => c.id === Number(clientId));
    return client?.name || 'No asignado';

  }
  
  get filteredEmployees(): Employee[] {
    const selectedLocationId = this.resourcesForm.get('locationId')?.value;
    
    let filtered = this.employees;
    
    if (selectedLocationId) {
      const selectedLocation = this.locations.find(loc => loc.id === Number(selectedLocationId));
      if (selectedLocation) {
        filtered = filtered.filter(emp => emp.base === selectedLocation.locationName);
      }
    }
    
    if (this.employeeSearchTerm) {
      const term = this.employeeSearchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(term) ||
        emp.lastName.toLowerCase().includes(term) ||
        emp.position.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  get filteredEquipment(): Equipment[] {
    if (!this.equipmentSearchTerm) return this.equipment;
    const term = this.equipmentSearchTerm.toLowerCase();
    return this.equipment.filter(eq => 
      eq.name.toLowerCase().includes(term) ||
      eq.code.toLowerCase().includes(term) ||
      eq.description.toLowerCase().includes(term)
    );
  }

  get filteredVehicles(): Vehicle[] {
    if (!this.vehicleSearchTerm) return this.vehicles;
    const term = this.vehicleSearchTerm.toLowerCase();
    return this.vehicles.filter(v => 
      v.plateNumber.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term)
    );
  }
  
  toggleEmployeeSelection(employee: Employee): void {
    const index = this.selectedEmployees.findIndex(e => e.id === employee.id);
    if (index === -1) {
      this.selectedEmployees.push(employee);
    } else {
      this.selectedEmployees.splice(index, 1);
    }
    this.resourcesForm.patchValue({
      selectedEmployeeIds: this.selectedEmployees.map(e => e.id)
    });
  }
  
  isEmployeeSelected(employee: Employee): boolean {
    return this.selectedEmployees.some(e => e.id === employee.id);
  }
  
  removeEmployee(employee: Employee): void {
    this.selectedEmployees = this.selectedEmployees.filter(e => e.id !== employee.id);
    this.resourcesForm.patchValue({
      selectedEmployeeIds: this.selectedEmployees.map(e => e.id)
    });
  }

  toggleEquipmentSelection(equip: Equipment): void {
    const index = this.selectedEquipment.findIndex(e => e.id === equip.id);
    if (index === -1) {
      this.selectedEquipment.push(equip);
    } else {
      this.selectedEquipment.splice(index, 1);
    }
    this.resourcesForm.patchValue({
      selectedEquipmentIds: this.selectedEquipment.map(e => e.id)
    });
  }
  
  isEquipmentSelected(equip: Equipment): boolean {
    return this.selectedEquipment.some(e => e.id === equip.id);
  }
  
  removeEquipment(equip: Equipment): void {
    this.selectedEquipment = this.selectedEquipment.filter(e => e.id !== equip.id);
    this.resourcesForm.patchValue({
      selectedEquipmentIds: this.selectedEquipment.map(e => e.id)
    });
  }

  toggleVehicleSelection(vehicle: Vehicle): void {
    const index = this.selectedVehicles.findIndex(v => v.id === vehicle.id);
    if (index === -1) {
      this.selectedVehicles.push(vehicle);
    } else {
      this.selectedVehicles.splice(index, 1);
    }
    this.resourcesForm.patchValue({
      selectedVehicleIds: this.selectedVehicles.map(v => v.id)
    });
  }
  
  isVehicleSelected(vehicle: Vehicle): boolean {
    return this.selectedVehicles.some(v => v.id === vehicle.id);
  }
  
  removeVehicle(vehicle: Vehicle): void {
    this.selectedVehicles = this.selectedVehicles.filter(v => v.id !== vehicle.id);
    this.resourcesForm.patchValue({
      selectedVehicleIds: this.selectedVehicles.map(v => v.id)
    });
  }
  
  getTotalBudget(): number {
    const values = this.budgetForm.value;
    return (values.personalCost || 0) + 
           (values.equipmentCost || 0) + 
           (values.transportCost || 0) + 
           (values.materialsCost || 0) + 
           (values.otherCosts || 0);
  }
  
  getCurrentForm(): FormGroup {
    switch (this.currentStep) {
      case 1: return this.contractForm;
      case 2: return this.coordinatorForm;
      case 3: return this.projectForm;
      case 4: return this.resourcesForm;
      case 5: return this.budgetForm;
      default: return this.contractForm;
    }
  }
  
  isStepValid(): boolean {
    return this.getCurrentForm().valid;
  }
  
  nextStep(): void {
    if (this.isStepValid() && this.currentStep < 5) {
      this.currentStep++;
    }
  }
  
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  submitProject(): void {
  if (!this.budgetForm.valid) {
    this.errorMessage = 'Por favor complete todos los campos del presupuesto';
    return;
  }
  
  this.loading = true;
  this.errorMessage = '';
  
  const selectedLocation = this.locations.find(loc => loc.id === Number(this.resourcesForm.value.locationId));
  const coordinatorLocation = this.locations.find(loc => loc.id === Number(this.coordinatorForm.value.locationId));
  const selectedClient = this.clients.find(c => c.id === Number(this.contractForm.value.clientId));
  
  const projectData = {
    contract: {
      contractCode: this.contractForm.value.contractCode,
      contractName: this.contractForm.value.contractName,
      clientName: selectedClient?.name || 'Cliente no especificado',
      contractValue: this.contractForm.value.contractValue,
      startDate: this.contractForm.value.startDate,
      endDate: this.contractForm.value.endDate
    },
    coordinator: {
      coordinatorId: this.coordinatorForm.value.coordinatorId,
      zone: coordinatorLocation?.locationName || 'Zona no especificada',
      volume: this.coordinatorForm.value.volume
    },
    projectDetails: {
      projectName: this.projectForm.value.projectName,
      projectDescription: this.projectForm.value.projectDescription,
      estimatedDuration: this.projectForm.value.estimatedDuration,
      priority: this.projectForm.value.priority
    },
    resources: {
      base: selectedLocation?.locationName || 'Base no especificada',
      selectedEmployeeIds: this.resourcesForm.value.selectedEmployeeIds,
      selectedEquipmentIds: this.resourcesForm.value.selectedEquipmentIds,
      selectedVehicleIds: this.resourcesForm.value.selectedVehicleIds
    },
    budget: {
      personalCost: this.budgetForm.value.personalCost,
      equipmentCost: this.budgetForm.value.equipmentCost,
      transportCost: this.budgetForm.value.transportCost,
      materialsCost: this.budgetForm.value.materialsCost,
      otherCosts: this.budgetForm.value.otherCosts,
      notes: this.budgetForm.value.notes || ''
    }
  };
  
  this.projectCreationService.createCompleteProject(projectData).subscribe({
    next: (result) => {
      this.projectResult = result;
      this.loading = false;
      this.showFinalDashboard = true;
    },
    error: (error) => {
      this.errorMessage = 'Error al crear el proyecto. Por favor intente nuevamente.';
      console.error('Error:', error);
      this.loading = false;
    }
  });
}
  
  getCoordinatorName(): string {
    const coordinatorId = this.coordinatorForm.value.coordinatorId;
    const coordinator = this.projectCoordinators.find(c => c.id === Number(coordinatorId));
    return coordinator?.name || 'No asignado';
  }
  
  resetWizard(): void {
    this.currentStep = 1;
    this.contractForm.reset();
    this.coordinatorForm.reset();
    this.projectForm.reset();
    this.resourcesForm.reset();
    this.budgetForm.reset();
    this.selectedEmployees = [];
    this.selectedEquipment = [];
    this.selectedVehicles = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.showFinalDashboard = false;
    this.projectResult = null;
  }
  
  createAnotherProject(): void {
    this.resetWizard();
  }
  
  goToDashboard(): void {
    this.router.navigate(['/projects']);
  }
}