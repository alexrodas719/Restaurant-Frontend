import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Reserva } from '../../model/reserva';
import { ReservaService } from '../../services/reserva-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MaterialModule } from '../../material/material-module';
import { DatePipe } from '@angular/common';
import { ReservaDialogComponent } from './reserva-dialog-component/reserva-dialog-component';
import { ReservaDeleteDialogComponent } from './reserva-delete-dialog-component/reserva-delete-dialog-component';
import { switchMap } from 'rxjs';
import { MesaService } from '../../services/mesa-service';

@Component({
  selector: 'app-reserva-component',
  imports: [MaterialModule, DatePipe],
  templateUrl: './reserva-component.html',
  styleUrl: './reserva-component.css',
})
export class ReservaComponent {
  dataSource: MatTableDataSource<Reserva>;

  columnsDefinitions = [
    { def: 'id', label: 'ID', hide: false },
    { def: 'cliente', label: 'Cliente', hide: false },
    { def: 'mesa', label: 'Mesa', hide: false },
    { def: 'fechaHora', label: 'Fecha y Hora', hide: false },
    { def: 'numeroPersonas', label: 'Personas', hide: false },
    { def: 'estado', label: 'Estado', hide: false },
    { def: 'actions', label: 'Acciones', hide: false },
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private reservaService: ReservaService,
    private _snackBar: MatSnackBar,
    private _dialog: MatDialog,
    private mesaService: MesaService
  ) {}

  ngOnInit(): void {
    this.loadReservas();

    this.reservaService.getReservaChange().subscribe((data) => {
      this.createTable(data);
    });

    this.reservaService.getMessageChange().subscribe((msg) => {
      this._snackBar.open(msg, 'Cerrar', { duration: 3000 });
    });
  }

  private loadReservas(): void {
    this.reservaService.findAll().subscribe({
      next: (data) => this.createTable(data),
      error: (err) => console.error('❌ Error al obtener reservas:', err),
    });
  }

  createTable(data: Reserva[]) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getDisplayedColumns() {
    return this.columnsDefinitions.filter((cd) => !cd.hide).map((cd) => cd.def);
  }

  applyFilter(e: any) {
    this.dataSource.filter = e.target.value.trim().toLowerCase();
  }

  openDialog(reserva?: Reserva) {
    this._dialog.open(ReservaDialogComponent, {
      width: '750px',
      data: reserva,
    });
  }

  openDeleteDialog(reserva: Reserva) {
    this._dialog
      .open(ReservaDeleteDialogComponent, {
        width: '400px',
        data: reserva,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this._snackBar.open('Reserva eliminada correctamente', 'Cerrar', {
            duration: 3000,
          });
        }
      });
  }

  cambiarEstado(reserva: Reserva) {
    const nuevoEstado = reserva.estado;
    let estadoMesa = reserva.mesa.estado;

    if (nuevoEstado === 'Pendiente') {
      estadoMesa = 'Disponible'; // No debe ocupar mesa
    } else if (nuevoEstado === 'Confirmada') {
      estadoMesa = 'Reservada';
    } else if (nuevoEstado === 'Completada' || nuevoEstado === 'Cancelada') {
      estadoMesa = 'Disponible';
    }

    const mesaActualizada = {
      ...reserva.mesa,
      estado: estadoMesa,
    };

    this.reservaService
      .update(reserva.id, reserva)
      .pipe(
        switchMap(() => this.mesaService.update(mesaActualizada.id, mesaActualizada)),
        switchMap(() => this.reservaService.findAll())
      )
      .subscribe({
        next: (data) => {
          this.reservaService.setReservaChange(data);
          this.reservaService.setMessageChange('Estado actualizado');
        },
        error: (err) => console.error('Error cambiando estado', err),
      });
  }
}