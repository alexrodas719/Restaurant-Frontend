import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Reserva } from '../../../model/reserva';
import { ReservaService } from '../../../services/reserva-service';
import { switchMap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Mesa } from '../../../model/mesa';
import { Cliente } from '../../../model/cliente';
import { MesaService } from '../../../services/mesa-service';
import { ClienteService } from '../../../services/cliente-service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reserva-dialog-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './reserva-dialog-component.html',
  styleUrls: ['./reserva-dialog-component.css'],
})
export class ReservaDialogComponent implements OnInit {
  form: FormGroup;
  reserva: Reserva;
  mesas: Mesa[] = [];
  clientes: Cliente[] = [];
  fechaHoraLocal: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Reserva,
    private _dialogRef: MatDialogRef<ReservaDialogComponent>,
    private fb: FormBuilder,
    private reservaService: ReservaService,
    private mesaService: MesaService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.reserva = this.data ? { ...this.data } : new Reserva();

    if (this.reserva.fechaHora) {
      this.fechaHoraLocal = this.convertToDatetimeLocal(this.reserva.fechaHora);
    }

    this.form = this.fb.group({
      cliente: [this.reserva.cliente || null, Validators.required],
      mesa: [this.reserva.mesa || null, Validators.required],
      fechaHora: [this.fechaHoraLocal || '', Validators.required],
      numeroPersonas: [this.reserva.numeroPersonas || 1, [Validators.required, Validators.min(1)]],
      estado: [this.reserva.estado || 'Pendiente', Validators.required],
      observaciones: [this.reserva.observaciones || '', Validators.maxLength(250)],
    });

    this.mesaService.findAll().subscribe({
      next: (data) => (this.mesas = data),
      error: (err) => console.error('Error al cargar mesas', err),
    });

    this.clienteService.findAll().subscribe({
      next: (data) => (this.clientes = data),
      error: (err) => console.error('Error al cargar clientes', err),
    });
  }

  convertToDatetimeLocal(fecha: Date | string): string {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  operate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const reservaFinal: Reserva = {
      ...this.reserva,
      ...formValue,
      fechaHora: new Date(formValue.fechaHora),
    };

    const mesaSeleccionada: Mesa = reservaFinal.mesa;

    let nuevoEstadoMesa = mesaSeleccionada.estado;

    if (reservaFinal.estado === 'Pendiente') {
      nuevoEstadoMesa = 'Disponible'; 
    } else if (reservaFinal.estado === 'Confirmada') {
      nuevoEstadoMesa = 'Reservada'; 
    } else if (reservaFinal.estado === 'Completada' || reservaFinal.estado === 'Cancelada') {
      nuevoEstadoMesa = 'Disponible'; 
    }

    const mesaActualizada: Mesa = {
      ...mesaSeleccionada,
      estado: nuevoEstadoMesa,
    };

    this.mesaService
      .update(mesaActualizada.id, mesaActualizada)
      .pipe(
        switchMap(() => {
          if (this.reserva && this.reserva.id > 0) {
            return this.reservaService.update(this.reserva.id, reservaFinal);
          } else {
            return this.reservaService.save(reservaFinal);
          }
        }),
        switchMap(() => this.reservaService.findAll())
      )
      .subscribe((data) => {
        this.reservaService.setReservaChange(data);
        this.reservaService.setMessageChange(
          this.reserva?.id ? 'RESERVA UPDATED!' : 'RESERVA CREATED!'
        );
        this.close();
      });
  }

  close() {
    this._dialogRef.close();
  }

  compareCliente(c1: Cliente, c2: Cliente): boolean {
    return c1 && c2 ? c1.id === c2.id : c1 === c2;
  }

  compareMesa(m1: Mesa, m2: Mesa): boolean {
    return m1 && m2 ? m1.id === m2.id : m1 === m2;
  }
}