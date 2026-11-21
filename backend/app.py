from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from db import get_connection
from security import validar_busqueda, aplicar_cabeceras_seguridad

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": [Config.ALLOWED_ORIGIN]}})

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["120 per minute"]
)

app.after_request(aplicar_cabeceras_seguridad)

@app.route("/api/lugares", methods=["GET"])
@limiter.limit("45 per minute")
@validar_busqueda
def listar_lugares():
    f = request.filtros
    sql = """
        SELECT
            id, nombre, categoria, descripcion, ambiente,
            calificacion, total_resenas, precio_promedio, es_nuevo,
            fecha_apertura, direccion, url_imagen,
            url_pano_movil, url_splat_pc, url_audio_ambiente,
            audio_x, audio_y, audio_z,
            ST_Y(ubicacion::geometry) AS lat,
            ST_X(ubicacion::geometry) AS lng,
            ROUND((ST_Distance(
                ubicacion,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
            ) / 1000.0)::numeric, 2) AS distancia_km
        FROM negocios
        WHERE activo = TRUE
          AND ST_DWithin(
              ubicacion,
              ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
              %s
          )
    """
    params = [f["lng"], f["lat"], f["lng"], f["lat"], f["radio_metros"]]

    if f["categoria"] != "todos":
        sql += " AND categoria = %s"
        params.append(f["categoria"])

    if f["solo_nuevos"]:
        sql += " AND es_nuevo = TRUE"

    if f["texto"]:
        sql += " AND (nombre ILIKE %s OR descripcion ILIKE %s)"
        patron = f"%{f['texto']}%"
        params.extend([patron, patron])

    sql += " ORDER BY distancia_km ASC LIMIT 40"

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(sql, params)
            resultados = cur.fetchall()
        return jsonify({"lugares": resultados}), 200
    except Exception:
        return jsonify({"error": "Error interno consultando lugares"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)