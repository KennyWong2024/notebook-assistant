"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, Plus, X, Mail, ChevronDown } from "lucide-react";
import CamaraWidget from "./CamaraWidget";
import CapturaTarjeta from "./CapturaTarjeta";
import BuscadorProveedor from "./BuscadorProveedor";
import GaleriaMiniaturas from "./GaleriaMiniaturas";
import TarjetaProducto from "./TarjetaProducto";
import { comprimirImagen } from "@/lib/image-utils";
import { Fair } from "@/types/database";
import { guardarProspectoLocal, ProspectoOffline, ProductoOffline } from "@/lib/offline-db";

type ProductoTemp = {
    tempId: number;
    nombre: string;
    precio: string;
    moneda: string;
    descripcion: string;
    prioridad: number | null;
    fotos: File[];
};

export default function FormularioCaptura() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cargandoFeria, setCargandoFeria] = useState(true);
    const [feriasAsignadas, setFeriasAsignadas] = useState<Fair[]>([]);
    const [feriaActiva, setFeriaActiva] = useState<Fair | null>(null);
    const [showSelectorFeria, setShowSelectorFeria] = useState(false);

    const [fotoTarjeta, setFotoTarjeta] = useState<File | null>(null);
    const [nombreProveedor, setNombreProveedor] = useState("");
    const [correoProveedor, setCorreoProveedor] = useState("");
    const [notasGenerales, setNotasGenerales] = useState("");
    const [productos, setProductos] = useState<ProductoTemp[]>([
        { tempId: Date.now(), nombre: "", precio: "", moneda: "USD", descripcion: "", prioridad: null, fotos: [] }
    ]);
    const [fotosGenerales, setFotosGenerales] = useState<File[]>([]);

    useEffect(() => {
        const fetchFerias = async () => {
            setCargandoFeria(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .schema('sourcing')
                    .from('asignaciones_feria')
                    .select('id_feria, ferias!inner(*)')
                    .eq('id_usuario', user.id)
                    .eq('ferias.estado_activo', true);

                if (data && data.length > 0) {
                    const mapeadas = data.map(d => Array.isArray(d.ferias) ? d.ferias[0] : d.ferias) as unknown as Fair[];

                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);

                    const feriasVigentes = mapeadas.filter(feria => {
                        const fechaEvaluacion = feria.fecha_fin ? new Date(feria.fecha_fin) : new Date(feria.fecha_inicio);
                        fechaEvaluacion.setHours(0, 0, 0, 0);
                        return fechaEvaluacion >= hoy;
                    });

                    setFeriasAsignadas(feriasVigentes);

                    if (feriasVigentes.length > 0) {
                        setFeriaActiva(feriasVigentes[0]);
                    } else {
                        setFeriaActiva(null);
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setCargandoFeria(false);
            }
        };
        fetchFerias();
    }, []);

    const addProducto = () => setProductos([...productos, { tempId: Date.now(), nombre: "", precio: "", moneda: "USD", descripcion: "", prioridad: null, fotos: [] }]);
    const removeProducto = (id: number) => {
        if (productos.length === 1) return;
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

    const handleCerrar = () => {
        if (nombreProveedor || fotoTarjeta || productos[0].nombre || productos[0].fotos.length > 0) {
            if (window.confirm("¿Estás seguro de salir? Perderás los datos no guardados.")) {
                router.push('/dashboard');
            }
        } else {
            router.push('/dashboard');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!feriaActiva) return alert("Debes tener una feria activa seleccionada para guardar.");

        const faltanNombres = productos.some(p => !p.nombre.trim());
        if (faltanNombres) {
            return alert("Agrega el Nombre/Artículo a los productos antes de continuar.");
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión");

            const fotoComprimidaTarjeta = fotoTarjeta ? await comprimirImagen(fotoTarjeta) : undefined;

            const standComprimidas: Blob[] = [];
            for (const f of fotosGenerales) {
                standComprimidas.push(await comprimirImagen(f));
            }

            const productosOffline: ProductoOffline[] = [];
            for (const prod of productos) {
                const tieneData = prod.nombre.trim() || prod.precio || prod.fotos.length > 0 || prod.prioridad;
                if (!tieneData) continue;

                const fotosProdComprimidas: Blob[] = [];
                for (const pf of prod.fotos) {
                    fotosProdComprimidas.push(await comprimirImagen(pf));
                }

                productosOffline.push({
                    nombre_rapido: prod.nombre.trim() || '',
                    precio_referencia: prod.precio ? parseFloat(prod.precio) : undefined,
                    moneda: prod.moneda,
                    descripcion_libre: prod.descripcion.trim() || undefined,
                    prioridad: prod.prioridad || undefined,
                    fotos: fotosProdComprimidas
                });
            }

            if (productosOffline.length === 0) {
                setLoading(false);
                return alert("Debes capturar información de al menos un producto (foto, nombre o precio) para poder guardar el registro.");
            }

            const idLocalCifrado = `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            const prospectoOffline: Omit<ProspectoOffline, 'estado_subida' | 'intento'> = {
                id_local: idLocalCifrado,
                nombre_empresa: nombreProveedor.trim() || 'Pendiente de definir',
                email_contacto: correoProveedor.trim(),
                id_feria: feriaActiva.id,
                nombre_feria: feriaActiva.nombre,
                notas_generales: notasGenerales.trim(),
                creado_por: user.id,
                productos: productosOffline,
                foto_tarjeta: fotoComprimidaTarjeta,
                fotos_stand: standComprimidas,
                timestamp: Date.now()
            };

            await guardarProspectoLocal(prospectoOffline);

            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 1000);

        } catch (err) {
            console.error(err);
            alert("Error al guardar localmente en IndexedDB. ¿Almacenamiento lleno?");
        } finally {
            setLoading(false);
        }
    };

    if (cargandoFeria) return <div className="p-12 text-center font-bold text-gray-400 animate-pulse">Abriendo cuaderno...</div>;

    if (!cargandoFeria && feriasAsignadas.length === 0) {
        return (
            <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <X className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">No hay ferias activas</h2>
                <p className="text-gray-500 mb-8 max-w-sm">No tienes ninguna feria vigente asignada en este momento. Las ferias finalizadas no permiten nuevos registros.</p>
                <button onClick={() => router.push('/dashboard')} className="bg-gray-900 text-white font-bold py-4 px-8 rounded-2xl hover:bg-gray-800 transition-colors">
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <button type="button" onClick={handleCerrar} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"><X className="w-6 h-6" /></button>
                <div className="text-center">
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">Nuevo Stand</h1>
                    <p onClick={() => feriasAsignadas.length > 1 && setShowSelectorFeria(true)} className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center justify-center cursor-pointer">
                        {feriaActiva?.nombre} {feriasAsignadas.length > 1 && <ChevronDown className="w-3 h-3 ml-1" />}
                    </p>
                </div>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleSave} className="p-4 space-y-6 pb-32 max-w-md mx-auto">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                    <CapturaTarjeta onCaptured={setFotoTarjeta} />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center space-x-1">
                                <span>Proveedor</span>
                                <span className="text-[10px] text-gray-300 normal-case font-medium">(Opcional)</span>
                            </label>
                            <BuscadorProveedor value={nombreProveedor} onChange={setNombreProveedor} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center space-x-1"><span>Correo</span><span className="text-[10px] text-gray-300 normal-case font-medium">(Opcional)</span></label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-300" />
                                <input type="email" value={correoProveedor} onChange={(e) => setCorreoProveedor(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none font-medium text-gray-800 transition-all" placeholder="email@ejemplo.com" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-3">Productos</h3>
                    {productos.map((prod, i) => (
                        <TarjetaProducto
                            key={prod.tempId} index={i} producto={prod} totalProductos={productos.length}
                            onUpdate={(f, v) => setProductos(productos.map(p => p.tempId === prod.tempId ? { ...p, [f]: v } : p))}
                            onRemove={() => setProductos(productos.filter(p => p.tempId !== prod.tempId))}
                            onAddFoto={(file) => setProductos(productos.map(p => p.tempId === prod.tempId ? { ...p, fotos: [...p.fotos, file] } : p))}
                            onRemoveFoto={(idx) => setProductos(productos.map(p => { if (p.tempId === prod.tempId) { const nf = [...p.fotos]; nf.splice(idx, 1); return { ...p, fotos: nf }; } return p; }))}
                        />
                    ))}
                    <button type="button" onClick={addProducto} className="w-full py-5 border-2 border-dashed border-gray-200 bg-white text-gray-400 rounded-[2rem] font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all flex items-center justify-center space-x-2">
                        <Plus className="w-5 h-5" /><span>Añadir Producto</span>
                    </button>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Notas Generales</label>
                    <textarea rows={3} value={notasGenerales} onChange={(e) => setNotasGenerales(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none text-sm text-gray-700 resize-none" placeholder="Notas sobre el stand o contacto..." />
                    <CamaraWidget label="Fotos del Stand" onImageCaptured={(f) => setFotosGenerales([...fotosGenerales, f])} />
                    <GaleriaMiniaturas fotos={fotosGenerales} onRemover={(idx) => setFotosGenerales(fotosGenerales.filter((_, i) => i !== idx))} />
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-[110]">
                    <button type="submit" disabled={loading || !feriaActiva} className={`w-full max-w-md mx-auto py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center space-x-3 ${success ? "bg-green-500 text-white" : "bg-red-600 text-white active:scale-95 shadow-red-200"}`}>
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : success ? <CheckCircle2 className="w-6 h-6" /> : <span>GUARDAR CAPTURA</span>}
                    </button>
                </div>
            </form>

            {showSelectorFeria && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-end justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-[2rem] p-6 pb-10 animate-in slide-in-from-bottom-8 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Cambiar de Feria</h3>
                                <p className="text-xs text-gray-500 mt-1">Selecciona el evento en el que te encuentras.</p>
                            </div>
                            <button onClick={() => setShowSelectorFeria(false)} className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {feriasAsignadas.map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => { setFeriaActiva(f); setShowSelectorFeria(false); }}
                                    className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${feriaActiva?.id === f.id ? 'border-red-500 bg-red-50 shadow-md shadow-red-100' : 'border-gray-100 bg-white hover:border-red-200'}`}
                                >
                                    <div>
                                        <span className={`block font-bold text-lg leading-tight ${feriaActiva?.id === f.id ? 'text-red-700' : 'text-gray-700'}`}>{f.nombre}</span>
                                    </div>
                                    {feriaActiva?.id === f.id && <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0 ml-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}