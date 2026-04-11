import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, IonText } from '@ionic/angular/standalone';
import { DetalleRegistro } from 'src/app/core/models/usuario.model';
import { FotoService } from 'src/app/core/services/foto.service';
import { ScannerService } from 'src/app/core/services/scanner.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { addIcons } from 'ionicons';
import { cameraOutline, personCircleOutline, barcodeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-registro-formulario',
  templateUrl: './registro-formulario.component.html',
  styleUrls: ['./registro-formulario.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonItem, IonInput, IonButton, IonIcon, IonText, IonSelect, IonSelectOption]
})
export class RegistroFormularioComponent implements OnInit {
  @Input() esEmpleado: boolean = false;
  @Input() isLoading: boolean = false;
  @Output() formSubmit = new EventEmitter<DetalleRegistro>();

  registroForm!: FormGroup;
  fotoUrlTemporal: string | null = null;
  step: number = 1; // Manejador del paso actual
  
  private fb = inject(FormBuilder);
  private fotoService = inject(FotoService);
  private scannerService = inject(ScannerService);
  private toastService = inject(ToastService);

  constructor() {
    addIcons({ cameraOutline, personCircleOutline, barcodeOutline });
  }

  ngOnInit() {
    this.registroForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(7), Validators.maxLength(8)]],
      cuil: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.minLength(11), Validators.maxLength(11)]],
      perfil: [''], // Se asigna luego dinámicamente si no es empleado
    }, { validators: this.passwordMatchValidator() });

    if (this.esEmpleado) {
      this.registroForm.get('perfil')?.setValidators(Validators.required);
    }
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      
      if (password && confirmPassword && password !== confirmPassword) {
        control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  nextStep() {
    this.step = 2;
  }

  prevStep() {
    this.step = 1;
  }

  async tomarFotografia() {
    const foto = await this.fotoService.sacarFoto();
    if (foto && foto.dataUrl) {
      this.fotoUrlTemporal = foto.dataUrl;
    }
  }

  async escanearDocumento() {
    this.isLoading = true;
    try {
      const datos = await this.scannerService.scanDni();
      if (datos) {
        // Autocompleta los campos
        this.registroForm.patchValue({
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          dni: datos.dni,
          cuil: datos.cuil || ''
        });
        // Forzamos la validacion luego del patchValue
        this.registroForm.updateValueAndValidity();
      }
    } finally {
      this.isLoading = false;
    }
  }

  enviarFormulario() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      import('@capacitor/haptics').then(m => m.Haptics.impact({ style: m.ImpactStyle.Heavy }).catch(() => {}));
      this.toastService.mostrarError('Por favor complete todos los datos requeridos correctamente.');
      return;
    }

    if (!this.fotoUrlTemporal) {
      import('@capacitor/haptics').then(m => m.Haptics.impact({ style: m.ImpactStyle.Heavy }).catch(() => {}));
      this.toastService.mostrarError('Es obligatorio tomarse una fotografía para registrarse.');
      return;
    }

    const value = this.registroForm.value;

    const data: DetalleRegistro = {
      email: value.email,
      password: value.password,
      nombres: value.nombres,
      apellidos: value.apellidos,
      dni: value.dni,
      cuil: value.cuil,
      perfil: this.esEmpleado ? value.perfil : 'cliente_reg',
      foto_url: this.fotoUrlTemporal // Se subirá luego
    };

    this.formSubmit.emit(data);
  }

  // Helpers para checkear errores visualmente
  get f() {
    return this.registroForm.controls;
  }
}
