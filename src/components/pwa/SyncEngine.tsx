"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { obtenerProspectosPendientes, eliminarProspectoLocal, marcarErrorProspectoLocal } from "@/lib/offline-db";
import { generarCodigoTrazabilidad } from "@/lib/image-utils";
import { Cloud, CloudOff, CloudUpload, Loader2 } from "lucide-react";

export default function SyncEngine() {
    const [pendientesCount, setPendientesCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    const checkNetwork = () => {
        setIsOnline(navigator.onLine);
    };

    const flushQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        const pendientes = await obtenerProspectosPendientes();
        setPendientesCount(pendientes.length);

        if (pendientes.length === 0) return;

        setIsSyncing(true);

        for (const prospecto of pendientes) {
            try {
                // 1. Proveedor
                let providerId;
                const provNameTrimmed = prospecto.nombre_empresa;
                const { data: provExistentes, error: errProvSearch } = await supabase.schema('sourcing').from('proveedores').select('id').ilike('nombre_empresa', provNameTrimmed).limit(1);

                if (errProvSearch) throw errProvSearch;

                if (provExistentes && provExistentes.length > 0) {
                    providerId = provExistentes[0].id;
                } else {
                    const { data: nuevoProv, error: errProvIn } = await supabase.schema('sourcing').from('proveedores').insert({
                        nombre_empresa: provNameTrimmed,
                        email_contacto: prospecto.email_contacto || null,
                        creado_por: prospecto.creado_por
                    }).select().single();
                    if (errProvIn) throw errProvIn;
                    providerId = nuevoProv.id;
                }

                // 2. Interacción y Tarjeta
                const { error: errInt } = await supabase.schema('sourcing').from('proveedor_feria_interacciones').insert({
                    id_proveedor: providerId,
                    id_feria: prospecto.id_feria,
                    creado_por: prospecto.creado_por,
                    notas_generales: prospecto.notas_generales || null,
                    email_contacto: prospecto.email_contacto || null
                });
                if (errInt) throw errInt;

                if (prospecto.foto_tarjeta) {
                    const path = `proveedores/${providerId}/tarjeta_${Date.now()}.jpg`;
                    const { error: errUp } = await supabase.storage.from('activos_feria').upload(path, prospecto.foto_tarjeta);
                    if (errUp) throw errUp;
                    const { data: url } = supabase.storage.from('activos_feria').getPublicUrl(path);
                    await supabase.schema('sourcing').from('activos_adjuntos').insert({ url_storage: url.publicUrl, id_tipo_activo: 1, creado_por: prospecto.creado_por, id_proveedor: providerId });
                }

                // 3. Productos (Productos Offline Array)
                for (const prod of prospecto.productos) {
                    const codigo = generarCodigoTrazabilidad(prospecto.nombre_feria, prod.nombre_rapido || 'PROD');

                    const { data: dbProd, error: errProd } = await supabase.schema('sourcing').from('productos_prospecto').insert({
                        codigo_trazabilidad: codigo,
                        id_proveedor: providerId,
                        id_feria: prospecto.id_feria,
                        creado_por: prospecto.creado_por,
                        nombre_rapido: prod.nombre_rapido || null,
                        precio_referencia: prod.precio_referencia || null,
                        moneda: prod.moneda,
                        descripcion_libre: prod.descripcion_libre || null,
                        prioridad: prod.prioridad,
                        estado_compra: 'borrador'
                    }).select().single();

                    if (errProd) throw errProd;

                    for (const [idx, f] of prod.fotos.entries()) {
                        const path = `${dbProd.id}/p_${Date.now()}_${idx}.jpg`;
                        const { error: errFUp } = await supabase.storage.from('activos_feria').upload(path, f);
                        if (errFUp) throw errFUp;
                        const { data: url } = supabase.storage.from('activos_feria').getPublicUrl(path);
                        await supabase.schema('sourcing').from('activos_adjuntos').insert({ url_storage: url.publicUrl, id_tipo_activo: 2, creado_por: prospecto.creado_por, id_producto: dbProd.id });
                    }
                }

                // 4. Stand General
                for (const [index, foto] of prospecto.fotos_stand.entries()) {
                    const path = `ferias/${prospecto.id_feria}/stand_${providerId}_${Date.now()}_${index}.jpg`;
                    const { error: errStandUp } = await supabase.storage.from('activos_feria').upload(path, foto);
                    if (errStandUp) throw errStandUp;
                    const { data: urlGen } = supabase.storage.from('activos_feria').getPublicUrl(path);
                    await supabase.schema('sourcing').from('activos_adjuntos').insert({
                        url_storage: urlGen.publicUrl, id_tipo_activo: 3, creado_por: prospecto.creado_por, id_proveedor: providerId, id_feria: prospecto.id_feria
                    });
                }

                // EXITOSO: Eliminar de HDD Local
                await eliminarProspectoLocal(prospecto.id_local);

                // Refrescar contador local iteración a iteración
                const left = await obtenerProspectosPendientes();
                setPendientesCount(left.length);

            } catch (err: any) {
                console.error("Fallo de red o firewall sincronizando ítem", prospecto.id_local, err);
                // Detener la subida temporalmente porque el internet / base de datos falló.
                // Lo marcamos con error interno para métricas pero sigue en la cola
                await marcarErrorProspectoLocal(prospecto.id_local);
                break; // Corta el Loop principal for
            }
        }

        setIsSyncing(false);
    }, [isSyncing]);

    useEffect(() => {
        // Checar al montar
        checkNetwork();
        window.addEventListener("online", checkNetwork);
        window.addEventListener("offline", checkNetwork);

        return () => {
            window.removeEventListener("online", checkNetwork);
            window.removeEventListener("offline", checkNetwork);
        };
    }, []);

    // Foreground Poll mechanism (revisa cada 10 segundos)
    useEffect(() => {
        const pollColaLocal = async () => {
            const arr = await obtenerProspectosPendientes();
            setPendientesCount(arr.length);
        };

        pollColaLocal();

        // Timer de escaneo principal
        let interval: NodeJS.Timeout;
        if (isOnline) {
            interval = setInterval(() => {
                flushQueue();
            }, 10000); // 10 Segundos
        }

        return () => clearInterval(interval);
    }, [isOnline, flushQueue]);

    // UI Pill Render
    if (pendientesCount === 0 && isOnline) {
        return (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <Cloud className="w-4 h-4 text-green-500" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Sincronizado</span>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <CloudOff className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide truncate max-w-[100px]">Sin Conexión</span>
                {pendientesCount > 0 && <span className="text-[10px] bg-gray-200 text-gray-800 px-1.5 rounded-full font-black ml-1">{pendientesCount}</span>}
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border transition-all ${isSyncing ? "bg-yellow-50 border-yellow-200" : "bg-yellow-50 border-yellow-200 cursor-pointer hover:bg-yellow-100"}`} onClick={() => !isSyncing && flushQueue()}>
            {isSyncing ? <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" /> : <CloudUpload className="w-4 h-4 text-yellow-600" />}
            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide">{isSyncing ? "Subiendo..." : "Esperando Red"}</span>
            <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 rounded-full font-black ml-1">{pendientesCount}</span>
        </div>
    );
}
