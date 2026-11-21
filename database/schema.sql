CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE negocios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(40) NOT NULL CHECK (categoria IN ('entretenimiento', 'cafes', 'restaurantes', 'miradores', 'tiendas')),
    descripcion TEXT NOT NULL,
    ambiente VARCHAR(40) NOT NULL,
    calificacion NUMERIC(2,1) DEFAULT 4.5 CHECK (calificacion >= 0 AND calificacion <= 5),
    total_resenas INTEGER DEFAULT 0 CHECK (total_resenas >= 0),
    precio_promedio INTEGER DEFAULT 0 CHECK (precio_promedio >= 0),
    es_nuevo BOOLEAN DEFAULT TRUE,
    fecha_apertura DATE NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
    url_imagen TEXT NOT NULL,
    url_pano_movil TEXT NOT NULL,
    url_splat_pc TEXT NOT NULL,
    url_audio_ambiente TEXT,
    audio_x REAL DEFAULT 0.0,
    audio_y REAL DEFAULT 1.5,
    audio_z REAL DEFAULT -3.5,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_negocios_ubicacion ON negocios USING GIST (ubicacion);
CREATE INDEX idx_negocios_categoria ON negocios (categoria);
CREATE INDEX idx_negocios_nuevo ON negocios (es_nuevo);