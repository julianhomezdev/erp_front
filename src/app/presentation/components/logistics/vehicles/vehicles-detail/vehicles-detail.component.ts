import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { VehicleService } from "../../../../../core/services/vehicle.service";
import { SupplierService } from "../../../../../core/services/supplier.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";
import { Supplier } from "../../../../../domain/Entities/supplier/supplier.model";

@Component({
    selector: 'vehicle-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './vehicles-detail.component.html'
})
export class VehicleDetailComponent implements OnInit, OnDestroy {

    vehicleForm!: FormGroup;
    vehicleId: number | null = null;
    isEditMode: boolean = false;
    isNewVehicle: boolean = false;
    loading = false;
    saving = false;
    error: string | null = null;

    availableStatuses = ['Available', 'InUse', 'Maintenance', 'OutOfService'];
    availableOwnerships = [
        { value: 1, label: 'Propia' },
        { value: 2, label: 'Rentada' }
    ];
    suppliers: Supplier[] = [];

    private fb = inject(FormBuilder);
    private vehicleService = inject(VehicleService);
    private supplierService = inject(SupplierService);
    private route = inject(ActivatedRoute);
    router = inject(Router);
    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id === 'new') {
            this.isNewVehicle = true;
            this.isEditMode = true;
        } else if (id) {
            this.vehicleId = parseInt(id, 10);
            this.isNewVehicle = false;
            this.isEditMode = false;
        }

        this.createForm();
        this.loadSuppliers();

        if (!this.isNewVehicle && this.vehicleId) {
            this.vehicleForm.disable();
            this.loadVehicle();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private createForm() {
        this.vehicleForm = this.fb.group({
            plateNumber: ['', [Validators.required]],
            brand: ['', [Validators.required]],
            model: ['', [Validators.required]],
            year: ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
            status: ['Available', [Validators.required]],
            ownership: [1, [Validators.required]],
            costPerMonth: [null],
            costPerDay: [null, [Validators.required, Validators.min(0)]],
            supplierId: [null],
            locationId: [null]
        });

        this.vehicleForm.get('ownership')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(ownership => {
                this.onOwnershipChange(Number(ownership));
            });

        this.vehicleForm.get('costPerMonth')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(costPerMonth => {
                const ownership = Number(this.vehicleForm.get('ownership')?.value);
                console.log('CostPerMonth changed:', costPerMonth, 'Ownership:', ownership, 'Type:', typeof costPerMonth);

                if (ownership === 1 && costPerMonth != null && costPerMonth !== '' && Number(costPerMonth) > 0) {
                    const costPerDay = Number(costPerMonth) / 30;
                    console.log('Calculating costPerDay:', costPerDay);
                    this.vehicleForm.get('costPerDay')?.setValue(costPerDay, { emitEvent: false });
                } else if (ownership === 1) {
                    this.vehicleForm.get('costPerDay')?.setValue(null, { emitEvent: false });
                }
            });
    }

    private onOwnershipChange(ownership: number) {
        const supplierControl = this.vehicleForm.get('supplierId');
        const costPerMonthControl = this.vehicleForm.get('costPerMonth');
        const costPerDayControl = this.vehicleForm.get('costPerDay');

        console.log('Ownership changed to:', ownership);

        if (ownership === 2) {
            supplierControl?.setValidators([Validators.required]);
            costPerMonthControl?.clearValidators();
            costPerMonthControl?.setValue(null);
            costPerDayControl?.setValue(null);
        } else {
            supplierControl?.clearValidators();
            supplierControl?.setValue(null);
            costPerMonthControl?.setValidators([Validators.min(0)]);
        }

        supplierControl?.updateValueAndValidity();
        costPerMonthControl?.updateValueAndValidity();
        costPerDayControl?.updateValueAndValidity();
    }
    private loadSuppliers() {
        this.supplierService.getSuppliers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (suppliers) => {
                    this.suppliers = suppliers;
                    console.log('Suppliers loaded:', this.suppliers);
                },
                error: (err) => {
                    console.error('Error loading suppliers:', err);
                }
            });
    }

    loadVehicle() {
        if (!this.vehicleId) return;

        this.loading = true;
        this.error = null;

        this.vehicleService.getVehicleById(this.vehicleId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (vehicle) => {
                    const ownership = vehicle.ownership || 1;
                    this.vehicleForm.patchValue({
                        plateNumber: vehicle.plateNumber,
                        brand: vehicle.brand,
                        model: vehicle.model,
                        year: vehicle.year,
                        status: vehicle.status,
                        ownership: ownership,
                        costPerDay: vehicle.costPerDay,
                        supplierId: vehicle.supplierId,
                        locationId: null
                    });

                    if (ownership === 1 && vehicle.costPerDay) {
                        const costPerMonth = vehicle.costPerDay * 30;
                        this.vehicleForm.patchValue({ costPerMonth: costPerMonth });
                    }

                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading vehicle:', err);
                    this.error = 'Error cargando datos del vehículo';
                    this.loading = false;
                }
            });
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            this.vehicleForm.enable();
            this.vehicleForm.get('plateNumber')?.disable();
        } else {
            this.vehicleForm.disable();
            this.loadVehicle();
        }
    }

    get isRented(): boolean {
        const ownership = Number(this.vehicleForm.get('ownership')?.value);
        return ownership === 2;
    }

    onSubmit() {
        if (this.vehicleForm.invalid) {
            Object.keys(this.vehicleForm.controls).forEach(key => {
                this.vehicleForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.saving = true;
        this.error = null;

        if (this.isNewVehicle) {
            const formData = this.vehicleForm.getRawValue();
            const { costPerMonth, ...createData } = formData;

            const ownership = Number(createData.ownership);
            if (ownership === 1) {
                createData.supplierId = null;
            } else if (ownership === 2 && !createData.supplierId) {
                this.error = 'Debe seleccionar un proveedor para vehículos rentados';
                this.saving = false;
                return;
            }

            console.log('Data to send:', createData);

          

            this.vehicleService.createVehicle(createData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.saving = false;
                        this.router.navigate(['/logistics/vehicles']);
                    },
                    error: (err) => {
                        console.error('Error creating vehicle:', err);
                        this.error = err.error?.message || 'Error creando vehículo';
                        this.saving = false;
                    }
                });
        } else if (this.vehicleId) {
            const formData = this.vehicleForm.value;
            const { costPerMonth, ...updateData } = formData;

            const ownership = Number(updateData.ownership);
            if (ownership === 1) {
                updateData.supplierId = null;
            }

            console.log('Data to update:', updateData);
            console.log('========== DATA TO UPDATE ==========');
            console.log('Full data:', JSON.stringify(updateData, null, 2));
            console.log('SupplierId value:', updateData.supplierId);
            console.log('SupplierId type:', typeof updateData.supplierId);
            console.log('====================================');

            this.vehicleService.updateVehicle(this.vehicleId, updateData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.saving = false;
                        this.isEditMode = false;
                        this.vehicleForm.disable();
                    },
                    error: (err) => {
                        console.error('Error updating vehicle:', err);
                        this.error = err.error?.message || 'Error actualizando vehículo';
                        this.saving = false;
                    }
                });
        }
    }

    onCancel() {
        if (this.isNewVehicle) {
            this.router.navigate(['/logistics/vehicles']);
        } else {
            this.toggleEditMode();
        }
    }

    onDelete() {
        if (!this.vehicleId || !confirm('¿Estás seguro de eliminar este vehículo?')) return;

        this.saving = true;

        this.vehicleService.deleteVehicle(this.vehicleId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.router.navigate(['/logistics/vehicles']);
                },
                error: (err) => {
                    console.error('Error deleting vehicle:', err);
                    this.error = 'Error eliminando vehículo';
                    this.saving = false;
                }
            });
    }

    getFieldError(fieldName: string): string | null {
        const field = this.vehicleForm.get(fieldName);
        if (field?.invalid && field?.touched) {
            if (field.errors?.['required']) return 'Este campo es requerido';
            if (field.errors?.['min']) return `Valor mínimo: ${field.errors['min'].min}`;
            if (field.errors?.['max']) return `Valor máximo: ${field.errors['max'].max}`;
        }
        return null;
    }
}