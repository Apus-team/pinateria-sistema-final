export interface Perfil {
  id: string
  nombre: string | null
  telefono: string | null
  rol: string | null
  estado: string | null
}

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Producto {
  id: number
  categoria_id: number | null
  codigo: string | null
  nombre: string
  descripcion: string | null
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  imagen_url: string | null
  estado: string | null
  activo: boolean
}

export interface Cliente {
  id: number
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  observaciones: string | null
  activo: boolean
}

export interface Venta {
  id: number
  cliente_id: number | null
  usuario_id: string | null
  fecha_venta: string
  subtotal: number
  impuesto: number
  descuento: number
  total: number
  metodo_pago: string | null
  estado: string | null
}

export interface DetalleVenta {
  id: number
  venta_id: number
  producto_id: number | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface PedidoPersonalizado {
  id: number
  cliente_id: number
  usuario_id: string | null
  fecha_pedido: string
  fecha_entrega: string | null
  descripcion: string
  referencia_imagen: string | null
  anticipo: number
  total: number
  estado: string | null
  observaciones: string | null
}

export interface PagoPedido {
  id: number
  pedido_id: number
  monto: number
  fecha_pago: string
  metodo_pago: string | null
  referencia: string | null
}

export interface MovimientoInventario {
  id: number
  producto_id: number
  tipo: string
  cantidad: number
  motivo: string | null
  usuario_id: string | null
  fecha: string
}

export interface DashboardResumen {
  ventas_dia: number | null
  productos_registrados: number | null
  productos_bajo_stock: number | null
  pedidos_pendientes: number | null
  clientes_registrados: number | null
}
