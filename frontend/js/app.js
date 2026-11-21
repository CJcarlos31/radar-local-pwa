import { SpatialAudioEngine } from "./spatial_audio.js";
import { AdaptiveViewer } from "./viewer_adaptive.js";
import { MapGpsController } from "./map_gps.js";

const API_URL = "http://127.0.0.1:5000/api/lugares";

const estado = {
    lat: 7.8382,
    lng: -72.5037,
    radioKm: 5,
    categoria: "todos",
    soloNuevos: false,
    texto: "",
    lugares: [],
    lugarActivo: null
};

const audioEngine = new SpatialAudioEngine();
const viewer = new AdaptiveViewer("visor-contenedor", audioEngine);
const mapCtrl = new MapGpsController("google-map", abrirDetalle);

async function cargarLugares() {
    const params = new URLSearchParams({
        lat: estado.lat,
        lng: estado.lng,
        radio_km: estado.radioKm,
        categoria: estado.categoria,
        solo_nuevos: String(estado.soloNuevos),
        q: estado.texto
    });

    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    estado.lugares = data.lugares || [];

    renderizarGrid(estado.lugares);
    renderizarCarruselMapa(estado.lugares);
    mapCtrl.renderizarMarcadores(estado.lugares);
}

function renderizarGrid(lugares) {
    const grid = document.getElementById("grid-lugares");
    const contador = document.getElementById("contador-resultados");
    grid.replaceChildren();
    contador.textContent = `${lugares.length} lugares`;

    lugares.forEach((lugar) => {
        const card = document.createElement("article");
        card.className = "place-card";
        card.addEventListener("click", () => abrirDetalle(lugar));

        const media = document.createElement("div");
        media.className = "card-media";

        const img = document.createElement("img");
        img.src = lugar.url_imagen;
        img.alt = lugar.nombre;
        img.loading = "lazy";

        const badge = document.createElement("span");
        badge.className = "card-badge";
        badge.textContent = lugar.es_nuevo ? "Nuevo" : lugar.ambiente;

        media.append(img, badge);

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h4");
        title.className = "card-title";
        title.textContent = lugar.nombre;

        const meta = document.createElement("p");
        meta.className = "card-meta";
        meta.textContent = `★ ${lugar.calificacion} · ${lugar.distancia_km} km`;

        body.append(title, meta);
        card.append(media, body);
        grid.appendChild(card);
    });
}

function renderizarCarruselMapa(lugares) {
    const carrusel = document.getElementById("carrusel-mapa");
    carrusel.replaceChildren();

    lugares.forEach((lugar) => {
        const card = document.createElement("article");
        card.className = "mini-map-card";
        card.addEventListener("click", () => abrirDetalle(lugar));

        const img = document.createElement("img");
        img.src = lugar.url_imagen;
        img.alt = lugar.nombre;

        const info = document.createElement("div");
        info.className = "mini-map-info";

        const title = document.createElement("h4");
        title.className = "card-title";
        title.textContent = lugar.nombre;

        const meta = document.createElement("p");
        meta.className = "card-meta";
        meta.textContent = `★ ${lugar.calificacion} · ${lugar.distancia_km} km`;

        info.append(title, meta);
        card.append(img, info);
        carrusel.appendChild(card);
    });
}

async function abrirDetalle(lugar) {
    estado.lugarActivo = lugar;
    document.getElementById("detalle-categoria").textContent = lugar.categoria.toUpperCase();
    document.getElementById("detalle-nombre").textContent = lugar.nombre;
    document.getElementById("detalle-rating").textContent = `★ ${lugar.calificacion} (${lugar.total_resenas})`;
    document.getElementById("detalle-distancia").textContent = `${lugar.distancia_km} km`;
    document.getElementById("detalle-ambiente").textContent = lugar.ambiente;
    document.getElementById("detalle-nuevo").textContent = lugar.es_nuevo ? "Recién abierto" : "Consolidado";
    document.getElementById("detalle-descripcion").textContent = lugar.descripcion;
    document.getElementById("btn-ruta-gps").href = `https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`;

    document.getElementById("vista-detalle").classList.remove("hidden");
    const modo = await viewer.cargar(lugar);
    document.getElementById("btn-modo-visor").textContent = modo === "3d" ? "Vista 3D (PC)" : "Vista 360°";
}

function cerrarDetalle() {
    audioEngine.detener();
    viewer.limpiar();
    document.getElementById("btn-audio-toggle").textContent = "🔇";
    document.getElementById("vista-detalle").classList.add("hidden");
}

function cambiarVista(nombreVista) {
    const explorar = document.getElementById("vista-explorar");
    const mapa = document.getElementById("vista-mapa");
    const esMapa = nombreVista === "mapa";

    explorar.classList.toggle("active", !esMapa);
    mapa.classList.toggle("active", esMapa);

    if (esMapa) {
        mapCtrl.inicializar(estado.lat, estado.lng);
        mapCtrl.renderizarMarcadores(estado.lugares);
    }
}

async function sincronizarGps() {
    try {
        const coords = await mapCtrl.obtenerGpsActual();
        estado.lat = coords.lat;
        estado.lng = coords.lng;
        mapCtrl.actualizarUbicacionUsuario(estado.lat, estado.lng);
        await cargarLugares();
    } catch (_) {
        await cargarLugares();
    }
}

function enlazarEventos() {
    document.getElementById("btn-abrir-radio").addEventListener("click", () => {
        document.getElementById("panel-radio").classList.toggle("hidden");
    });

    document.getElementById("slider-radio").addEventListener("input", (e) => {
        estado.radioKm = Number(e.target.value);
        document.getElementById("label-radio").textContent = `${estado.radioKm} km`;
        document.getElementById("mapa-radio-badge").textContent = `Radio: ${estado.radioKm} km`;
    });

    document.getElementById("slider-radio").addEventListener("change", cargarLugares);

    document.getElementById("input-busqueda").addEventListener("input", (e) => {
        estado.texto = e.target.value;
        cargarLugares();
    });

    document.getElementById("seg-todos").addEventListener("click", (e) => {
        estado.soloNuevos = false;
        e.target.classList.add("active");
        document.getElementById("seg-nuevos").classList.remove("active");
        cargarLugares();
    });

    document.getElementById("seg-nuevos").addEventListener("click", (e) => {
        estado.soloNuevos = true;
        e.target.classList.add("active");
        document.getElementById("seg-todos").classList.remove("active");
        cargarLugares();
    });

    document.querySelectorAll("#lista-categorias .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            document.querySelectorAll("#lista-categorias .chip").forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            estado.categoria = chip.dataset.cat;
            cargarLugares();
        });
    });

    document.getElementById("btn-toggle-vista").addEventListener("click", () => {
        const enMapa = document.getElementById("vista-mapa").classList.contains("active");
        cambiarVista(enMapa ? "explorar" : "mapa");
    });

    document.getElementById("btn-hero-mapa").addEventListener("click", () => cambiarVista("mapa"));
    document.getElementById("btn-gps-top").addEventListener("click", sincronizarGps);
    document.getElementById("btn-centrar-gps").addEventListener("click", sincronizarGps);
    document.getElementById("btn-cerrar-detalle").addEventListener("click", cerrarDetalle);

    document.getElementById("btn-modo-visor").addEventListener("click", async () => {
        if (!estado.lugarActivo) return;
        const nuevoModo = viewer.modoActual === "3d" ? "360" : "3d";
        const activo = await viewer.cargar(estado.lugarActivo, nuevoModo);
        document.getElementById("btn-modo-visor").textContent = activo === "3d" ? "Vista 3D (PC)" : "Vista 360°";
    });

    const alternarAudio = async () => {
        if (!estado.lugarActivo) return;
        if (audioEngine.activo) {
            audioEngine.detener();
            document.getElementById("btn-audio-toggle").textContent = "🔇";
            return;
        }
        const ok = await audioEngine.iniciar(
            estado.lugarActivo.url_audio_ambiente,
            estado.lugarActivo.audio_x,
            estado.lugarActivo.audio_y,
            estado.lugarActivo.audio_z
        );
        if (ok) {
            document.getElementById("btn-audio-toggle").textContent = "🔊";
        }
    };

    document.getElementById("btn-audio-toggle").addEventListener("click", alternarAudio);
    document.getElementById("btn-activar-audio-cta").addEventListener("click", alternarAudio);

    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const destino = btn.dataset.nav;
            if (destino === "mapa") {
                cambiarVista("mapa");
            } else if (destino === "nuevos") {
                estado.soloNuevos = true;
                document.getElementById("seg-nuevos").classList.add("active");
                document.getElementById("seg-todos").classList.remove("active");
                cambiarVista("explorar");
                cargarLugares();
            } else {
                cambiarVista("explorar");
            }
        });
    });
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
}

enlazarEventos();
sincronizarGps();