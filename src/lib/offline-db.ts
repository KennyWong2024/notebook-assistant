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
    id_local: string;
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
    catalogos_cache: {
        key: string;
        value: any;
    };
    proveedores_descubiertos: {
        key: string;
        value: any;
        indexes: { 'timestamp': number };
    };
    productos_recientes: {
        key: string;
        value: any;
        indexes: { 'timestamp': number };
    };
}

let dbPromise: Promise<IDBPDatabase<SourcingOfflineDB>> | null = null;

function initDB() {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = openDB<SourcingOfflineDB>('sourcing_offline', 2, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    const store = db.createObjectStore('prospectos_pendientes', { keyPath: 'id_local' });
                    store.createIndex('timestamp', 'timestamp');
                }
                if (oldVersion < 2) {
                    db.createObjectStore('catalogos_cache');
                    const storeProv = db.createObjectStore('proveedores_descubiertos', { keyPath: 'id' });
                    storeProv.createIndex('timestamp', 'timestamp');
                    const storeProd = db.createObjectStore('productos_recientes', { keyPath: 'id' });
                    storeProd.createIndex('timestamp', 'timestamp');
                }
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

// ==== MASTER REPLICA (WORKING SET) ==== //

export async function syncCatalogoLocal(key: string, data: any) {
    const db = await initDB();
    if (!db) return;
    await db.put('catalogos_cache', data, key);
}

export async function getCatalogoLocal(key: string) {
    const db = await initDB();
    if (!db) return null;
    return db.get('catalogos_cache', key);
}

export async function insertMultiple(storeName: 'proveedores_descubiertos' | 'productos_recientes', items: any[]) {
    const db = await initDB();
    if (!db) return;
    const tx = db.transaction(storeName, 'readwrite');
    for (const item of items) {
        tx.store.put(item);
    }
    await tx.done;
}

export async function getAllLocals(storeName: 'proveedores_descubiertos' | 'productos_recientes') {
    const db = await initDB();
    if (!db) return [];
    return db.getAll(storeName);
}

export async function cleanOld14Days() {
    const db = await initDB();
    if (!db) return;
    const cutoff = Date.now() - (14 * 24 * 60 * 60 * 1000);
    
    for (const store of ['proveedores_descubiertos', 'productos_recientes'] as const) {
        const tx = db.transaction(store, 'readwrite');
        const index = tx.store.index('timestamp');
        let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }
        await tx.done;
    }
}
