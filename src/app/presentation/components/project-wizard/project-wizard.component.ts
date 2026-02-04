import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  FormArray
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

// Servicios
import { EmployeeService } from '../../../core/services/employee.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { ProjectCoordinatorService } from '../../../core/services/project-coordinator.service';
import { MatrixService } from '../../../core/services/matrix.service';
import { ProjectCreationService } from '../../../core/services/project-creation.service';
// Asumiendo que existe este servicio
import { ProjectDraftService } from '../../../core/services/project-draft.service';


// Modelos
import { Employee } from '../../../domain/Entities/employee/employee.model';
import { Vehicle } from '../../../domain/Entities/vehicle/vehicle.model';
import { Equipment } from '../../../domain/Entities/Equipment/equipment.model';
import { Client } from '../../../domain/Entities/client/client.model';
import { Coordinator } from '../../../domain/Entities/coordinator/coordinator.model';
import { Matrix } from '../../../domain/Entities/matrix/matrix.model';
import { CreateProject } from '../../../domain/Entities/project/project-creation.model';

enum ViewMode {
  CONTRACT = 'contract',
  ODS_LIST = 'ods_list',
  PLAN_FORM = 'plan_form'
}

enum BudgetCategory {
  TRANSPORT = 'TRANSPORTE',
  LOGISTICS = 'LOGÍSTICA',
  SUBCONTRACTING = 'SUBCONTRATACIÓN',
  RIVER_TRANSPORT = 'TRANSPORTE FLUVIAL',
  REPORTS = 'INFORMES'
}

interface BudgetItem {
  id: string;
  category: BudgetCategory;
  concept: string;
  provider?: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  billedPerUnit: number;
  notes?: string;
}

@Component({
  selector: 'app-project-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './project-wizard.component.html',
  styleUrls: ['./project-wizard.component.css']
})
export class ProjectWizardComponent implements OnInit, OnDestroy {

  // Inyección de servicios
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private equipmentService = inject(EquipmentService);
  private vehicleService = inject(VehicleService);
  private clientService = inject(ClientService);
  private coordinatorService = inject(ProjectCoordinatorService);
  private matrixService = inject(MatrixService);
  private projectCreationService = inject(ProjectCreationService);
  private draftService = inject(ProjectDraftService);
  private route = inject(ActivatedRoute);


  // Enums para el template
  ViewMode = ViewMode;
  BudgetCategory = BudgetCategory;

  // Estado de la vista
  currentView: ViewMode = ViewMode.CONTRACT;
  currentOdsIndex: number = -1;
  currentPlanIndex: number = -1;

  // Estado del draft
  draftId: number | null = null;
  isDraft: boolean = true;
  lastSaved: Date | null = null;
  autoSaving: boolean = false;

  // Formularios
  contractForm!: FormGroup;
  odsForm!: FormGroup;
  planForm!: FormGroup;
  coordinatorForm!: FormGroup;
  budgetItemForm!: FormGroup;

  // Datos del proyecto
  serviceOrders: any[] = [];
  assignedCoordinators: any[] = [];

  // Catálogos
  clients: Client[] = [];
  employees: Employee[] = [];
  equipment: Equipment[] = [];
  vehicles: Vehicle[] = [];
  matrices: Matrix[] = [];
  coordinators: Coordinator[] = [];

  // UI State
  loading: boolean = false;
  dataReady: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showFinalDashboard: boolean = false;
  projectResult: number | null = null;

  // Modales
  showBudgetItemModal: boolean = false;
  editingBudgetItemIndex: number = -1;

  availableEmployees: any[] = [];
  availableEquipment: any[] = [];
  availableVehicles: any[] = [];
  resourceDatesSet: boolean = false;

  // Auto-guardado
  private destroy$ = new Subject<void>();
  private autoSaveSubscription?: Subscription;
  private formChanges$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForms();
    this.loadCatalogs();
    this.setupAutoSave();
    this.checkForDraftToLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  /**
   * Inicializa todos los formularios
   */
  initializeForms(): void {
    // Formulario de contrato
    this.contractForm = this.fb.group({
      contractCode: ['', Validators.required],
      contractName: [''],
      clientId: ['', Validators.required],
      startDate: [''],
      endDate: ['']
    });

    // Formulario de ODS
    this.odsForm = this.fb.group({
      odsCode: ['', Validators.required],
      odsName: [''],
      startDate: [''],
      endDate: ['']
    });

    // Formulario de plan de muestreo
    this.planForm = this.fb.group({
      planCode: [''],
      startDate: [''],
      endDate: [''],
      
      totalSites: [1, [Validators.required, Validators.min(1)]],
      
      sites: this.fb.array([]),
      resourceStartDate: [''],
      resourceEndDate: [''],
      selectedEmployeeIds: [[], Validators.required],
      selectedEquipmentIds: [[]],
      selectedVehicleIds: [[]],
      budgetItems: [[]],
      chCode: [''],
      notes: ['']
    });

    // Formulario de coordinadores
    this.coordinatorForm = this.fb.group({
      coordinatorId: [null, Validators.required]
    });

    // Formulario de ítem de presupuesto
    this.budgetItemForm = this.fb.group({
      category: [BudgetCategory.TRANSPORT, Validators.required],
      concept: ['', Validators.required],
      provider: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['días', Validators.required],
      costPerUnit: [0, [Validators.required, Validators.min(0)]],
      billedPerUnit: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });

    // Agregar un sitio inicial
    this.addSite();

    // Suscribirse a cambios para auto-guardado
    this.contractForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formChanges$.next());

    this.planForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formChanges$.next());

    this.planForm.get('resourceStartDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadAvailableResources();
        this.updateVehicleBudgetDays();
      });

    this.planForm.get('resourceEndDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadAvailableResources();
        this.updateVehicleBudgetDays();
      });
  }

  updateVehicleBudgetDays(): void {
    const startDate = this.planForm.value.resourceStartDate;
    const endDate = this.planForm.value.resourceEndDate;

    if (!startDate || !endDate) return;

    const days = this.calculateDaysBetweenDates(startDate, endDate);
    const currentItems = [...this.budgetItems];

    currentItems.forEach(item => {
      if (item.id.startsWith('vehicle-')) {
        item.quantity = days;
      }
    });

    this.planForm.patchValue({ budgetItems: currentItems });
  }


  loadAvailableResources(): void {
  const startDate = this.planForm.value.resourceStartDate;
  const endDate = this.planForm.value.resourceEndDate;

  if (!startDate || !endDate) {
    this.availableEmployees = this.employees.map(e => ({ ...e, isAvailable: false }));
    this.availableEquipment = this.equipment.map(e => ({ ...e, isAvailable: false }));
    this.availableVehicles = this.vehicles.map(v => ({ ...v, isAvailable: false }));
    this.resourceDatesSet = false;
    return;
  }

  this.resourceDatesSet = true;
  this.loading = true;
  
  this.resourcesLoadedCount = 0;

  this.employeeService.getAvailableEmployees(startDate, endDate).subscribe({
    next: (employees) => {
      //FIX: Mantener todos los datos del empleado original
      this.availableEmployees = this.employees.map(emp => {
        const availableEmp = employees?.find(e => e.id === emp.id);
        return {
          ...emp, 
          isAvailable: availableEmp ? availableEmp.isAvailable : false
        };
      });
      this.checkAllResourcesLoaded();
    },
    error: (error) => {
      console.error('ERROR loading employees:', error);
      this.availableEmployees = this.employees.map(e => ({ ...e, isAvailable: false }));
      this.checkAllResourcesLoaded();
    }
  });

  this.equipmentService.getAvailableEquipment(startDate, endDate).subscribe({
    next: (equipment) => {
      // FIX: Mantener todos los datos del equipo original
      this.availableEquipment = this.equipment.map(eq => {
        const availableEq = equipment?.find(e => e.id === eq.id);
        return {
          ...eq, 
          isAvailable: availableEq ? availableEq.isAvailable : false
        };
      });
      this.checkAllResourcesLoaded();
    },
    error: (error) => {
      console.error('ERROR loading equipment:', error);
      this.availableEquipment = this.equipment.map(e => ({ ...e, isAvailable: false }));
      this.checkAllResourcesLoaded();
    }
  });

  // Cargar vehículos disponibles
  this.vehicleService.getAvailableVehicles(startDate, endDate).subscribe({
    next: (vehicles) => {
      // FIX: Mantener todos los datos del vehículo original
      this.availableVehicles = this.vehicles.map(veh => {
        const availableVeh = vehicles?.find(v => v.id === veh.id);
        return {
          ...veh, 
          isAvailable: availableVeh ? availableVeh.isAvailable : false
        };
      });
      this.checkAllResourcesLoaded();
    },
    error: (error) => {
      console.error('ERROR loading vehicles:', error);
      this.availableVehicles = this.vehicles.map(v => ({ ...v, isAvailable: false }));
      this.checkAllResourcesLoaded();
    }
  });
}

  private resourcesLoadedCount = 0;
  
  private checkAllResourcesLoaded(): void {
    
    this.resourcesLoadedCount++;
    
    if (this.resourcesLoadedCount >= 3) {
      
      this.loading = false;
      
      this.resourcesLoadedCount = 0;
      
      
    }
    
  }

  calculateDaysBetweenDates(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  toggleVehicleSelection(vehicleId: number): void {
    const current = this.planForm.value.selectedVehicleIds || [];
    const index = current.indexOf(vehicleId);

    if (index === -1) {
      this.planForm.patchValue({
        
        selectedVehicleIds: [...current, vehicleId]
        
      });
      
      this.addVehicleToBudget(vehicleId);
      
    } else {
      
      current.splice(index, 1);
      this.planForm.patchValue({
        selectedVehicleIds: [...current]
      });
      this.removeVehicleFromBudget(vehicleId);
    }
    this.formChanges$.next();
  }

  addVehicleToBudget(vehicleId: number): void {
    const vehicle = this.availableVehicles.find(v => v.id === vehicleId);
    const startDate = this.planForm.value.resourceStartDate;
    const endDate = this.planForm.value.resourceEndDate;

    if (!vehicle || !startDate || !endDate || !vehicle.costPerDay) {
      return;
    }

    const days = this.calculateDaysBetweenDates(startDate, endDate);
    const costPerDay = vehicle.costPerDay;

    const vehicleBudgetItem: BudgetItem = {
      id: `vehicle-${vehicleId}`,
      category: BudgetCategory.TRANSPORT,
      concept: `Vehículo ${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model}`,
      provider: vehicle.plateNumber,
      quantity: days,
      unit: 'días',
      costPerUnit: costPerDay,
      billedPerUnit: costPerDay,
      notes: 'Agregado automáticamente'
    };

    const currentItems = [...this.budgetItems];
    const existingIndex = currentItems.findIndex(item => item.id === `vehicle-${vehicleId}`);

    if (existingIndex === -1) {
      currentItems.push(vehicleBudgetItem);
      this.planForm.patchValue({ budgetItems: currentItems });
    }
  }

  removeVehicleFromBudget(vehicleId: number): void {
    const currentItems = [...this.budgetItems];
    const filteredItems = currentItems.filter(item => item.id !== `vehicle-${vehicleId}`);
    this.planForm.patchValue({ budgetItems: filteredItems });
  }

  /**
   * Carga todos los catálogos necesarios
   */
  loadCatalogs(): void {
    this.loading = true;

    Promise.all([
      this.clientService.getAllClients().toPromise(),
      this.employeeService.getAllEmployees().toPromise(),
      this.equipmentService.getAllEquipment().toPromise(),
      this.vehicleService.getAllVehicles().toPromise(),
      this.matrixService.getAllMatrix().toPromise(),
      this.coordinatorService.getAllCoordinators().toPromise()
    ]).then(([clients, employees, equipment, vehicles, matrices, coordinators]) => {
      this.clients = clients || [];
      this.employees = employees || [];
      this.equipment = equipment || [];
      this.vehicles = vehicles || [];
      this.matrices = matrices || [];
      this.coordinators = coordinators || [];
      this.dataReady = true;
      this.loading = false;
    }).catch(error => {
      console.error('Error cargando catálogos:', error);
      this.errorMessage = 'Error al cargar los datos necesarios';
      this.loading = false;
    });
  }

  /**
   * Configura el sistema de auto-guardado
   */
  setupAutoSave(): void {
    // Auto-guardar cada 30 segundos cuando hay cambios
    this.formChanges$
      .pipe(
        debounceTime(30000), // 30 segundos
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.isDraft && this.contractForm.valid) {
          //this.saveDraft(true);
        }
      });
  }

  checkForDraftToLoad(): void {
    this.route.queryParams.subscribe(params => {
      const draftId = params['draftId'];
      if (draftId) {
        this.loadDraft(Number(draftId));
      }
    });
  }
  
  generateMultipleSites(): void {
    const count = this.planForm.value.totalSites || 1;
    const baseName = this.planForm.value.planName || this.planForm.value.planCode;
    const executionDate = this.planForm.value.startDate || '';
    
    this.sitesArray.clear();
    
    
    for (let i = 0; i < count; i++) {
      const siteGroup = this.fb.group({
        name: [baseName],  
        matrixId: ['', Validators.required],
        isSubcontracted: [false],
        subcontractorName: [''],
        executionDate: [executionDate],  
        hasReport: [false],
        hasGDB: [false]
      });

      siteGroup.get('isSubcontracted')?.valueChanges
      
        .pipe(takeUntil(this.destroy$))
        
        
        .subscribe(isSubcontracted => {
          
          const subcontractorControl = siteGroup.get('subcontractorName');
          
          if (isSubcontracted) {
            
            subcontractorControl?.setValidators([Validators.required]);
            
            
          } else {
            
            subcontractorControl?.clearValidators();
            
          }
          
          subcontractorControl?.updateValueAndValidity();
        });

      this.sitesArray.push(siteGroup);
    }
    
    this.formChanges$.next();
  }
  
  
  get sitesArray(): FormArray {
    return this.planForm.get('sites') as FormArray;
  }

  addSite(): void {
    
    const baseName = this.planForm.value.planName || this.planForm.value.planCode;
    const executionDate = this.planForm.value.startDate || '';
    
    const siteGroup = this.fb.group({
      
      name: [baseName],
      
      matrixId: ['', Validators.required],
      
      isSubcontracted: [false],
      
      subcontractorName: [''],
      
      executionDate: [executionDate],
      
      hasReport: [false],
      
      hasGDB: [false]
      
    });

    // Validación condicional para subcontratación
    siteGroup.get('isSubcontracted')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSubcontracted => {
        const subcontractorControl = siteGroup.get('subcontractorName');
        if (isSubcontracted) {
          subcontractorControl?.setValidators([Validators.required]);
        } else {
          subcontractorControl?.clearValidators();
        }
        subcontractorControl?.updateValueAndValidity();
      });

    this.sitesArray.push(siteGroup);
    this.formChanges$.next();
  }

  removeSite(index: number): void {
    if (this.sitesArray.length > 1) {
      this.sitesArray.removeAt(index);
      this.formChanges$.next();
    }
  }

  // ==========================================
  // GESTIÓN DE RECURSOS
  // ==========================================

  toggleEmployeeSelection(employeeId: number): void {
    const current = this.planForm.value.selectedEmployeeIds || [];
    const index = current.indexOf(employeeId);

    if (index === -1) {
      this.planForm.patchValue({
        selectedEmployeeIds: [...current, employeeId]
      });
    } else {
      current.splice(index, 1);
      this.planForm.patchValue({
        selectedEmployeeIds: [...current]
      });
    }
    this.formChanges$.next();
  }

  isEmployeeSelected(employeeId: number): boolean {
    return (this.planForm.value.selectedEmployeeIds || []).includes(employeeId);
  }

  toggleEquipmentSelection(equipmentId: number): void {
    const current = this.planForm.value.selectedEquipmentIds || [];
    const index = current.indexOf(equipmentId);

    if (index === -1) {
      this.planForm.patchValue({
        selectedEquipmentIds: [...current, equipmentId]
      });
    } else {
      current.splice(index, 1);
      this.planForm.patchValue({
        selectedEquipmentIds: [...current]
      });
    }
    this.formChanges$.next();
  }

  isEquipmentSelected(equipmentId: number): boolean {
    return (this.planForm.value.selectedEquipmentIds || []).includes(equipmentId);
  }



  isVehicleSelected(vehicleId: number): boolean {
    return (this.planForm.value.selectedVehicleIds || []).includes(vehicleId);
  }

  // ==========================================
  // GESTIÓN DE PRESUPUESTO
  // ==========================================

  get budgetItems(): BudgetItem[] {
    return this.planForm.value.budgetItems || [];
  }

  openBudgetItemModal(): void {
    this.budgetItemForm.reset({
      category: BudgetCategory.TRANSPORT,
      quantity: 1,
      unit: 'días',
      costPerUnit: 0,
      billedPerUnit: 0
    });
    this.editingBudgetItemIndex = -1;
    this.showBudgetItemModal = true;
  }

  editBudgetItem(index: number): void {
    const item = this.budgetItems[index];
    this.budgetItemForm.patchValue(item);
    this.editingBudgetItemIndex = index;
    this.showBudgetItemModal = true;
  }

  saveBudgetItem(): void {
    if (!this.budgetItemForm.valid) {
      this.errorMessage = 'Complete todos los campos requeridos del ítem de presupuesto';
      return;
    }

    const formValue = this.budgetItemForm.value;
    const budgetItem: BudgetItem = {
      id: this.editingBudgetItemIndex === -1 ? this.generateId() : this.budgetItems[this.editingBudgetItemIndex].id,
      ...formValue
    };

    const currentItems = [...this.budgetItems];

    if (this.editingBudgetItemIndex === -1) {
      currentItems.push(budgetItem);
    } else {
      currentItems[this.editingBudgetItemIndex] = budgetItem;
    }

    this.planForm.patchValue({ budgetItems: currentItems });
    this.closeBudgetItemModal();
    this.formChanges$.next();
  }

  removeBudgetItem(index: number): void {
    const currentItems = [...this.budgetItems];
    currentItems.splice(index, 1);
    this.planForm.patchValue({ budgetItems: currentItems });
    this.formChanges$.next();
  }

  closeBudgetItemModal(): void {
    this.showBudgetItemModal = false;
    this.editingBudgetItemIndex = -1;
    this.budgetItemForm.reset();
  }

  calculateItemTotal(item: BudgetItem): { cost: number; billed: number; profit: number; margin: number } {
    const cost = item.quantity * item.costPerUnit;
    const billed = item.quantity * item.billedPerUnit;
    const profit = billed - cost;
    const margin = billed > 0 ? (profit / billed) * 100 : 0;

    return { cost, billed, profit, margin };
  }

  get planBudgetSummary() {
    const summary = {
      byCategory: new Map<BudgetCategory, any>(),
      grandTotal: { cost: 0, billed: 0, profit: 0, margin: 0 }
    };

    this.budgetItems.forEach(item => {
      const totals = this.calculateItemTotal(item);

      if (!summary.byCategory.has(item.category)) {
        summary.byCategory.set(item.category, {
          cost: 0,
          billed: 0,
          profit: 0,
          items: []
        });
      }

      const catSummary = summary.byCategory.get(item.category)!;
      catSummary.cost += totals.cost;
      catSummary.billed += totals.billed;
      catSummary.profit += totals.profit;
      catSummary.items.push(item);

      summary.grandTotal.cost += totals.cost;
      summary.grandTotal.billed += totals.billed;
      summary.grandTotal.profit += totals.profit;
    });

    if (summary.grandTotal.billed > 0) {
      summary.grandTotal.margin = (summary.grandTotal.profit / summary.grandTotal.billed) * 100;
    }

    return summary;
  }

  // ==========================================
  // GESTIÓN DE ODS
  // ==========================================

  addServiceOrder(): void {
    if (!this.odsForm.valid) {
      this.errorMessage = 'Ingrese al menos el código de la ODS';
      return;
    }

    const ods = {
      odsCode: this.odsForm.value.odsCode,
      odsName: this.odsForm.value.odsName || this.odsForm.value.odsCode,
      startDate: this.odsForm.value.startDate,
      endDate: this.odsForm.value.endDate,
      samplingPlans: []
    };

    this.serviceOrders.push(ods);
    this.odsForm.reset();
    this.errorMessage = '';
    this.formChanges$.next();
  }

  removeServiceOrder(index: number): void {
    this.serviceOrders.splice(index, 1);
    this.formChanges$.next();
  }

  selectOdsForPlans(index: number): void {
    this.currentOdsIndex = index;
    this.currentView = ViewMode.PLAN_FORM;
  }

  backToOdsList(): void {
    this.currentView = ViewMode.ODS_LIST;
    this.currentOdsIndex = -1;
    this.resetPlanForm();
  }

  // ==========================================
  // GESTIÓN DE PLANES DE MUESTREO
  // ==========================================

  addPlanToCurrentOds(): void {
    
    if (!this.planForm.valid) {
      
      this.errorMessage = 'Complete los campos requeridos del plan';
      
      return;
      
    }

    if (this.sitesArray.length === 0) {
      
      this.errorMessage = 'Agregue al menos un sitio de monitoreo';
      
      return;
      
    }

    if (this.planForm.value.selectedEmployeeIds.length === 0) {
      
      this.errorMessage = 'Asigne al menos un empleado al plan';
      
      return;
      
    }

    const sites = this.sitesArray.value.map((site: any, index: number) => {
      
      
    const matrix = this.matrices.find(m => m.id === Number(site.matrixId));
    
      
      return {
        name: site.name,
        matrixId: Number(site.matrixId),
        matrixName: matrix?.matrixName || '',
        isSubcontracted: site.isSubcontracted,
        subcontractorName: site.isSubcontracted
        ? site.subcontractorName?.trim() || null
        : null,
        executionDate: site.executionDate,
        hasReport: site.hasReport,
        hasGDB: site.hasGDB
      };
    });

    const selectedEmployees = this.employees.filter(e =>
      this.planForm.value.selectedEmployeeIds.includes(e.id)
    );
    const selectedEquipment = this.equipment.filter(e =>
      this.planForm.value.selectedEquipmentIds.includes(e.id)
    );
    const selectedVehicles = this.vehicles.filter(v =>
      this.planForm.value.selectedVehicleIds.includes(v.id)
    );

    const plan = {
      planCode: this.planForm.value.planCode,
      startDate: this.planForm.value.startDate,
      endDate: this.planForm.value.endDate,
      sites: sites,
      resources: {
        startDate: this.planForm.value.resourceStartDate,
        endDate: this.planForm.value.resourceEndDate,
        employeeIds: this.planForm.value.selectedEmployeeIds,
        equipmentIds: this.planForm.value.selectedEquipmentIds,
        vehicleIds: this.planForm.value.selectedVehicleIds,
        employees: selectedEmployees,
        equipment: selectedEquipment,
        vehicles: selectedVehicles
      },
      budget: {
        chCode: this.planForm.value.chCode,
        items: this.budgetItems,
        summary: this.planBudgetSummary,
        notes: this.planForm.value.notes
      }
    };

    this.serviceOrders[this.currentOdsIndex].samplingPlans.push(plan);
    this.resetPlanForm();
    this.errorMessage = '';
    this.successMessage = 'Plan agregado exitosamente';
    setTimeout(() => this.successMessage = '', 3000);
    this.formChanges$.next();
  }

  removePlanFromOds(odsIndex: number, planIndex: number): void {
    this.serviceOrders[odsIndex].samplingPlans.splice(planIndex, 1);
    this.formChanges$.next();
  }

  resetPlanForm(): void {
    this.planForm.reset({
      selectedEmployeeIds: [],
      selectedEquipmentIds: [],
      selectedVehicleIds: [],
      budgetItems: []
    });
    this.sitesArray.clear();
    this.addSite();
  }

  getPlanBudgetTotal(plan: any): number {
    if (!plan.budget || !plan.budget.summary) return 0;
    return plan.budget.summary.grandTotal.billed || 0;
  }


  addCoordinator(): void {
    if (!this.coordinatorForm.valid) {
      this.errorMessage = 'Seleccione un coordinador';
      return;
    }

    const coordinatorId = this.coordinatorForm.value.coordinatorId;
    const coordinator = this.coordinators.find(c => c.id === Number(coordinatorId));

    if (coordinator) {
      const alreadyAdded = this.assignedCoordinators.some(c => c.coordinatorId === Number(coordinatorId));
      if (alreadyAdded) {
        this.errorMessage = 'Este coordinador ya fue agregado';
        return;
      }

      this.assignedCoordinators.push({
        coordinatorId: Number(coordinatorId),
        coordinatorName: coordinator.name
      });
      this.coordinatorForm.reset();
      this.errorMessage = '';
      this.formChanges$.next();
    }
  }

  removeCoordinator(index: number): void {
    this.assignedCoordinators.splice(index, 1);
    this.formChanges$.next();
  }


  saveDraft(isAutoSave: boolean = false): void {
    if (!this.contractForm.valid) {
      if (!isAutoSave) {
        this.errorMessage = 'Complete al menos el código del contrato y el cliente';
      }
      return;
    }

    const draftData = {
      Id: this.draftId,
      Status: 'draft',
      Contract: {
        ContractCode: this.contractForm.value.contractCode,
        ContractName: this.contractForm.value.contractName || '',
        ClientId: Number(this.contractForm.value.clientId),
        ClientName: null,
        StartDate: this.contractForm.value.startDate || null,
        EndDate: this.contractForm.value.endDate || null
      },
      ServiceOrders: this.serviceOrders || [],
      Coordinators: this.assignedCoordinators || []
    };

    console.log('DATOS A ENVIAR:', JSON.stringify(draftData, null, 2));

    if (isAutoSave) {
      this.autoSaving = true;
    } else {
      this.loading = true;
    }

    this.draftService.saveDraft(draftData).subscribe({
      next: (result) => {
        console.log('RESPUESTA:', result);
        if (!this.draftId) {
          this.draftId = result.id || result.Id;
        }
        this.lastSaved = new Date();

        if (!isAutoSave) {
          this.successMessage = 'Borrador guardado exitosamente';
          setTimeout(() => this.successMessage = '', 3000);
        }

        this.loading = false;
        this.autoSaving = false;
      },
      error: (error) => {
        console.error('ERROR COMPLETO:', error);
        console.error('ERROR MESSAGE:', error.error);
        console.error('ERRORES DE VALIDACIÓN:', error.error?.errors); // AGREGA ESTA LÍNEA
        if (!isAutoSave) {
          this.errorMessage = 'Error al guardar el borrador';
        }
        this.loading = false;
        this.autoSaving = false;
      }
    });
  }
  loadDraft(draftId: number): void {
    this.loading = true;

    this.draftService.getDraftById(draftId).subscribe({
      next: (draft) => {
        this.draftId = draftId;
        this.restoreDraftData(draft);
        this.loading = false;
        this.successMessage = 'Borrador cargado exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error cargando draft:', error);
        this.errorMessage = 'Error al cargar el borrador';
        this.loading = false;
      }
    });
  }

  deleteDraft(): void {
    
    if (!this.draftId) return;

    if (!confirm('¿Está seguro de eliminar este borrador?')) {
      return;
    }

    this.loading = true;

    this.draftService.deleteDraft(this.draftId).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Error eliminando draft:', error);
        this.errorMessage = 'Error al eliminar el borrador';
        this.loading = false;
      }
    });
  }



  private restoreDraftData(draft: any): void {
    const contract = draft.contract || draft.Contract;
    const serviceOrders = draft.serviceOrders || draft.ServiceOrders;
    const coordinators = draft.coordinators || draft.Coordinators;

    if (contract) {
      this.contractForm.patchValue({
        contractCode: contract.contractCode || contract.ContractCode,
        contractName: contract.contractName || contract.ContractName,
        clientId: contract.clientId || contract.ClientId,
        startDate: contract.startDate || contract.StartDate,
        endDate: contract.endDate || contract.EndDate
      });
    }
    if (serviceOrders) {
      this.serviceOrders = serviceOrders;
    }
    if (coordinators) {
      this.assignedCoordinators = coordinators;
    }
  }


  canFinalize(): boolean {
    return this.contractForm.valid &&
      this.serviceOrders.length > 0 &&
      this.assignedCoordinators.length > 0;
  }

  finalizeProject(): void {
    if (!this.canFinalize()) {
      this.errorMessage = 'Complete todos los datos requeridos antes de finalizar';
      return;
    }

    if (!confirm('¿Está seguro de crear el proyecto? Esto eliminará el borrador.')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const projectDto = this.buildProjectDto();

    // LOGGING COMPLETO
    console.log('==========================================');
    console.log('PROYECTO A ENVIAR AL BACKEND:');
    console.log('==========================================');
    console.log(JSON.stringify(projectDto, null, 2));
    
    projectDto.ServiceOrders.forEach((ods, odsIdx) => {
      console.log(`ODS ${odsIdx + 1}: ${ods.OdsCode}`);
      ods.SamplingPlans.forEach((plan, planIdx) => {
        console.log(`  Plan ${planIdx + 1}: ${plan.PlanCode}`);
        console.log(`    Fechas recursos: ${plan.Resources?.StartDate} - ${plan.Resources?.EndDate}`);
        console.log(`    Vehiculos: ${JSON.stringify(plan.Resources?.VehicleIds)}`);
        console.log(`    Empleados: ${JSON.stringify(plan.Resources?.EmployeeIds)}`);
        console.log(`    Equipos: ${JSON.stringify(plan.Resources?.EquipmentIds)}`);
      });
    });
    console.log('==========================================');

    this.projectCreationService.createCompleteProject(projectDto).subscribe({
      next: (result) => {
        this.projectResult = result;
        if (this.draftId) {
          this.draftService.deleteDraft(this.draftId).subscribe();
        }
        this.loading = false;
        this.isDraft = false;
        this.showFinalDashboard = true;
      },
      error: (error) => {
        console.error('ERROR COMPLETO:', error);
        console.error('ERROR RESPONSE:', error.error);
        console.error('ERROR STATUS:', error.status);
        this.errorMessage = 'Error al crear el proyecto: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  private calculatePlanBudgetTotals(budgetItems: BudgetItem[]) {
    const totals = {
      CHCode: this.planForm.value.chCode || null,
      TransportCostChemilab: 0,
      TransportBilledToClient: 0,
      LogisticsCostChemilab: 0,
      LogisticsBilledToClient: 0,
      SubcontractingCostChemilab: 0,
      SubcontractingBilledToClient: 0,
      FluvialTransportCostChemilab: 0,
      FluvialTransportBilledToClient: 0,
      ReportsCostChemilab: 0,
      ReportsBilledToClient: 0,
      Notes: this.planForm.value.notes || null
    };

    budgetItems.forEach(item => {
      const itemTotals = this.calculateItemTotal(item);

      switch (item.category) {
        case BudgetCategory.TRANSPORT:
          totals.TransportCostChemilab += itemTotals.cost;
          totals.TransportBilledToClient += itemTotals.billed;
          break;
        case BudgetCategory.LOGISTICS:
          totals.LogisticsCostChemilab += itemTotals.cost;
          totals.LogisticsBilledToClient += itemTotals.billed;
          break;
        case BudgetCategory.SUBCONTRACTING:
          totals.SubcontractingCostChemilab += itemTotals.cost;
          totals.SubcontractingBilledToClient += itemTotals.billed;
          break;
        case BudgetCategory.RIVER_TRANSPORT:
          totals.FluvialTransportCostChemilab += itemTotals.cost;
          totals.FluvialTransportBilledToClient += itemTotals.billed;
          break;
        case BudgetCategory.REPORTS:
          totals.ReportsCostChemilab += itemTotals.cost;
          totals.ReportsBilledToClient += itemTotals.billed;
          break;
      }
    });

    return totals;
  }


  private buildProjectDto(): CreateProject {
  const contractData = this.contractForm.value;

  const serviceOrders = this.serviceOrders.map(ods => ({
    OdsCode: ods.odsCode,
    OdsName: ods.odsName,
    StartDate: ods.startDate || null,
    EndDate: ods.endDate || null,
    SamplingPlans: ods.samplingPlans.map((plan: any) => {
      
      const resourceStartDate = plan.resources?.startDate;
      const resourceEndDate = plan.resources?.endDate;
      
      console.log(`Plan ${plan.planCode} - Fechas recursos:`, {
        startDate: resourceStartDate,
        endDate: resourceEndDate,
        hasResources: !!(plan.resources?.employeeIds?.length || 
                        plan.resources?.equipmentIds?.length || 
                        plan.resources?.vehicleIds?.length)
      });

      return {
        PlanCode: plan.planCode,
        StartDate: plan.startDate || null,
        EndDate: plan.endDate || null,
        Sites: plan.sites.map((site: any) => ({
          Name: site.name,
          MatrixId: site.matrixId,
          ExecutionDate: site.executionDate || null,
          HasReport: site.hasReport,
          HasGDB: site.hasGDB,
          IsSubcontracted: site.isSubcontracted,
          SubcontractorName: site.isSubcontracted ? (site.subcontractorName?.trim() || null) : null
        })),

        Resources: {
          StartDate: resourceStartDate || null,
          EndDate: resourceEndDate || null,
          EmployeeIds: plan.resources?.employeeIds || [],
          EquipmentIds: plan.resources?.equipmentIds || [],
          VehicleIds: plan.resources?.vehicleIds || []
        },
        
        Budget: this.calculatePlanBudgetTotals(plan.budget?.items || [])
      };
    })
  }));

  return {
    Contract: {
      ContractCode: contractData.contractCode,
      ContractName: contractData.contractName || '',
      ClientId: Number(contractData.clientId),
      StartDate: contractData.startDate || null,
      EndDate: contractData.endDate || null
    },
    ServiceOrders: serviceOrders,
    CoordinatorIds: this.assignedCoordinators.map(c => c.coordinatorId),
    ProjectDetails: {
      ProjectName: contractData.contractName || contractData.contractCode,
      ProjectDescription: '',
      Priority: 'media'
    }
  };
}

  createAnotherProject(): void {
    this.router.navigate(['/projects/new']);
    window.location.reload();
  }

  goToDashboard(): void {
    this.router.navigate(['/projects-dashboard']);
  }


  get getClientName(): string {
    const clientId = this.contractForm.value.clientId;
    const client = this.clients.find(c => c.id === Number(clientId));
    return client?.name || 'No asignado';
  }

  getTimeSinceLastSave(): string {
    if (!this.lastSaved) return 'Nunca';

    const seconds = Math.floor((new Date().getTime() - this.lastSaved.getTime()) / 1000);

    if (seconds < 60) return 'hace unos segundos';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    return `hace ${Math.floor(seconds / 3600)} horas`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  get progressPercentage(): number {
    let completed = 0;
    let total = 5;

    if (this.contractForm.valid) completed++;
    if (this.serviceOrders.length > 0) completed++;
    if (this.serviceOrders.some(ods => ods.samplingPlans.length > 0)) completed++;
    if (this.assignedCoordinators.length > 0) completed++;
    if (this.canFinalize()) completed++;

    return Math.round((completed / total) * 100);
  }

  // Categorías de presupuesto para el select
  get budgetCategories() {
    return Object.values(BudgetCategory);
  }

  // ==========================================
  // GETTERS PARA EL TEMPLATE
  // ==========================================

  get hasAnyPlans(): boolean {
    return this.serviceOrders.some(ods => ods.samplingPlans.length > 0);
  }

  get totalPlansCount(): number {
    return this.serviceOrders.reduce((total, ods) => total + ods.samplingPlans.length, 0);
  }
}