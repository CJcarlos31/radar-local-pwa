export class MapGpsController {
    constructor(mapElementId, onSelectLugar) {
        this.mapElementId = mapElementId;
        this.onSelectLugar = onSelectLugar;
        this.map = null;
        this.marcadores = [];
        this.marcadorUsuario = null;
    }

    inicializar(lat, lng) {
        if (!window.google || !window.google.maps || this.map) return;
        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            center: { lat, lng },
            zoom: 14,
            disableDefaultUI: true
        });
        this.actualizarUbicacionUsuario(lat, lng);
    }

    actualizarUbicacionUsuario(lat, lng) {
        if (!this.map) return;
        const pos = { lat, lng };
        this.map.setCenter(pos);
        if (this.marcadorUsuario) {
            this.marcadorUsuario.setPosition(pos);
        } else {
            this.marcadorUsuario = new google.maps.Marker({
                position: pos,
                map: this.map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: "#c026d3",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3
                }
            });
        }
    }

    renderizarMarcadores(lugares) {
        if (!this.map) return;
        this.marcadores.forEach((m) => m.setMap(null));
        this.marcadores = [];

        lugares.forEach((lugar) => {
            const marker = new google.maps.Marker({
                position: { lat: Number(lugar.lat), lng: Number(lugar.lng) },
                map: this.map,
                title: lugar.nombre
            });
            marker.addListener("click", () => this.onSelectLugar(lugar));
            this.marcadores.push(marker);
        });
    }

    obtenerGpsActual() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("GPS no soportado"));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }
}