import imageCompression from 'browser-image-compression';

/**
 * Detecta si el navegador actual es iOS Safari (iPhone/iPad).
 * Necesario porque iOS Safari tiene restricciones con Web Workers
 * que causan que browser-image-compression produzca Blobs vacíos (0 bytes).
 */
function esIOSSafari(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    // Detectar iOS: iPhone, iPad, iPod, o iPad con Desktop mode (Mac + touch)
    const esIOS = /iPhone|iPad|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return esIOS;
}

export async function comprimirImagen(archivo: File): Promise<File> {
    let archivoAProcesar = archivo;

    try {
        // 1. DETECCIÓN DE HEIC/HEIF
        const nombreArchivo = archivo.name.toLowerCase();
        const tipoArchivo = archivo.type.toLowerCase();

        // En iOS, a veces el type viene vacío para HEIC
        const esHeic = tipoArchivo === 'image/heic' ||
            tipoArchivo === 'image/heif' ||
            nombreArchivo.endsWith('.heic') ||
            nombreArchivo.endsWith('.heif') ||
            (tipoArchivo === '' && esIOSSafari()); // iOS a veces envía tipo vacío para HEIC

        // 2. CONVERSIÓN HEIC → JPEG (Solo si es necesario)
        if (esHeic) {
            console.log("Formato HEIC/HEIF detectado, convirtiendo a JPEG...");

            try {
                // IMPORTACIÓN DINÁMICA: Evita el error "window is not defined" en SSR
                const heic2any = (await import('heic2any')).default;

                const blobConvertido = await heic2any({
                    blob: archivo,
                    toType: 'image/jpeg',
                    quality: 0.8
                });

                const blobFinal = Array.isArray(blobConvertido) ? blobConvertido[0] : blobConvertido;

                // Validar que la conversión produjo datos
                if (blobFinal && blobFinal.size > 0) {
                    const nuevoNombre = archivo.name.replace(/\.(heic|heif)$/i, '.jpg');
                    archivoAProcesar = new File([blobFinal], nuevoNombre, { type: 'image/jpeg' });
                } else {
                    console.warn("heic2any produjo un blob vacío, usando archivo original");
                }
            } catch (heicError) {
                console.warn("heic2any falló, usando archivo original:", heicError);
                // Continuar con el archivo original — iOS Safari a veces ya convierte a JPEG
            }
        }

        // 3. COMPRESIÓN
        // CRÍTICO: useWebWorker DEBE ser false en iOS Safari.
        // En iOS Safari, los Web Workers tienen restricciones de memoria que causan
        // que browser-image-compression produzca Blobs vacíos (0 bytes).
        const usarWebWorker = !esIOSSafari();

        const opciones = {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1280,
            useWebWorker: usarWebWorker,
            fileType: 'image/jpeg' as const,
        };

        console.log(`Comprimiendo imagen: ${archivoAProcesar.name} (${(archivoAProcesar.size / 1024).toFixed(1)}KB), WebWorker: ${usarWebWorker}`);

        const archivoComprimido = await imageCompression(archivoAProcesar, opciones);

        // 4. VALIDACIÓN POST-COMPRESIÓN: Verificar que el resultado no esté vacío
        if (!archivoComprimido || archivoComprimido.size === 0) {
            console.error("browser-image-compression produjo un archivo vacío. Retornando original.");
            // Retornar el archivo original con tipo JPEG explícito
            return new File([archivoAProcesar], archivoAProcesar.name, { type: 'image/jpeg' });
        }

        console.log(`Compresión exitosa: ${(archivoComprimido.size / 1024).toFixed(1)}KB`);

        // Asegurar que el File resultante tenga MIME type explícito
        return new File([archivoComprimido], archivoAProcesar.name, { type: 'image/jpeg' });

    } catch (error) {
        console.error("Error crítico procesando la imagen:", error);
        // Fallback: retornar el archivo con tipo explícito
        return new File([archivoAProcesar], archivoAProcesar.name, {
            type: archivoAProcesar.type || 'image/jpeg'
        });
    }
}

export function generarCodigoTrazabilidad(nombreFeria: string, nombreProducto: string) {
    const prefix = nombreFeria.substring(0, 3).toUpperCase();
    const prod = nombreProducto.substring(0, 3).toUpperCase();
    const tsMillis = Date.now().toString().slice(-5);
    return `${prefix}-${prod}-${tsMillis}`;
}