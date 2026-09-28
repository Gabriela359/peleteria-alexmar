-- ============================================================
-- Datos iniciales: tipos de producto + catálogo de ejemplo.
-- A diferencia del prototipo (que inventaba 44 días de ventas para
-- la demo), aquí NO se siembran ventas/movimientos falsos — en una
-- app real esos se van a generar solos con el uso. Corre esto una
-- vez, después de las migraciones, para no arrancar con el
-- inventario vacío.
-- ============================================================

insert into public.tipos_producto (nombre, con_talla) values
  ('Suelas', true), ('Plantillas', true), ('Tacones', true),
  ('Pegantes', false), ('Hilos y adornos', false), ('Herrajes', false),
  ('Cordones', false), ('Insumos', false)
on conflict (nombre) do nothing;

insert into public.productos (ref, nombre, tipo, unidad, color, precio, costo, min, tallas, stock) values
  ('SU-101', 'Suela Clásica Ranger', 'Suelas', 'par', 'Negro', 28000, 18500, 12, '{"38":24,"39":30,"40":28,"41":22,"42":16,"43":9,"44":6}', 0),
  ('SU-204', 'Suela Urbana Flex', 'Suelas', 'par', 'Café', 34500, 22000, 10, '{"38":14,"39":18,"40":20,"41":12,"42":8,"43":5}', 0),
  ('SU-310', 'Suela Bota Andina', 'Suelas', 'par', 'Negro', 41000, 27000, 8, '{"39":10,"40":12,"41":9,"42":7,"43":4,"44":3}', 0),
  ('SU-415', 'Suela Dama Confort', 'Suelas', 'par', 'Beige', 26500, 16000, 12, '{"34":16,"35":22,"36":26,"37":20,"38":14,"39":8}', 0),
  ('SU-520', 'Suela Deportiva Air', 'Suelas', 'par', 'Blanco', 38000, 24500, 10, '{"36":6,"37":9,"38":11,"39":13,"40":10,"41":7,"42":4}', 0),
  ('SU-630', 'Suela Colegial Fuerte', 'Suelas', 'par', 'Negro', 23000, 14000, 15, '{"32":18,"33":20,"34":24,"35":22,"36":17,"37":11}', 0),
  ('SU-712', 'Suela Trabajo Pesado', 'Suelas', 'par', 'Negro', 45000, 30000, 8, '{"39":8,"40":11,"41":10,"42":8,"43":5}', 0),
  ('PL-120', 'Plantilla Memory Foam', 'Plantillas', 'par', 'Gris', 12000, 6500, 20, '{"35":18,"36":22,"37":25,"38":24,"39":19,"40":15,"41":11}', 0),
  ('PL-240', 'Plantilla Cuero Natural', 'Plantillas', 'par', 'Miel', 16500, 9000, 15, '{"36":12,"37":16,"38":14,"39":10,"40":7}', 0),
  ('TC-310', 'Tacón Bloque 5 cm', 'Tacones', 'par', 'Negro', 14500, 8200, 12, '{"35":9,"36":14,"37":16,"38":12,"39":6}', 0),
  ('PG-010', 'Pegante amarillo x 1 galón', 'Pegantes', 'unidad', 'Ámbar', 62000, 44000, 6, '{}', 14),
  ('PG-025', 'Pegante blanco x 1/4', 'Pegantes', 'unidad', 'Blanco', 19000, 12500, 8, '{}', 23),
  ('HL-400', 'Hilo encerado 100 m', 'Hilos y adornos', 'unidad', 'Negro', 8500, 4600, 20, '{}', 46),
  ('HR-505', 'Hebilla metálica dorada', 'Herrajes', 'unidad', 'Dorado', 3200, 1500, 40, '{}', 128),
  ('CH-088', 'Cordón plano 120 cm', 'Cordones', 'unidad', 'Negro', 4500, 2100, 30, '{}', 12),
  ('HM-700', 'Lija para desbaste', 'Insumos', 'unidad', '—', 5500, 2800, 15, '{}', 34)
on conflict (ref) do nothing;
