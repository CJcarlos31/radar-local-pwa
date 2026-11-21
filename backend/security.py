from functools import wraps
from flask import request, jsonify

CATEGORIAS_VALIDAS = {"todos", "entretenimiento", "cafes", "restaurantes", "miradores", "tiendas"}

def validar_busqueda(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            lat = float(request.args.get("lat", 7.8382))
            lng = float(request.args.get("lng", -72.5037))
            radio_km = float(request.args.get("radio_km", 5.0))
        except ValueError:
            return jsonify({"error": "Parámetros geográficos inválidos"}), 400

        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            return jsonify({"error": "Coordenadas fuera de rango"}), 400

        if not (0.5 <= radio_km <= 50.0):
            return jsonify({"error": "El radio debe estar entre 0.5 y 50 km"}), 400

        categoria = request.args.get("categoria", "todos").strip().lower()
        if categoria not in CATEGORIAS_VALIDAS:
            return jsonify({"error": "Categoría no permitida"}), 400

        solo_nuevos = request.args.get("solo_nuevos", "false").lower() == "true"
        texto = request.args.get("q", "").strip()[:60]

        request.filtros = {
            "lat": lat,
            "lng": lng,
            "radio_metros": radio_km * 1000.0,
            "categoria": categoria,
            "solo_nuevos": solo_nuevos,
            "texto": texto
        }
        return f(*args, **kwargs)
    return wrapper

def aplicar_cabeceras_seguridad(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self)"
    return response