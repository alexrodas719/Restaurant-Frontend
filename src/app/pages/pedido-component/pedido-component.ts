import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { MatTableDataSource } from '@angular/material/table';
import { Pedido } from '../../model/pedido';
import { PedidoService } from '../../services/pedido-service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

import { PedidoDialogComponent } from './pedido-dialog-component/pedido-dialog-component';
import { PedidoDetailsDialogComponent } from './pedido-details-dialog-component/pedido-details-dialog-component';

@Component({
  selector: 'app-pedido',
  imports: [MaterialModule, CommonModule],
  templateUrl: './pedido-component.html',
  styleUrl: './pedido-component.css',
})
export class PedidoComponent {
  dataSource: MatTableDataSource<Pedido>;

  columnsDefinitions = [
    { def: 'id', label: 'ID', hide: false },
    { def: 'fecha', label: 'Fecha', hide: false },
    { def: 'mesa', label: 'Mesa', hide: false },
    { def: 'cliente', label: 'Cliente', hide: false },
    { def: 'usuario', label: 'Mesero', hide: false },
    { def: 'estado', label: 'Estado', hide: false },
    { def: 'total', label: 'Total', hide: false },
    { def: 'actions', label: 'Acciones', hide: false },
  ];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private pedidoService: PedidoService,
    private _dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.pedidoService.findAll().subscribe({
      next: (data) => this.createTable(data),
      error: (err) => console.error('Error cargando pedidos', err),
    });
  }

  createTable(data: Pedido[]) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getDisplayedColumns() {
    return this.columnsDefinitions.filter((c) => !c.hide).map((c) => c.def);
  }

  openCreateDialog() {
    const dialogRef = this._dialog.open(PedidoDialogComponent, {
      width: '550px',
      maxWidth: '95vw',
      height: 'auto',
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'created') {
        this._snackBar.open('Pedido registrado correctamente', 'Cerrar', { duration: 3000 });
        this.loadData();
      }
    });
  }

  openDetailDialog(pedido: Pedido) {
    this._dialog.open(PedidoDetailsDialogComponent, {
      width: '700px',
      data: pedido,
    });
  }

  onEstadoChange(pedido: Pedido, nuevoEstado: string) {
    const prev = pedido.estado;
    pedido.estado = nuevoEstado;

    this.pedidoService.cambiarEstado(pedido.id, nuevoEstado).subscribe({
      next: () => {
        this._snackBar.open('Estado actualizado', 'Cerrar', { duration: 2000 });
        this.loadData();
      },
      error: (err) => {
        pedido.estado = prev;
        this._snackBar.open(err?.error?.message || 'Error al cambiar estado', 'Cerrar', {
          duration: 4000,
        });
        this.loadData();
      },
    });
  }

  getTotal(detalles: any[]) {
    return detalles?.reduce((t, d) => t + (d.subtotal || d.cantidad * d.producto?.precio), 0) || 0;
  }
}
