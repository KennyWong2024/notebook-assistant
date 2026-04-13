"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, CheckCircle2, DollarSign, AlertTriangle, Plus, Trash2, Package } from "lucide-react";
import CamaraWidget from "./CamaraWidget";
import CapturaTarjeta from "./CapturaTarjeta";
import BuscadorProveedor from "./BuscadorProveedor";
import GaleriaMiniaturas from "./GaleriaMiniaturas";
import { generarCodigoTrazabilidad } from "@/lib/image-utils";
import { Fair } from "@/types/database";

// Tipo para manejar el sub-formulario dinámico
type ProductoTemp = {
    tempId: number;
    nombre: string;
    precio: string;
    moneda: string;
    fotos: File[];
};

export default function FormularioCaptura() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [feriaActiva, setFeriaActiva] = useState<Fair | null>(null);
    const [cargandoFeria, setCargandoFeria] = useState(true);

    // Estados del "Cuaderno"
    const [fotoTarjeta, setFotoTarjeta] = useState<File | null>(null);
    const [nombreProveedor, setNombreProveedor] = useState("");
    const [productos, setProductos] = useState<ProductoTemp[]>([
        { tempId: Date.now(), nombre: "", precio: "", moneda: "USD", fotos: [] }
    ]);
    const [fotosGenerales, setFotosGenerales] = useState<File[]>([]);

    useEffect(() => {
        const fetchFeriaAsignada = async () => {
            setCargandoFeria(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase.schema('sourcing')
                    .from('asignaciones_feria')
                    .select('id_feria, ferias!inner(*)')
                    .eq('id_usuario', user.id)
                    .eq('ferias.estado_activo', true)
                    .limit(1)
                    .maybeSingle();

                if (data && data.ferias) {
                    const feriaDetectada = Array.isArray(data.ferias) ? data.ferias[0] : data.ferias;
                    setFeriaActiva(feriaDetectada as unknown as Fair);
                } else {
                    setFeriaActiva(null);
                }
            } catch (err) {
                console.error("Error", err);
            } finally {
                setCargandoFeria(false);
            }
        };
        fetchFeriaAsignada();
    }, []);

    // --- Manejadores de Productos Dinámicos ---
    const addProducto = () => {
        setProductos([...productos, { tempId: Date.now(), nombre: "", precio: "", moneda: "USD", fotos: [] }]);
    };

    const removeProducto = (id: number) => {
        if (productos.length === 1) return; // Mínimo 1 producto
        setProductos(productos.filter(p => p.tempId !== id));
    };

    const updateProducto = (id: number, field: keyof ProductoTemp, value: any) => {
        setProductos(productos.map(p => p.tempId === id ? { ...p, [field]: value } : p));
    };

    const addFotoProducto = (id: number, file: File) => {
        setProductos(productos.map(p => p.tempId === id ? { ...p, fotos: [...p.fotos, file] } : p));
    };

    const removeFotoProducto = (id: number, indexFoto: number) => {
        setProductos(productos.map(p => {
            if (p.tempId === id) {
                const nuevasFotos = [...p.fotos];
                nuevasFotos.splice(indexFoto, 1);
                return { ...p, fotos: nuevasFotos };
            }
            return p;
        }));
    };

    // --- Guardado Masivo ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feriaActiva) return alert("Feria no asignada.");
        if (!fotoTarjeta) return alert("Por favor toma la foto de la tarjeta del proveedor.");

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión");

            // 1. Guardar/Buscar Proveedor
            let providerId;
            const { data: provExistente } = await supabase.schema('sourcing').from('proveedores')
                .select('id').ilike('nombre_empresa', nombreProveedor).maybeSingle();

            if (provExistente) {
                providerId = provExistente.id;
            } else {
                const { data: nuevoProv, error: errProv } = await supabase.schema('sourcing').from('proveedores')
                    .insert({ nombre_empresa: nombreProveedor, creado_por: user.id }).select().single();
                if (errProv) throw errProv;
                providerId = nuevoProv.id;
            }

            // 2. Subir Tarjeta (id_tipo_activo = 1)
            const extTarjeta = fotoTarjeta.name?.split('.').pop() || 'jpg';
            const pathTarjeta = `proveedores/${providerId}/tarjeta_${Date.now()}.${extTarjeta}`;
            await supabase.storage.from('activos_feria').upload(pathTarjeta, fotoTarjeta);
            const { data: urlTarjeta } = supabase.storage.from('activos_feria').getPublicUrl(pathTarjeta);

            await supabase.schema('sourcing').from('activos_adjuntos').insert({
                url_storage: urlTarjeta.publicUrl,
                id_tipo_activo: 1,
                creado_por: user.id,
                id_proveedor: providerId
            });

            // 3. Iterar y Guardar Productos y sus fotos
            for (const prod of productos) {
                if (!prod.nombre) continue; // Saltar si dejaron el nombre vacío

                const codigo = generarCodigoTrazabilidad(feriaActiva.nombre, prod.nombre);
                const { data: dbProd, error: errProd } = await supabase.schema('sourcing').from('productos_prospecto')
                    .insert({
                        codigo_trazabilidad: codigo,
                        id_proveedor: providerId,
                        id_feria: feriaActiva.id,
                        creado_por: user.id,
                        nombre_rapido: prod.nombre,
                        precio_referencia: parseFloat(prod.precio) || 0,
                        moneda: prod.moneda,
                        estado_compra: 'borrador'
                    }).select().single();

                if (errProd) throw errProd;

                // Subir fotos de este producto (id_tipo_activo = 2)
                for (const [index, foto] of prod.fotos.entries()) {
                    const ext = foto.name?.split('.').pop() || 'jpg';
                    const path = `${dbProd.id}/prod_${Date.now()}_${index}.${ext}`;
                    await supabase.storage.from('activos_feria').upload(path, foto);
                    const { data: urlFoto } = supabase.storage.from('activos_feria').getPublicUrl(path);

                    await supabase.schema('sourcing').from('activos_adjuntos').insert({
                        url_storage: urlFoto.publicUrl,
                        id_tipo_activo: 2,
                        creado_por: user.id,
                        id_producto: dbProd.id
                    });
                }
            }

            // 4. Fotos Generales/Stand (id_tipo_activo = 3)
            for (const [index, foto] of fotosGenerales.entries()) {
                const ext = foto.name?.split('.').pop() || 'jpg';
                const path = `ferias/${feriaActiva.id}/stand_${providerId}_${Date.now()}_${index}.${ext}`;
                await supabase.storage.from('activos_feria').upload(path, foto);
                const { data: urlGen } = supabase.storage.from('activos_feria').getPublicUrl(path);

                await supabase.schema('sourcing').from('activos_adjuntos').insert({
                    url_storage: urlGen.publicUrl,
                    id_tipo_activo: 3,
                    creado_por: user.id,
                    id_proveedor: providerId,
                    id_feria: feriaActiva.id
                });
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                // Limpieza profunda para el siguiente proveedor
                setFotoTarjeta(null);
                setNombreProveedor("");
                setProductos([{ tempId: Date.now(), nombre: "", precio: "", moneda: "USD", fotos: [] }]);
                setFotosGenerales([]);
                window.scrollTo(0, 0);
            }, 2500);

        } catch (err) {
            console.error(err);
            alert("Error al guardar todo. Revisa la conexión.");
        } finally {
            setLoading(false);
        }
    };

    if (cargandoFeria) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
    if (!feriaActiva) return <div className="p-6 bg-red-50 text-red-900 rounded-2xl">Sin feria asignada.</div>;

    return (
        <form onSubmit={handleSave} className="space-y-8 pb-24">

            {/* BLOQUE 1: PROVEEDOR Y TARJETA */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center space-x-3 mb-2 border-b border-gray-50 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Datos del Stand</h2>
                        <p className="text-xs text-gray-500">Feria: {feriaActiva.nombre}</p>
                    </div>
                </div>

                <CapturaTarjeta onCaptured={setFotoTarjeta} />

                <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Proveedor</label>
                    <BuscadorProveedor value={nombreProveedor} onChange={setNombreProveedor} />
                </div>
            </div>

            {/* BLOQUE 2: PRODUCTOS DINÁMICOS */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-2">Productos Prospectados</h3>

                {productos.map((prod, i) => (
                    <div key={prod.tempId} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-5 relative">
                        {productos.length > 1 && (
                            <button type="button" onClick={() => removeProducto(prod.tempId)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}

                        <div className="pr-8">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Producto {i + 1}</label>
                            <input
                                type="text" required value={prod.nombre} onChange={(e) => updateProducto(prod.tempId, 'nombre', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold"
                                placeholder="Ej: Silla Gamer Ergonómica"
                            />
                        </div>

                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio Ref.</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                    <input type="number" step="0.01" value={prod.precio} onChange={(e) => updateProducto(prod.tempId, 'precio', e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold" placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="w-1/3">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Moneda</label>
                                <select value={prod.moneda} onChange={(e) => updateProducto(prod.tempId, 'moneda', e.target.value)}
                                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-bold appearance-none">
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="RMB">RMB</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-50">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fotos del producto (Opcional)</label>
                            <GaleriaMiniaturas fotos={prod.fotos} onRemover={(idx) => removeFotoProducto(prod.tempId, idx)} />
                            <CamaraWidget label="Agregar Foto" onImageCaptured={(file) => addFotoProducto(prod.tempId, file)} />
                        </div>
                    </div>
                ))}

                <button type="button" onClick={addProducto} className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-[2rem] font-bold hover:bg-gray-50 hover:border-red-300 hover:text-red-500 transition-all flex items-center justify-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Añadir Otro Producto al Mismo Stand</span>
                </button>
            </div>

            {/* BLOQUE 3: FOTOS GENERALES */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="mb-2">
                    <h3 className="text-sm font-black text-gray-900">Fotos del Stand o Contexto</h3>
                    <p className="text-xs text-gray-500 mb-4">Totalmente opcional.</p>
                </div>
                <GaleriaMiniaturas fotos={fotosGenerales} onRemover={(i) => setFotosGenerales(prev => prev.filter((_, idx) => idx !== i))} />
                <CamaraWidget label="Capturar Contexto" onImageCaptured={(f) => setFotosGenerales(p => [...p, f])} />
            </div>

            {/* BOTÓN FINAL */}
            <button
                type="submit"
                disabled={loading || success || !fotoTarjeta}
                className={`w-full py-5 rounded-3xl font-black text-xl shadow-xl transition-all flex items-center justify-center space-x-3 ${success ? "bg-green-500 text-white" :
                    !fotoTarjeta ? "bg-gray-300 text-gray-500 cursor-not-allowed" :
                        "bg-red-600 text-white active:scale-95 shadow-red-200"
                    }`}
            >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> :
                    success ? <><CheckCircle2 className="w-6 h-6" /> <span>¡LIBRETA GUARDADA!</span></> :
                        <span>GUARDAR TODO EL STAND</span>}
            </button>
        </form>
    );
}