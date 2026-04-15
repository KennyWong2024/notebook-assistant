import imageCompression from 'browser-image-compression';

export async function comprimirImagen(archivo: File): Promise<File> {
    let archivoAProcesar = archivo;

    try {
        // 1. DETECCIÓN
        const nombreArchivo = archivo.name.toLowerCase();
        const esHeic = archivo.type === 'image/heic' ||
            archivo.type === 'image/heif' ||
            nombreArchivo.endsWith('.heic') ||
            nombreArchivo.endsWith('.heif');

        // 2. CONVERSIÓN (Solo si es de Apple)
        if (esHeic) {
            console.log("Formato HEIC detectado, traduciendo a JPEG...");

            // IMPORTACIÓN DINÁMICA: Evita el error "window is not defined" en SSR
            const heic2any = (await import('heic2any')).default;

            const blobConvertido = await heic2any({
                blob: archivo,
                toType: 'image/jpeg',
                quality: 0.8
            });

            const blobFinal = Array.isArray(blobConvertido) ? blobConvertido[0] : blobConvertido;
            const nuevoNombre = archivo.name.replace(/\.(heic|heif)$/i, '.jpg');
            archivoAProcesar = new File([blobFinal], nuevoNombre, { type: 'image/jpeg' });
        }

        // 3. COMPRESIÓN
        const opciones = {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
            fileType: 'image/jpeg' as const,
        };

        const archivoComprimido = await imageCompression(archivoAProcesar, opciones);
        return new File([archivoComprimido], archivoAProcesar.name, { type: 'image/jpeg' });

    } catch (error) {
        console.error("Error crítico procesando la imagen:", error);
        return archivoAProcesar;
    }
}

export function generarCodigoTrazabilidad(nombreFeria: string, nombreProducto: string) {
    const prefix = nombreFeria.substring(0, 3).toUpperCase();
    const prod = nombreProducto.substring(0, 3).toUpperCase();
    const tsMillis = Date.now().toString().slice(-5);
    return `${prefix}-${prod}-${tsMillis}`;
}