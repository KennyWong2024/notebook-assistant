"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { syncCatalogoLocal, insertMultiple, cleanOld14Days } from "@/lib/offline-db";
import { Database } from "@/types/supabase";

export default function WorkingSetSyncer() {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const hasSynced = useRef(false);

    useEffect(() => {
        if (!navigator.onLine || hasSynced.current) return;

        const performSync = async () => {
            try {
                setStatus('syncing');

                // 1. Catálogos (Departamentos y Categorías)
                const { data: deptos } = await supabase.schema('sourcing').from('departamentos').select('*');
                if (deptos) await syncCatalogoLocal('departamentos', deptos);

                const { data: categorias } = await supabase.schema('sourcing').from('categorias').select('*');
                if (categorias) await syncCatalogoLocal('categorias', categorias);

                const { data: ferias } = await supabase.schema('sourcing').from('ferias').select('*');
                if (ferias) await syncCatalogoLocal('ferias', ferias);

                // 2. Working Set de Usuario (Últimos 14 días)
                const cutoffDate = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)).toISOString();

                // Productos creados hace menos de 14 días
                const { data: productos } = await supabase.schema('sourcing')
                    .from('productos_prospecto')
                    .select('*, proveedores!inner(nombre_empresa, contacto_principal, pais_origen), activos_adjuntos(*)')
                    .gte('created_at', cutoffDate);

                if (productos && productos.length > 0) {
                    const productosParaDB = productos.map(p => ({
                        id: p.id,
                        nombre_rapido: p.nombre_rapido,
                        codigo_trazabilidad: p.codigo_trazabilidad,
                        precio_referencia: p.precio_referencia,
                        moneda: p.moneda,
                        prioridad: p.prioridad,
                        estado_compra: p.estado_compra,
                        feria: p.feria,
                        proveedor_nombre: p.proveedores?.nombre_empresa,
                        activos: p.activos_adjuntos || [],
                        timestamp: new Date(p.created_at).getTime()
                    }));
                    await insertMultiple('productos_recientes', productosParaDB);
                }

                // Proveedores (solo un chunk reciente limit 500)
                const { data: proveedores } = await supabase.schema('sourcing')
                    .from('v_directorio_proveedores')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(500);

                if (proveedores) {
                    const provDb = proveedores.map(p => ({
                        ...p,
                        timestamp: p.created_at ? new Date(p.created_at).getTime() : Date.now()
                    }));
                    await insertMultiple('proveedores_descubiertos', provDb);
                }

                // 3. Limpieza de memoria (Garbage collection de la cache)
                await cleanOld14Days();

                hasSynced.current = true;
                setStatus('synced');
            } catch (err) {
                console.error("Error en WorkingSetSyncer:", err);
                setStatus('error');
            }
        };

        const timer = setTimeout(() => {
            performSync();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}
