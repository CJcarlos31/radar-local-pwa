export class AdaptiveViewer {
    constructor(containerId, audioEngine) {
        this.container = document.getElementById(containerId);
        this.audioEngine = audioEngine;
        this.pannellumInstance = null;
        this.splatViewer = null;
        this.rafId = null;
        this.modoActual = "360";
    }

    esMovil() {
        return window.matchMedia("(max-width: 768px)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
    }

    limpiar() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.pannellumInstance) {
            this.pannellumInstance.destroy();
            this.pannellumInstance = null;
        }
        if (this.splatViewer && typeof this.splatViewer.dispose === "function") {
            this.splatViewer.dispose();
            this.splatViewer = null;
        }
        this.container.replaceChildren();
    }

    async cargar(lugar, forzarModo = null) {
        this.limpiar();
        const usar3D = forzarModo ? forzarModo === "3d" : !this.esMovil();
        this.modoActual = usar3D ? "3d" : "360";

        if (usar3D && lugar.url_splat_pc) {
            await this.iniciarGaussianSplat(lugar.url_splat_pc);
        } else {
            this.iniciarPannellum(lugar.url_pano_movil || lugar.url_imagen);
        }
        return this.modoActual;
    }

    iniciarPannellum(urlPano) {
        if (!window.pannellum) return;
        this.pannellumInstance = window.pannellum.viewer(this.container.id, {
            type: "equirectangular",
            panorama: urlPano,
            autoLoad: true,
            showControls: false
        });

        const loopAudio = () => {
            if (this.pannellumInstance && this.audioEngine.activo) {
                this.audioEngine.actualizarOrientacion360(this.pannellumInstance.getYaw());
            }
            this.rafId = requestAnimationFrame(loopAudio);
        };
        this.rafId = requestAnimationFrame(loopAudio);
    }

    async iniciarGaussianSplat(urlSplat) {
        try {
            const GaussianSplats3D = await import("https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@0.4.6/build/gaussian-splats-3d.module.min.js");
            this.splatViewer = new GaussianSplats3D.Viewer({
                rootElement: this.container,
                initialCameraPosition: [0, 1.5, 4],
                initialCameraLookAt: [0, 1.5, 0],
                sharedMemoryForWorkers: false
            });
            await this.splatViewer.addSplatScene(urlSplat);
            this.splatViewer.start();

            const loop3D = () => {
                if (this.splatViewer && this.splatViewer.camera && this.audioEngine.activo) {
                    const cam = this.splatViewer.camera;
                    const p = cam.position;
                    this.audioEngine.actualizarOyente3D(p.x, p.y, p.z, 0, 0, -1);
                }
                this.rafId = requestAnimationFrame(loop3D);
            };
            this.rafId = requestAnimationFrame(loop3D);
        } catch (_) {
            this.modoActual = "360";
            this.iniciarPannellum(urlSplat);
        }
    }
}