import imageCompression from 'browser-image-compression';

export async function comprimirImagen(archivo: File) {
    const opciones = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
    };

    try {
        return await imageCompression(archivo, opciones);
    } catch (error) {
        console.error("Error comprimiendo imagen:", error);
        return archivo;
    }
}

export function generarCodigoTrazabilidad(nombreFeria: string, nombreProducto: string) {
    const prefix = nombreFeria.substring(0, 3).toUpperCase();
    const prod = nombreProducto.substring(0, 3).toUpperCase();
    const tsMillis = Date.now().toString().slice(-5);
    return `${prefix}-${prod}-${tsMillis}`;
}