# Carga de datos para exposición académica — Piñatería Familiar

## Objetivo

Alimentar el sistema web con datos realistas, coherentes y suficientes para que todos los módulos (Dashboard, Productos, Inventario, Clientes, Ventas, Pedidos personalizados, Reportes) muestren información completa durante la exposición académica.

Los datos están diseñados para parecer reales, sin etiquetas visibles como "DEMO" o "TEST". Usan nombres, códigos, precios y comportamientos propios de una piñatería familiar peruana.

## Cantidad de registros por módulo

| Módulo               | Tabla                  | Registros |
|----------------------|------------------------|-----------|
| Categorías           | categorias             | 10        |
| Productos            | productos              | 25        |
| Clientes             | clientes               | 25        |
| Ventas               | ventas                 | 25        |
| Detalle de ventas    | detalle_ventas         | ~55-75    |
| Pedidos personalizados | pedidos_personalizados | 25        |
| Pagos de pedidos     | pagos_pedido           | ~35-40    |
| Movimientos          | movimientos_inventario | ~35       |

## Tablas alimentadas

- `categorias`
- `productos`
- `clientes`
- `ventas`
- `detalle_ventas`
- `pedidos_personalizados`
- `pagos_pedido`
- `movimientos_inventario`

Las vistas (`vw_dashboard_resumen`, `vw_historial_ventas`, `vw_inventario`, `vw_clientes_frecuentes`, `vw_pedidos_personalizados`) se alimentarán automáticamente desde estas tablas.

## Cómo ejecutar el SQL

### Opción 1: Supabase SQL Editor (recomendado para exposición)

1. Inicia sesión en [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Abre el archivo `supabase/seed-carga-datos-exposicion.sql`
5. Copia todo el contenido
6. Pégalo en el SQL Editor
7. **Revisa la sección "DEPURACIÓN OPCIONAL DE DATOS PREVIOS"** (líneas ~540-570). Si es tu primera ejecución, no necesitas descomentarla.
8. Haz clic en **Run** (▶)

### Opción 2: CLI de Supabase (si tienel acceso)

```bash
supabase db execute --file supabase/seed-carga-datos-exposicion.sql
```

## Qué revisar después de ejecutar

1. **Dashboard** — Debe mostrar tarjetas KPI con datos, gráficos de ventas, métodos de pago, inventario, pedidos, productos más vendidos, clientes frecuentes y alertas.
2. **Productos** — Listar 25 productos con códigos, precios y stock variado.
3. **Inventario** — Ver la tabla de inventario con estados disponibles, bajo stock y agotados. Revisar que los movimientos se hayan generado.
4. **Clientes** — Listar 25 clientes con información de contacto realista.
5. **Ventas** — Ver 25 ventas con diferentes estados, métodos de pago y montos. Revisar que los totales cuadren con los detalles.
6. **Pedidos personalizados** — Ver 25 pedidos con estados variados, fechas de entrega y pagos asociados.
7. **Reportes** — Generar reportes y verificar que los datos aparezcan correctamente.

## Advertencia importante

La sección **"DEPURACIÓN OPCIONAL DE DATOS PREVIOS"** está comentada por defecto. Solo debe descomentarse si:

- Existen registros de cargas anteriores que interfieran con la visualización
- Se identifican códigos de producto, correos de cliente o códigos de pedido específicos que deben desactivarse

La depuración usa `UPDATE` (no `DELETE`) para desactivar registros, lo que permite revertir fácilmente si es necesario.

**No ejecutes la sección de depuración sin revisar primero los criterios.**

## Notas técnicas

- El script está envuelto en una transacción (`BEGIN` / `COMMIT`). Si algo falla, todo se revierte automáticamente.
- No se insertan registros en `auth.users`. Los campos `usuario_id` y `created_by` se omiten cuando no son obligatorios.
- No se asumen UUIDs fijos; se usan CTEs y consultas dinámicas para obtener IDs.
- No se insertan valores en columnas posiblemente generadas (`detalle_ventas.subtotal`, `pedidos_personalizados.saldo`).
- Los métodos de pago y estados usan únicamente los valores permitidos por la base de datos.
- Las fechas de ventas están distribuidas en los últimos 30 días, con mayor densidad en los últimos 7 días para alimentar los gráficos del Dashboard.

## Recomendación antes de hacer commit

1. Verificar que `npm run build` compila sin errores después de la carga.
2. Confirmar que el Dashboard carga sin pantalla blanca.
3. Verificar que todos los módulos muestran datos correctamente.
4. Si se requiere resetear los datos, se puede ejecutar una transacción con `ROLLBACK` en lugar de `COMMIT` durante las pruebas.
