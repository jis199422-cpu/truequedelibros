-- Seed data for GPS proximity testing
-- Reference point: Maipú, Mendoza (-32.948035, -68.814001)
-- Distances calculated with Haversine (1° lat ≈ 111 km, 1° lng ≈ 93.1 km at lat -33°)

INSERT INTO users (id, email, name, city, latitude, longitude, role, active, email_verified, premium, created_at, updated_at) VALUES
    ('10000001-0000-0000-0000-000000000001', 'seed1@test.local', 'Ana Rodríguez',    'Maipú',         -32.950, -68.813, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000002-0000-0000-0000-000000000002', 'seed2@test.local', 'Carlos Fernández', 'Godoy Cruz',    -32.920, -68.843, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000003-0000-0000-0000-000000000003', 'seed3@test.local', 'María González',   'Maipú',         -32.987, -68.784, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000004-0000-0000-0000-000000000004', 'seed4@test.local', 'Luis Martínez',    'Mendoza',       -32.889, -68.844, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000005-0000-0000-0000-000000000005', 'seed5@test.local', 'Sofía Díaz',       'Las Heras',     -32.834, -68.809, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000006-0000-0000-0000-000000000006', 'seed6@test.local', 'Diego Pérez',      'Luján de Cuyo', -33.068, -68.865, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000007-0000-0000-0000-000000000007', 'seed7@test.local', 'Valentina López',  'San Rafael',    -34.620, -68.330, 'USER', TRUE, TRUE, FALSE, NOW(), NOW()),
    ('10000008-0000-0000-0000-000000000008', 'seed8@test.local', 'Martín Herrera',   'Buenos Aires',  -34.610, -58.380, 'USER', TRUE, TRUE, FALSE, NOW(), NOW());

INSERT INTO books (id, owner_id, title, author, genre, book_condition, description, cover_image_url, status, created_at, updated_at) VALUES
    -- Ana Rodríguez — Maipú mismo barrio (~0.2 km)
    ('20000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001',
     'Rayuela', 'Julio Cortázar', 'Ficción', 'BUENO',
     'La novela más importante de Cortázar. Ejemplar en muy buen estado.',
     'https://placehold.co/300x450/6C63FF/white?text=Rayuela', 'AVAILABLE', NOW(), NOW()),
    ('20000002-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000001',
     'El túnel', 'Ernesto Sábato', 'Novela', 'NUEVO',
     'Edición reciente, sin uso. Historia de obsesión y soledad.',
     'https://placehold.co/300x450/FF6584/white?text=El+Tunel', 'AVAILABLE', NOW(), NOW()),

    -- Carlos Fernández — Godoy Cruz (~4.1 km)
    ('20000003-0000-0000-0000-000000000003', '10000002-0000-0000-0000-000000000002',
     'Ficciones', 'Jorge Luis Borges', 'Ficción', 'USADO',
     'Clásico de Borges. Algunas páginas subrayadas con lápiz.',
     'https://placehold.co/300x450/43B89C/white?text=Ficciones', 'AVAILABLE', NOW(), NOW()),
    ('20000004-0000-0000-0000-000000000004', '10000002-0000-0000-0000-000000000002',
     'Cien años de soledad', 'Gabriel García Márquez', 'Novela', 'BUENO',
     'Premio Nobel. Tapa dura, algunas marcas de uso menores.',
     'https://placehold.co/300x450/F7B731/white?text=Cien+Anos', 'AVAILABLE', NOW(), NOW()),

    -- María González — Maipú centro (~5.2 km)
    ('20000005-0000-0000-0000-000000000005', '10000003-0000-0000-0000-000000000003',
     'Boquitas pintadas', 'Manuel Puig', 'Novela', 'BUENO',
     'Folletín. Excelente estado, comprado en Feria del Libro.',
     'https://placehold.co/300x450/E056A8/white?text=Boquitas', 'AVAILABLE', NOW(), NOW()),
    ('20000006-0000-0000-0000-000000000006', '10000003-0000-0000-0000-000000000003',
     '1984', 'George Orwell', 'Ciencia Ficción', 'NUEVO',
     'Edición especial conmemorativa. Sin uso, plastificado.',
     'https://placehold.co/300x450/2C3E50/white?text=1984', 'AVAILABLE', NOW(), NOW()),

    -- Luis Martínez — Mendoza Capital (~7.1 km)
    ('20000007-0000-0000-0000-000000000007', '10000004-0000-0000-0000-000000000004',
     'El Aleph', 'Jorge Luis Borges', 'Ficción', 'BUENO',
     'Cuentos fantásticos de Borges. Tapa blanda, buen estado.',
     'https://placehold.co/300x450/8E44AD/white?text=El+Aleph', 'AVAILABLE', NOW(), NOW()),
    ('20000008-0000-0000-0000-000000000008', '10000004-0000-0000-0000-000000000004',
     'Respiración artificial', 'Ricardo Piglia', 'Novela', 'USADO',
     'Considerada la mejor novela de Piglia. Buen estado general.',
     'https://placehold.co/300x450/27AE60/white?text=Respiracion', 'AVAILABLE', NOW(), NOW()),
    ('20000009-0000-0000-0000-000000000009', '10000004-0000-0000-0000-000000000004',
     'Sobre héroes y tumbas', 'Ernesto Sábato', 'Novela', 'NUEVO',
     'Nueva edición con prólogo del autor. Sin estrenar.',
     'https://placehold.co/300x450/E74C3C/white?text=Heroes', 'AVAILABLE', NOW(), NOW()),

    -- Sofía Díaz — Las Heras (~12.7 km)
    ('20000010-0000-0000-0000-000000000010', '10000005-0000-0000-0000-000000000005',
     'Un mundo feliz', 'Aldous Huxley', 'Ciencia Ficción', 'BUENO',
     'Distopía clásica. Tapa blanda, subrayado en los primeros capítulos.',
     'https://placehold.co/300x450/3498DB/white?text=Mundo+Feliz', 'AVAILABLE', NOW(), NOW()),
    ('20000011-0000-0000-0000-000000000011', '10000005-0000-0000-0000-000000000005',
     'El nombre de la rosa', 'Umberto Eco', 'Policial', 'BUENO',
     'Novela histórica y policial. Muy buen estado.',
     'https://placehold.co/300x450/795548/white?text=Rosa', 'AVAILABLE', NOW(), NOW()),

    -- Diego Pérez — Luján de Cuyo (~14.1 km)
    ('20000012-0000-0000-0000-000000000012', '10000006-0000-0000-0000-000000000006',
     'Los siete locos', 'Roberto Arlt', 'Novela', 'USADO',
     'Edición vintage de los 70s. Algunas páginas amarillentas.',
     'https://placehold.co/300x450/FF7043/white?text=Siete+Locos', 'AVAILABLE', NOW(), NOW()),
    ('20000013-0000-0000-0000-000000000013', '10000006-0000-0000-0000-000000000006',
     'La traición de Rita Hayworth', 'Manuel Puig', 'Novela', 'NUEVO',
     'Primera novela de Puig. Recién comprada, sin leer.',
     'https://placehold.co/300x450/AB47BC/white?text=Rita+Hayworth', 'AVAILABLE', NOW(), NOW()),

    -- Valentina López — San Rafael (~191 km)
    ('20000014-0000-0000-0000-000000000014', '10000007-0000-0000-0000-000000000007',
     'El juguete rabioso', 'Roberto Arlt', 'Novela', 'BUENO',
     'Primera novela de Arlt. Muy buen estado, pocos años de uso.',
     'https://placehold.co/300x450/26A69A/white?text=Juguete', 'AVAILABLE', NOW(), NOW()),
    ('20000015-0000-0000-0000-000000000015', '10000007-0000-0000-0000-000000000007',
     'Frankenstein', 'Mary Shelley', 'Ciencia Ficción', 'BUENO',
     'Edición ilustrada. Tapa dura con pequeña raspadura.',
     'https://placehold.co/300x450/546E7A/white?text=Frankenstein', 'AVAILABLE', NOW(), NOW()),

    -- Martín Herrera — Buenos Aires (~990 km)
    ('20000016-0000-0000-0000-000000000016', '10000008-0000-0000-0000-000000000008',
     'El perfume', 'Patrick Süskind', 'Ficción', 'NUEVO',
     'Historia de un asesino. Edición de bolsillo nueva.',
     'https://placehold.co/300x450/FFC107/white?text=El+Perfume', 'AVAILABLE', NOW(), NOW()),
    ('20000017-0000-0000-0000-000000000017', '10000008-0000-0000-0000-000000000008',
     'La invasión', 'Ricardo Piglia', 'Ficción', 'USADO',
     'Cuentos de Piglia. Edición original de los 60s.',
     'https://placehold.co/300x450/EF5350/white?text=La+Invasion', 'AVAILABLE', NOW(), NOW()),
    ('20000018-0000-0000-0000-000000000018', '10000008-0000-0000-0000-000000000008',
     'El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Novela', 'BUENO',
     'García Márquez en su mejor forma. Tapa blanda, buen estado.',
     'https://placehold.co/300x450/42A5F5/white?text=Amor', 'AVAILABLE', NOW(), NOW());
