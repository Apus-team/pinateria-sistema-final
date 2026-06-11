export interface Perfil {
  id: string
  nombre: string | null
  telefono: string | null
  rol: string | null
  estado: string | null
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Producto {
  id: string
  categoria_id: string | null
  codigo: string | null
  nombre: string
  descripcion: string | null
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  imagen_url: string | null
  estado: string | null
  activo: boolean
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProductoView {
  id: string
  codigo: string | null
  nombre: string
  descripcion: string | null
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  estado: string | null
  activo: boolean
  imagen_url: string | null
  categoria_id: string | null
  categoria_nombre: string | null
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  observaciones: string | null
  activo: boolean
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface ClienteFrecuenteView {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  cantidad_compras: number | null
  total_compras: number | null
  ultima_compra: string | null
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
  id: string
  producto_id: string
  usuario_id: string | null
  tipo: string
  cantidad: number
  stock_anterior: number | null
  stock_nuevo: number | null
  referencia_tipo: string | null
  referencia_id: string | null
  observacion: string | null
  created_at: string
}

export interface InventarioView {
  id: string
  codigo: string | null
  nombre: string
  categoria_nombre: string | null
  stock_actual: number
  stock_minimo: number
  estado_inventario: string | null
}

export interface DashboardResumen {
  ventas_dia: number | null
  productos_registrados: number | null
  productos_bajo_stock: number | null
  pedidos_pendientes: number | null
  clientes_registrados: number | null
}
