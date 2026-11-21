export class SpatialAudioEngine {
    constructor() {
        this.ctx = null;
        this.panner = null;
        this.source = null;
        this.gain = null;
        this.activo = false;
    }

    async iniciar(urlAudio, posX, posY, posZ) {
        this.detener();
        if (!urlAudio) return false;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        if (this.ctx.state === "suspended") {
            await this.ctx.resume();
        }

        const resp = await fetch(urlAudio);
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

        this.source = this.ctx.createBufferSource();
        this.source.buffer = audioBuffer;
        this.source.loop = true;

        this.panner = this.ctx.createPanner();
        this.panner.panningModel = "HRTF";
        this.panner.distanceModel = "inverse";
        this.panner.refDistance = 1.5;
        this.panner.maxDistance = 18;
        this.panner.rolloffFactor = 1.8;
        this.panner.positionX.value = posX;
        this.panner.positionY.value = posY;
        this.panner.positionZ.value = posZ;

        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.85;

        this.source.connect(this.panner);
        this.panner.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.source.start(0);
        this.activo = true;
        return true;
    }

    actualizarOyente3D(x, y, z, forwardX, forwardY, forwardZ) {
        if (!this.ctx || !this.activo) return;
        const l = this.ctx.listener;
        l.positionX.value = x;
        l.positionY.value = y;
        l.positionZ.value = z;
        l.forwardX.value = forwardX;
        l.forwardY.value = forwardY;
        l.forwardZ.value = forwardZ;
        l.upX.value = 0;
        l.upY.value = 1;
        l.upZ.value = 0;
    }

    actualizarOrientacion360(yawGrados) {
        const rad = (yawGrados * Math.PI) / 180;
        const fx = Math.sin(rad);
        const fz = -Math.cos(rad);
        this.actualizarOyente3D(0, 1.5, 0, fx, 0, fz);
    }

    detener() {
        if (this.source) {
            try { this.source.stop(); } catch (_) {}
            this.source.disconnect();
            this.source = null;
        }
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.activo = false;
    }
}