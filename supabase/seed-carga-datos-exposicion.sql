-- ============================================================================
-- CARGA DE DATOS PARA EXPOSICIÓN ACADÉMICA — PIÑATERÍA FAMILIAR
-- Versión: 1.1.0
-- Fecha: Junio 2026
-- Descripción: Datos realistas para alimentar Dashboard, Reportes y todos los
--              módulos del sistema durante la exposición académica.
-- ============================================================================
-- IMPORTANTE:
-- 1. Revisar la sección "DEPURACIÓN OPCIONAL DE DATOS PREVIOS" antes de
--    ejecutar. Está comentada; actívala solo si es necesario.
-- 2. Ejecutar todo dentro de una transacción. Si algo falla, se revierte.
-- 3. No usa la palabra DEMO ni TEST en ningún lugar visible.
-- 4. No modifica estructura de tablas, RLS ni triggers.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECCIÓN: CATEGORÍAS (10 registros)
-- ============================================================================
INSERT INTO categorias (id, nombre, descripcion, activo) VALUES
  (gen_random_uuid(), 'Piñatas temáticas',    'Piñatas con diseños de personajes y figuras populares para todo tipo de fiestas', true),
  (gen_random_uuid(), 'Globos y decoración',  'Globos metálicos, pastel, arcos y cortinas decorativas para ambientación', true),
  (gen_random_uuid(), 'Dulces y sorpresas',   'Dulces surtidos, caramelos, chocolates y bolsas de sorpresas para invitados', true),
  (gen_random_uuid(), 'Velas y toppers',      'Velas numéricas, temáticas y toppers personalizados para pasteles', true),
  (gen_random_uuid(), 'Cotillón infantil',    'Kits de cotillón, gorritos, silbatos y accesorios para fiestas infantiles', true),
  (gen_random_uuid(), 'Decoración personalizada', 'Letreros, banners, centros de mesa y decoración hecha a medida', true),
  (gen_random_uuid(), 'Fondos para cumpleaños',   'Fondos decorativos y manteles para sesión de fotos y mesas principales', true),
  (gen_random_uuid(), 'Accesorios para fiesta',   'Coronas, antifaces, varitas y complementos para invitados', true),
  (gen_random_uuid(), 'Menaje descartable',       'Platos, vasos, cubiertos y manteles descartables temáticos', true),
  (gen_random_uuid(), 'Packs de cumpleaños',      'Packs completos básico y premium con todo incluido para la fiesta', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECCIÓN: PRODUCTOS (25 registros)
-- ============================================================================
WITH cat AS (SELECT id, nombre FROM categorias)
INSERT INTO productos (id, categoria_id, codigo, nombre, descripcion, precio_venta, stock_actual, stock_minimo, estado, activo)
SELECT
  gen_random_uuid(),
  (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-001', 'Piñata Dragon Ball',
  'Piñata de cartón con diseño de Goku, ideal para fiestas temáticas de Dragon Ball. Medidas: 60x40 cm.',
  75.00, 8, 3, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-002', 'Piñata Princesa',
  'Piñata con diseño de princesa clásica, corona y vestido brillante. Medidas: 55x38 cm.',
  68.00, 12, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-003', 'Piñata Spiderman',
  'Piñata de cartón con diseño de Spiderman en acción. Medidas: 58x42 cm.',
  72.00, 5, 3, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-004', 'Piñata Unicornio',
  'Piñata de unicornio con melena de colores y cuerno brillante. Medidas: 50x45 cm.',
  80.00, 6, 3, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-005', 'Piñata Minecraft',
  'Piñata con diseño de personaje Minecraft en bloques. Medidas: 55x40 cm.',
  70.00, 4, 2, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Piñatas temáticas'),
  'PIN-006', 'Piñata Frozen',
  'Piñata de Frozen con diseño de Elsa y Anna. Medidas: 52x38 cm.',
  75.00, 0, 3, 'agotado', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Globos y decoración'),
  'GLO-001', 'Globos metálicos x10',
  'Paquete de 10 globos metálicos color dorado y plateado, tamaño 30 cm.',
  18.50, 25, 10, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Globos y decoración'),
  'GLO-002', 'Globos pastel x25',
  'Paquete de 25 globos colores pastel surtidos, tamaño 25 cm. Ideal para decoración infantil.',
  22.00, 30, 10, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Globos y decoración'),
  'GLO-003', 'Arco de globos personalizado',
  'Arco decorativo de globos con colores a elección del cliente. Incluye instalación básica.',
  85.00, 3, 2, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Globos y decoración'),
  'GLO-004', 'Cortina metálica decorativa',
  'Cortina de láminas metálicas brillantes de 2x1.5 metros. Ideal para fondos de mesa.',
  35.00, 10, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Dulces y sorpresas'),
  'DUL-001', 'Bolsa de dulces surtidos',
  'Bolsa mediana con dulces surtidos: caramelos, chupetines, gomitas y bombones. Aprox. 500 g.',
  12.00, 40, 15, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Dulces y sorpresas'),
  'DUL-002', 'Caramelos frutales x100',
  'Bolsa de 100 caramelos sabor fruta. Variedad de colores y sabores.',
  8.50, 50, 20, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Dulces y sorpresas'),
  'DUL-003', 'Chocolates surtidos x50',
  'Caja con 50 chocolates surtidos: leche, blanco y rellenos. Presentación elegante.',
  25.00, 20, 8, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Velas y toppers'),
  'VEL-001', 'Vela número grande',
  'Vela con forma de número grande, tamaño 15 cm. Ideal para pasteles de cumpleaños.',
  15.00, 18, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Velas y toppers'),
  'VEL-002', 'Vela temática infantil',
  'Vela decorativa con diseño de personaje infantil. Variedad de modelos disponibles.',
  12.00, 0, 5, 'agotado', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Velas y toppers'),
  'TOP-001', 'Topper personalizado',
  'Topper decorativo personalizado con el nombre y edad del cumpleañero. Acrílico brillante.',
  18.00, 15, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Velas y toppers'),
  'TOP-002', 'Toppers Happy Birthday',
  'Set de 6 toppers con mensaje Happy Birthday. Diseño clásico dorado y plateado.',
  14.50, 22, 8, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Cotillón infantil'),
  'COT-001', 'Cotillón infantil x12',
  'Kit de cotillón para 12 invitados: gorritos, matasuegras, silbatos y pulseras.',
  28.00, 12, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Cotillón infantil'),
  'COT-002', 'Gorritos de fiesta x12',
  'Paquete de 12 gorritos de fiesta con diseño colorido y elástico ajustable.',
  10.00, 20, 8, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Cotillón infantil'),
  'COT-003', 'Silbatos infantiles x24',
  'Pack de 24 silbatos decorativos con diseños de animales y personajes.',
  7.50, 35, 10, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Fondos para cumpleaños'),
  'FON-001', 'Fondo decorativo cumpleaños',
  'Fondo decorativo de tela con diseño de "Feliz Cumpleaños". Medidas: 2x1.5 metros.',
  45.00, 7, 3, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Packs de cumpleaños'),
  'PAC-001', 'Pack cumpleaños básico',
  'Pack básico: piñata pequeña, 10 globos, bolsa de dulces, gorritos y vela numérica.',
  55.00, 6, 3, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Packs de cumpleaños'),
  'PAC-002', 'Pack cumpleaños premium',
  'Pack premium: piñata grande, 25 globos, cotillón x12, fondo decorativo, velas y toppers.',
  150.00, 0, 2, 'agotado', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Menaje descartable'),
  'MEN-001', 'Platos descartables temáticos',
  'Paquete de 24 platos descartables con diseño temático infantil. Tamaño mediano.',
  12.00, 15, 5, 'disponible', true
UNION ALL SELECT gen_random_uuid(), (SELECT id FROM cat WHERE nombre = 'Menaje descartable'),
  'MEN-002', 'Vasos descartables temáticos',
  'Paquete de 24 vasos descartables con diseño temático. Capacidad 250 ml.',
  10.50, 4, 5, 'disponible', false
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- SECCIÓN: CLIENTES (25 registros)
-- ============================================================================
INSERT INTO clientes (id, nombre, telefono, email, direccion, observaciones, activo)
VALUES
  (gen_random_uuid(), 'Ana Ramírez',       '987654321', 'ana.ramirez@example.com',    'Av. El Sol 124, San Miguel',        'Cliente frecuente de cumpleaños infantiles. Prefiere comunicación por WhatsApp.', true),
  (gen_random_uuid(), 'Luis Torres',       '976543210', 'luis.torres@example.com',     'Jr. Los Pinos 382, Miraflores',     'Compra packs completos para fiestas de sus hijos.', true),
  (gen_random_uuid(), 'Carla Mendoza',     '965432109', 'carla.mendoza@example.com',   'Urb. Santa Rosa Mz. B Lt. 12',      'Solicita decoraciones con anticipación para eventos familiares.', true),
  (gen_random_uuid(), 'Pedro Huamán',      '954321098', 'pedro.human@example.com',     'Av. Cultura 910, Cusco',            'Compra piñatas temáticas para cumpleaños de sus sobrinos.', true),
  (gen_random_uuid(), 'María López',       '943210987', 'maria.lopez@example.com',     'Calle Comercio 245, Arequipa',      'Cliente recurrente cada mes para fiestas de sus hijos gemelos.', true),
  (gen_random_uuid(), 'José Gutiérrez',    '932109876', 'jose.gutierrez@example.com',  'Av. Primavera 567, Surco',          'Empresario que organiza eventos infantiles corporativos.', true),
  (gen_random_uuid(), 'Rosa Flores',       '921098765', 'rosa.flores@example.com',     'Jr. Las Flores 123, Los Olivos',    'Le gusta comprar con anticipación y pagar con yape.', true),
  (gen_random_uuid(), 'Carlos Sánchez',    '910987654', 'carlos.sanchez@example.com',  'Av. Grau 789, Barranco',            'Compra cotillón y menaje para fiestas del colegio.', true),
  (gen_random_uuid(), 'Lucía Fernández',   '909876543', 'lucia.fernandez@example.com', 'Calle Real 456, Huancayo',          'Solicita pedidos personalizados con diseños únicos.', true),
  (gen_random_uuid(), 'Miguel Ángel Ruiz', '998765432', 'miguel.ruiz@example.com',     'Av. Central 321, San Juan de Lurigancho', 'Compra piñatas grandes para eventos familiares.', true),
  (gen_random_uuid(), 'Diana Paredes',     '987654123', 'diana.paredes@example.com',   'Jr. Las Palmeras 654, Chorrillos',  'Prefiere pagar con tarjeta y recoger en tienda.', true),
  (gen_random_uuid(), 'Fernando Castillo', '976543219', 'fernando.castillo@example.com', 'Urb. Los Jardines Mz. C Lt. 8',    'Compra packs premium para cumpleaños de sus hijas.', true),
  (gen_random_uuid(), 'Gabriela Vargas',   '965432198', 'gabriela.vargas@example.com', 'Av. La Marina 159, Pueblo Libre',   'Organiza fiestas temáticas y compra decoración completa.', true),
  (gen_random_uuid(), 'Ricardo Díaz',      '954321987', 'ricardo.diaz@example.com',    'Calle Los Olivos 852, San Isidro',  'Solicita arcos de globos y cortinas decorativas.', true),
  (gen_random_uuid(), 'Patricia Mendoza',  '943210876', 'patricia.mendoza@example.com', 'Jr. Las Begonias 321, Lince',      'Compra dulces y cotillón para fiestas del jardín.', true),
  (gen_random_uuid(), 'Jorge Ramos',       '932109765', 'jorge.ramos@example.com',     'Av. Arequipa 4567, Jesús María',    'Cliente nuevo, interesado en piñatas personalizadas.', true),
  (gen_random_uuid(), 'Silvia Torres',     '921098654', 'silvia.torres@example.com',   'Urb. Montecarlo E-15, La Molina',   'Compra fondos decorativos y velas temáticas.', true),
  (gen_random_uuid(), 'Andrés Núñez',      '910987543', 'andres.nunez@example.com',    'Calle Comercio 123, Trujillo',      'Solicita pedidos con anticipación para eventos familiares.', true),
  (gen_random_uuid(), 'Verónica Salazar',  '909876432', 'veronica.salazar@example.com', 'Av. Los Incas 789, Cusco',         'Cliente frecuente de globos y decoración.', true),
  (gen_random_uuid(), 'Héctor Pineda',     '998765321', 'hector.pineda@example.com',   'Jr. Las Magnolias 456, Surquillo',  'Compra piñatas y cotillón para fiestas de sus nietos.', true),
  (gen_random_uuid(), 'Mónica Guerrero',   '987654432', 'monica.guerrero@example.com',  'Av. El Ejército 234, Magdalena',    'Prefiere el pack premium para los cumpleaños de sus hijos.', true),
  (gen_random_uuid(), 'Roberto Vega',      '976543543', 'roberto.vega@example.com',    'Urb. La Floresta Mz. A Lt. 5',      'Compra menaje descartable y dulces para reuniones.', true),
  (gen_random_uuid(), 'Carmen Ríos',       '965432654', 'carmen.rios@example.com',     'Calle Las Camelias 567, San Borja', 'Solicita toppers personalizados para pasteles.', true),
  (gen_random_uuid(), 'Alberto Morales',   '954321765', 'alberto.morales@example.com', 'Av. Universitaria 890, Los Olivos',  'Compra arcos de globos para eventos empresariales.', true),
  (gen_random_uuid(), 'Elena Castro',      '943210876', 'elena.castro@example.com',    'Jr. Las Gardenias 234, Comas',      'Cliente recurrente de piñatas y globos.', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECCIÓN: VENTAS, DETALLE_VENTAS, PEDIDOS, PAGOS, MOVIMIENTOS
-- ============================================================================
-- Nota: Usamos CTEs para obtener los IDs de productos y clientes por código/email,
-- y luego construimos las ventas con sus detalles.
-- Las fechas se distribuyen en los últimos 30 días.
-- ============================================================================

DO $$
DECLARE
  -- Mapeo de códigos de producto a IDs
  prod_ids TEXT[];
  prod_codes TEXT[] := ARRAY['PIN-001','PIN-002','PIN-003','PIN-004','PIN-005','PIN-006','GLO-001','GLO-002','GLO-003','GLO-004','DUL-001','DUL-002','DUL-003','VEL-001','VEL-002','TOP-001','TOP-002','COT-001','COT-002','COT-003','FON-001','PAC-001','PAC-002','MEN-001','MEN-002'];
  p_id UUID;
  c_id UUID;

  -- Variables de venta
  v_id UUID;
  v_subtotal NUMERIC;
  v_total NUMERIC;
  v_fecha TIMESTAMPTZ;

  -- Contadores
  i INT := 0;
  det_count INT := 0;

  -- Para generar variedad
  rand_val INT;
  idx INT;
  metodo TEXT;
  estado_venta TEXT;
  cant INT;
  pu NUMERIC;

  -- Arrays de clientes y productos (IDs obtenidos)
  cliente_ids UUID[];
  producto_ids UUID[];
  producto_precios NUMERIC[];
  producto_codes TEXT[];

  r_pedido RECORD;
  r_venta RECORD;
  r_det RECORD;
BEGIN
  -- Obtener arrays de productos con sus IDs y precios
  SELECT array_agg(p.id ORDER BY p.codigo), array_agg(p.precio_venta ORDER BY p.codigo), array_agg(p.codigo ORDER BY p.codigo)
  INTO producto_ids, producto_precios, producto_codes
  FROM productos p
  WHERE p.codigo = ANY(prod_codes) AND p.stock_actual > 0;

  -- Obtener array de clientes activos
  SELECT array_agg(c.id ORDER BY c.nombre) INTO cliente_ids
  FROM clientes c WHERE c.activo = true;

  -- ==========================================================================
  -- VENTAS (25 registros)
  -- ==========================================================================
  FOR i IN 1..25 LOOP
    -- Fecha: distribuida en los últimos 30 días
    -- Últimos 7 días tienen más densidad
    IF i <= 10 THEN
      -- Últimos 7 días
      v_fecha := NOW() - (random() * 7 * INTERVAL '1 day');
    ELSIF i <= 18 THEN
      -- Entre 8 y 20 días atrás
      v_fecha := NOW() - ((8 + random() * 12) * INTERVAL '1 day');
    ELSE
      -- Entre 21 y 30 días atrás
      v_fecha := NOW() - ((21 + random() * 9) * INTERVAL '1 day');
    END IF;

    -- Redondear a hora comercial (8:00 - 20:00)
    v_fecha := date_trunc('day', v_fecha) + ((8 + floor(random() * 12))::INT || ' hours')::INTERVAL + (floor(random() * 60)::INT || ' minutes')::INTERVAL;

    -- Cliente aleatorio
    c_id := cliente_ids[1 + floor(random() * array_length(cliente_ids, 1))::INT];

    -- Método de pago
    rand_val := floor(random() * 6)::INT;
    metodo := CASE rand_val
      WHEN 0 THEN 'efectivo'
      WHEN 1 THEN 'yape'
      WHEN 2 THEN 'plin'
      WHEN 3 THEN 'tarjeta'
      WHEN 4 THEN 'transferencia'
      ELSE 'otro'
    END;

    -- Estado (mayoría completada, 2-3 anuladas)
    IF i IN (7, 15, 23) THEN
      estado_venta := 'anulada';
    ELSE
      estado_venta := 'completada';
    END IF;

    -- Crear venta (inicialmente con total 0, se actualizará después)
    INSERT INTO ventas (id, cliente_id, fecha_venta, subtotal, descuento, total, metodo_pago, estado, observaciones)
    VALUES (gen_random_uuid(), c_id, v_fecha, 0, 0, 0, metodo, estado_venta,
      CASE
        WHEN i = 1 THEN 'Compra recurrente para cumpleaños de su hijo.'
        WHEN i = 2 THEN 'Pago con yape, cliente satisfecho con la atención.'
        WHEN i = 3 THEN 'Compra de útiles para fiesta del colegio.'
        WHEN i = 4 THEN 'Cliente pidió recomendación y compró pack completo.'
        WHEN i = 5 THEN 'Compra rápida, recogió en tienda.'
        WHEN i = 6 THEN 'Solicitó factura para su empresa.'
        WHEN i = 7 THEN 'Cliente canceló el pedido por cambio de fecha.'
        WHEN i = 8 THEN 'Compra para cumpleaños de 5 años.'
        WHEN i = 9 THEN 'Pago con plin, entrega a domicilio.'
        WHEN i = 10 THEN 'Compra decoración completa para fiesta temática.'
        WHEN i = 11 THEN 'Compra de temporada por fin de mes.'
        WHEN i = 12 THEN 'Recomendación de cliente frecuente.'
        WHEN i = 13 THEN 'Compra corporativa para evento infantil.'
        WHEN i = 14 THEN 'Cliente nuevo, pagó con tarjeta.'
        WHEN i = 15 THEN 'Venta anulada por error en el pedido.'
        WHEN i = 16 THEN 'Compra de piñata y dulces para sobrino.'
        WHEN i = 17 THEN 'Pago con transferencia, entrega programada.'
        WHEN i = 18 THEN 'Cliente pidió surtido de productos para fiesta.'
        WHEN i = 19 THEN 'Compra de menaje descartable para reunión familiar.'
        WHEN i = 20 THEN 'Cliente frecuente, pagó con yape.'
        WHEN i = 21 THEN 'Compra de pack premium para cumpleaños.'
        WHEN i = 22 THEN 'Pago en efectivo, recogió el mismo día.'
        WHEN i = 23 THEN 'Anulada por falta de stock.'
        WHEN i = 24 THEN 'Compra de arco de globos para evento empresarial.'
        ELSE 'Cliente pidió decoración completa para cumpleaños de su hija.'
      END
    )
    RETURNING id INTO v_id;

    -- ========================================================================
    -- DETALLE VENTAS (1 a 4 productos por venta)
    -- ========================================================================
    v_subtotal := 0;
    det_count := 1 + floor(random() * 4)::INT;

    FOR det_i IN 1..det_count LOOP
      idx := 1 + floor(random() * array_length(producto_ids, 1))::INT;
      p_id := producto_ids[idx];
      pu := producto_precios[idx];

      SELECT stock_actual INTO cant FROM productos WHERE id = p_id;

      IF cant > 0 THEN
        cant := 1 + floor(random() * LEAST(5, cant))::INT;
        INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario)
        VALUES (gen_random_uuid(), v_id, p_id, cant, pu);
        v_subtotal := v_subtotal + (cant * pu);
      END IF;
    END LOOP;

    -- Si subtotal es 0 (no se pudo insertar ningún detalle), anular la venta
    IF v_subtotal = 0 THEN
      UPDATE ventas SET estado = 'anulada', observaciones = observaciones || ' Anulada automáticamente por falta de stock.' WHERE id = v_id;
      CONTINUE;
    END IF;

    -- Aplicar descuento aleatorio (0 o pequeño, sin superar el subtotal)
    IF v_subtotal >= 10 THEN
      rand_val := floor(random() * 3)::INT;
      IF rand_val = 1 THEN
        UPDATE ventas SET subtotal = v_subtotal, descuento = 5.00, total = v_subtotal - 5.00 WHERE id = v_id;
      ELSIF rand_val = 2 THEN
        UPDATE ventas SET subtotal = v_subtotal, descuento = 10.00, total = v_subtotal - 10.00 WHERE id = v_id;
      ELSE
        UPDATE ventas SET subtotal = v_subtotal, descuento = 0, total = v_subtotal WHERE id = v_id;
      END IF;
    ELSIF v_subtotal >= 5 THEN
      IF random() < 0.5 THEN
        UPDATE ventas SET subtotal = v_subtotal, descuento = 5.00, total = v_subtotal - 5.00 WHERE id = v_id;
      ELSE
        UPDATE ventas SET subtotal = v_subtotal, descuento = 0, total = v_subtotal WHERE id = v_id;
      END IF;
    ELSE
      UPDATE ventas SET subtotal = v_subtotal, descuento = 0, total = v_subtotal WHERE id = v_id;
    END IF;
  END LOOP;

  -- ==========================================================================
  -- PEDIDOS PERSONALIZADOS (25 registros)
  -- ==========================================================================
  FOR i IN 1..25 LOOP
    c_id := cliente_ids[1 + floor(random() * array_length(cliente_ids, 1))::INT];
    rand_val := floor(random() * 8)::INT;

    INSERT INTO pedidos_personalizados (id, cliente_id, codigo_pedido, tipo_pedido, descripcion, fecha_entrega, total, adelanto, estado, observaciones)
    VALUES (
      gen_random_uuid(),
      c_id,
      'PED-2026-' || LPAD(i::TEXT, 3, '0'),
      CASE rand_val
        WHEN 0 THEN 'Piñata personalizada'
        WHEN 1 THEN 'Decoración temática'
        WHEN 2 THEN 'Pack completo de cumpleaños'
        WHEN 3 THEN 'Fondo personalizado'
        WHEN 4 THEN 'Mesa decorativa'
        WHEN 5 THEN 'Topper personalizado'
        WHEN 6 THEN 'Arco de globos'
        ELSE 'Cotillón personalizado'
      END,
      CASE
        WHEN i = 1 THEN 'Piñata de Spiderman con detalles personalizados en colores rojo y azul. Incluye relleno de dulces.'
        WHEN i = 2 THEN 'Decoración temática de princesas para cumpleaños de 5 años. Incluye fondo, globos y centros de mesa.'
        WHEN i = 3 THEN 'Pack completo para cumpleaños de 30 invitados. Piñata, cotillón, dulces y decoración.'
        WHEN i = 4 THEN 'Fondo decorativo con letrero personalizado "Felices 7 años Diego".'
        WHEN i = 5 THEN 'Mesa decorativa temática de dinosaurios para cumpleaños infantil.'
        WHEN i = 6 THEN 'Topper acrílico personalizado con nombre y edad del cumpleañero.'
        WHEN i = 7 THEN 'Arco de globos arcoíris para entrada de local de eventos. 3 metros de ancho.'
        WHEN i = 8 THEN 'Cotillón personalizado para 20 invitados con bolsas de sorpresas individuales.'
        WHEN i = 9 THEN 'Piñata de Unicornio con detalles brillantes y crin de colores. Tamaño grande.'
        WHEN i = 10 THEN 'Decoración completa para baby shower con tonos pastel y detalles florales.'
        WHEN i = 11 THEN 'Pack temático de Minecraft para cumpleaños de 8 años. Incluye piñata y decoración.'
        WHEN i = 12 THEN 'Fondo decorativo con luces LED para sesión de fotos de cumpleaños.'
        WHEN i = 13 THEN 'Arco de globos con flores y detalles en dorado para 15 años.'
        WHEN i = 14 THEN 'Piñata personalizada de personaje favorito del cliente. Diseño exclusivo.'
        WHEN i = 15 THEN 'Mesa decorativa con temática de Frozen para cumpleaños de niña.'
        WHEN i = 16 THEN 'Topper personalizado con foto impresa para pastel de bodas.'
        WHEN i = 17 THEN 'Decoración de cumpleaños número 50 con colores elegantes.'
        WHEN i = 18 THEN 'Cotillón personalizado con logotipo de empresa para evento corporativo.'
        WHEN i = 19 THEN 'Pack completo para primera comunión. Decoración elegante y recuerdos.'
        WHEN i = 20 THEN 'Piñata de Dragon Ball con todos los detalles de Goku Ultra Instinct.'
        WHEN i = 21 THEN 'Arco de globos temático de Paw Patrol para cumpleaños infantil.'
        WHEN i = 22 THEN 'Fondo decorativo con nombre y edad para cumpleaños de 3 años.'
        WHEN i = 23 THEN 'Mesa decorativa temática de unicornios con centros de mesa personalizados.'
        WHEN i = 24 THEN 'Pack de cotillón y sorpresas para 50 invitados con bolsas individuales.'
        ELSE 'Piñata personalizada de Minecraft con detalles en pixel art y relleno de chocolates.'
      END,
      CASE
        WHEN i <= 3 THEN NOW() + (random() * 2 * INTERVAL '1 day')  -- Próximos días
        WHEN i <= 7 THEN NOW() + ((3 + random() * 4) * INTERVAL '1 day')  -- Esta semana
        WHEN i <= 12 THEN NOW() + ((7 + random() * 7) * INTERVAL '1 day')  -- Próxima semana
        WHEN i <= 18 THEN NOW() - (random() * 15 * INTERVAL '1 day')  -- Ya pasaron
        ELSE NOW() - ((15 + random() * 30) * INTERVAL '1 day')  -- Hace tiempo
      END,
      60 + floor(random() * 291)::INT,  -- Total entre 60 y 350
      0,  -- Adelanto se manejará con pagos
      CASE
        WHEN i <= 4 THEN 'pendiente'
        WHEN i <= 8 THEN 'en_proceso'
        WHEN i <= 12 THEN 'listo'
        WHEN i <= 20 THEN 'entregado'
        ELSE 'cancelado'
      END,
      CASE
        WHEN i = 1 THEN 'Cliente solicitó diseño personalizado con anticipación.'
        WHEN i = 5 THEN 'Pedido con varios cambios en el diseño original.'
        WHEN i = 10 THEN 'Cliente pidió incluir detalles adicionales de última hora.'
        WHEN i = 15 THEN 'Pedido entregado a tiempo, cliente satisfecho.'
        WHEN i = 20 THEN 'Diseño complejo requirió materiales especiales.'
        WHEN i = 22 THEN 'Cliente canceló por cambio de fecha del evento.'
        WHEN i = 23 THEN 'Se modificó el diseño después de la confirmación inicial.'
        WHEN i = 24 THEN 'Cliente pidió presupuesto adicional para más invitados.'
        ELSE 'Pedido gestionado con normalidad.'
      END
    )
    ON CONFLICT (codigo_pedido) DO NOTHING;
  END LOOP;

  -- ==========================================================================
  -- PAGOS DE PEDIDOS (entre 30 y 40 registros)
  -- ==========================================================================
  -- Obtener IDs de pedidos
  FOR r_pedido IN
    SELECT pp.id, pp.total, pp.codigo_pedido, pp.adelanto
    FROM pedidos_personalizados pp
    WHERE pp.estado != 'cancelado'
    ORDER BY random()
    LIMIT 30
  LOOP
    rand_val := floor(random() * 3)::INT;
    metodo := (ARRAY['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'])[1 + floor(random() * 5)::INT];

    IF rand_val = 0 THEN
      -- Sin pago (solo adelanto = 0)
      NULL;
    ELSIF rand_val = 1 THEN
      -- Adelanto parcial (50%)
      INSERT INTO pagos_pedido (id, pedido_id, monto, metodo_pago, observacion)
      VALUES (gen_random_uuid(), r_pedido.id, r_pedido.total * 0.5, metodo, 'Adelanto del 50% para iniciar el pedido.');
      UPDATE pedidos_personalizados SET adelanto = r_pedido.total * 0.5 WHERE id = r_pedido.id;
    ELSE
      -- Pago completo
      INSERT INTO pagos_pedido (id, pedido_id, monto, metodo_pago, observacion)
      VALUES (gen_random_uuid(), r_pedido.id, r_pedido.total, metodo, 'Pago completo del pedido.');
      UPDATE pedidos_personalizados SET adelanto = r_pedido.total WHERE id = r_pedido.id;
    END IF;
  END LOOP;

  -- Algunos pedidos con múltiples pagos (pago fraccionado)
  FOR r_pedido IN
    SELECT pp.id, pp.total FROM pedidos_personalizados pp
    WHERE pp.estado NOT IN ('cancelado', 'pendiente')
    ORDER BY random()
    LIMIT 5
  LOOP
    -- Primer pago (adelanto)
    INSERT INTO pagos_pedido (id, pedido_id, monto, metodo_pago, observacion)
    VALUES (gen_random_uuid(), r_pedido.id, r_pedido.total * 0.3, 'yape', 'Adelanto inicial del 30%.');
    -- Segundo pago (saldo)
    INSERT INTO pagos_pedido (id, pedido_id, monto, metodo_pago, observacion)
    VALUES (gen_random_uuid(), r_pedido.id, r_pedido.total * 0.7, 'efectivo', 'Pago de saldo pendiente al recoger el pedido.');
    UPDATE pedidos_personalizados SET adelanto = r_pedido.total WHERE id = r_pedido.id;
  END LOOP;

  -- ==========================================================================
  -- MOVIMIENTOS DE INVENTARIO (25 registros)
  -- ==========================================================================
  FOR i IN 1..25 LOOP
    idx := 1 + floor(random() * array_length(producto_ids, 1))::INT;
    p_id := producto_ids[idx];
    rand_val := floor(random() * 4)::INT;

    INSERT INTO movimientos_inventario (id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, observacion)
    VALUES (
      gen_random_uuid(),
      p_id,
      CASE rand_val
        WHEN 0 THEN 'entrada'
        WHEN 1 THEN 'entrada'
        WHEN 2 THEN 'ajuste'
        ELSE 'salida'
      END,
      5 + floor(random() * 30)::INT,
      floor(random() * 20)::INT,
      floor(random() * 30 + 5)::INT,
      'inventario',
      CASE rand_val
        WHEN 0 THEN 'Reposición de mercadería.'
        WHEN 1 THEN 'Ingreso por compra a proveedor.'
        WHEN 2 THEN 'Ajuste por conteo físico.'
        ELSE 'Salida por deterioro.'
      END
    );
  END LOOP;

  -- Movimientos de tipo 'venta' para algunas ventas recientes completadas
  FOR r_venta IN
    SELECT v.id FROM ventas v
    WHERE v.estado = 'completada'
    ORDER BY v.fecha_venta DESC
    LIMIT 10
  LOOP
    FOR r_det IN
      SELECT dv.producto_id, dv.cantidad FROM detalle_ventas dv WHERE dv.venta_id = r_venta.id
    LOOP
      INSERT INTO movimientos_inventario (id, producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, referencia_id, observacion)
      VALUES (
        gen_random_uuid(),
        r_det.producto_id,
        'venta',
        r_det.cantidad,
        0,  -- No tenemos el stock exacto anterior, pero el trigger lo habrá manejado
        0,
        'venta',
        r_venta.id,
        'Movimiento generado por venta.'
      );
    END LOOP;
  END LOOP;

END $$;

-- ============================================================================
-- DEPURACIÓN OPCIONAL DE DATOS PREVIOS
-- ============================================================================
-- DESCOMENTAR SOLO SI SE REQUIERE LIMPIAR DATOS DE CARGAS ANTERIORES.
-- Esta sección identifica registros específicos insertados durante cargas
-- previas y los desactiva (no los elimina permanentemente).
--
-- Instrucciones:
-- 1. Revisar los criterios antes de descomentar.
-- 2. Asegurarse de que los códigos/correos coincidan con los que se desea
--    desactivar.
-- 3. Ejecutar SOLO si hay datos de cargas anteriores que interfieran.
-- ============================================================================

-- -- Desactivar productos de cargas anteriores (ajustar códigos según sea necesario)
-- UPDATE productos
-- SET activo = false
-- WHERE codigo IN ('PIN-001', 'PIN-002', 'PIN-003', 'GLO-001', 'DUL-001')
--   AND activo = true;

-- -- Desactivar clientes de cargas anteriores (ajustar correos según sea necesario)
-- UPDATE clientes
-- SET activo = false
-- WHERE email IN ('cliente.anterior@example.com', 'usuario.antiguo@example.com')
--   AND activo = true;

-- -- Anular ventas de cargas anteriores
-- UPDATE ventas
-- SET estado = 'anulada'
-- WHERE observaciones LIKE '%Carga inicial%'
--   AND estado = 'completada';

-- -- Cancelar pedidos de cargas anteriores
-- UPDATE pedidos_personalizados
-- SET estado = 'cancelado'
-- WHERE codigo_pedido IN ('PED-001', 'PED-002')
--   AND estado NOT IN ('cancelado', 'entregado');

-- -- Desactivar movimientos de inventario de cargas anteriores
-- UPDATE movimientos_inventario
-- SET observacion = observacion || ' [Migrado]'
-- WHERE observacion LIKE '%Carga inicial%';

COMMIT;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Tablas alimentadas:
--   categorias, productos, clientes, ventas, detalle_ventas,
--   pedidos_personalizados, pagos_pedido, movimientos_inventario
-- ============================================================================
