import { openDB, DBSchema, IDBPDatabase } from 'idb';


export interface ProductoOffline {
    nombre_rapido: string;
    precio_referencia?: number;
    moneda: string;
    descripcion_libre?: string;
    prioridad?: number;
    fotos: Blob[];
}

export interface ProspectoOffline {
    id_local: string; // uuid generado localmente
    nombre_empresa: string;
    email_contacto: string;
    id_feria: string;
    nombre_feria: string;
    notas_generales: string;
    creado_por: string;
    
    productos: ProductoOffline[];
    
    foto_tarjeta?: Blob;
    fotos_stand: Blob[];
    
    timestamp: number;
    estado_subida: 'pendiente' | 'error';
    intento: number;
}

interface SourcingOfflineDB extends DBSchema {
    prospectos_pendientes: {
        key: string;
        value: ProspectoOffline;
        indexes: { 'timestamp': number };
    };
}

let dbPromise: Promise<IDBPDatabase<SourcingOfflineDB>> | null = null;

function initDB() {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = openDB<SourcingOfflineDB>('sourcing_offline', 1, {
            upgrade(db) {
                const store = db.createObjectStore('prospectos_pendientes', {
                    keyPath: 'id_local',
                });
                store.createIndex('timestamp', 'timestamp');
            },
        });
    }
    return dbPromise;
}

export async function guardarProspectoLocal(prospecto: Omit<ProspectoOffline, 'estado_subida' | 'intento'>) {
    const db = await initDB();
    if (!db) throw new Error("IndexedDB no disponible en SSR");
    await db.put('prospectos_pendientes', { 
        ...prospecto, 
        estado_subida: 'pendiente', 
        intento: 0 
    });
}

export async function obtenerProspectosPendientes(): Promise<ProspectoOffline[]> {
    const db = await initDB();
    if (!db) return [];
    return db.getAllFromIndex('prospectos_pendientes', 'timestamp');
}

export async function eliminarProspectoLocal(id_local: string) {
    const db = await initDB();
    if (!db) return;
    await db.delete('prospectos_pendientes', id_local);
}

export async function marcarErrorProspectoLocal(id_local: string) {
    const db = await initDB();
    if (!db) return;
    const item = await db.get('prospectos_pendientes', id_local);
    if (item) {
        item.estado_subida = 'error';
        item.intento += 1;
        await db.put('prospectos_pendientes', item);
    }
}
