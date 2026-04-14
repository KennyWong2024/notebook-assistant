"use client";

import { useState, useEffect } from "react";
import { useEnriquecimiento } from "@/hooks/useEnriquecimiento";
import { X, Loader2, Save, Package, Tags, Truck, CheckCircle2, Image as ImageIcon, Building2 } from "lucide-react";
import CamaraWidget from "../captura/CamaraWidget";
import { supabase } from "@/lib/supabase";

type PanelProps = {
    idProducto: string | null;
    onClose: () => void;
    onSuccess: () => void;
};

type FotoExistente = { id: string; url: string };

export default function PanelEnriquecimiento({ idProducto, onClose, onSuccess }: PanelProps) {
    const { loading, error, departamentos, categorias, cargarCatalogos, obtenerDetalleProducto, guardarEnriquecimiento } = useEnriquecimiento();

    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);
    const [localError, setLocalError] = useState("");

    const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]);
    const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
    const [fotosBorradas, setFotosBorradas] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        id_proveedor: '',
        proveedor_nombre: '',
        nombre_rapido: '',
        precio_referencia: '',
        moneda: 'USD',
        descripcion_libre: '',
        prioridad: null as number | null,
        id_departamento: '',
        id_categoria: '',
        incoterm: '',
        shelf_life: '',
        pidio_muestra: false
    });

    useEffect(() => {
        cargarCatalogos();
    }, [cargarCatalogos]);

    useEffect(() => {
        if (!idProducto) return;

        const fetchDetalle = async () => {
            setCargandoDetalle(true);
            setLocalError("");
            const data = await obtenerDetalleProducto(idProducto);

            try {
                const { data: provData } = await supabase.schema('sourcing')
                    .from('productos_prospecto')
                    .select('id_proveedor, proveedores(nombre_empresa)')
                    .eq('id', idProducto)
                    .maybeSingle();

                if (data && provData) {
                setFormData({
                    id_proveedor: provData.id_proveedor || '',
                    proveedor_nombre: (provData.proveedores as any)?.nombre_empresa || '',
                    nombre_rapido: data.nombre_rapido || '',
                    precio_referencia: data.precio_referencia ? data.precio_referencia.toString() : '',
                    moneda: data.moneda || 'USD',
                    descripcion_libre: data.descripcion_libre || '',
                    prioridad: data.prioridad || null,
                    id_departamento: data.id_departamento ? data.id_departamento.toString() : '',
                    id_categoria: data.id_categoria ? data.id_categoria.toString() : '',
                    incoterm: data.incoterm || '',
                    shelf_life: data.shelf_life || '',
                    pidio_muestra: data.pidio_muestra || false
                });

                if (data.activos_adjuntos) {
                    const fotosProd = data.activos_adjuntos
                        .filter((a: any) => a.id_tipo_activo === 2 && a.estado_activo)
                        .map((a: any) => ({ id: a.id, url: a.url_storage }));
                    setFotosExistentes(fotosProd);
                }
            } else {
                setLocalError("Registro bloqueado o no encontrado (Permisos o Red). Verifica base de datos y RLS.");
            }
            } catch (err) {
                console.error("Fallo crítico en sub-query", err);
                setLocalError("Error interno conectando con el banco de datos.");
            }
            setCargandoDetalle(false);
        };

        setFotosNuevas([]);
        setFotosBorradas([]);
        fetchDetalle();
    }, [idProducto]);

    const categoriasFiltradas = categorias.filter(
        cat => cat.id_departamento.toString() === formData.id_departamento
    );

    const handleBorrarExistente = (id: string) => {
        setFotosExistentes(prev => prev.filter(f => f.id !== id));
        setFotosBorradas(prev => [...prev, id]);
    };

    const handleBorrarNueva = (index: number) => {
        setFotosNuevas(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idProducto) return;
        setLocalError("");

        // 1. Actualizamos el nombre del proveedor en su catálogo maestro
        if (formData.id_proveedor && formData.proveedor_nombre.trim()) {
            const { error: provError } = await supabase.schema('sourcing')
                .from('proveedores')
                .update({ nombre_empresa: formData.proveedor_nombre.trim() })
                .eq('id', formData.id_proveedor);

            if (provError) {
                if (provError.code === '23505') {
                    setLocalError(`El proveedor "${formData.proveedor_nombre}" ya existe en el sistema.`);
                } else {
                    setLocalError("Error al actualizar el nombre del proveedor.");
                }
                return;
            }
        }

        // 2. Guardamos el producto (Hook original)
        const datosLimpios = {
            nombre_rapido: formData.nombre_rapido.trim() || '',
            precio_referencia: formData.precio_referencia ? parseFloat(formData.precio_referencia) : undefined,
            moneda: formData.moneda,
            descripcion_libre: formData.descripcion_libre.trim() || undefined,
            prioridad: formData.prioridad || undefined,
            id_departamento: formData.id_departamento ? parseInt(formData.id_departamento) : undefined,
            id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : undefined,
            incoterm: formData.incoterm.trim() || undefined,
            shelf_life: formData.shelf_life.trim() || undefined,
        };

        const exito = await guardarEnriquecimiento(
            idProducto,
            datosLimpios,
            formData.pidio_muestra,
            fotosNuevas,
            fotosBorradas
        );

        if (exito) {
            setSuccessMsg(true);
            setTimeout(() => {
                setSuccessMsg(false);
                onSuccess();
            }, 1000);
        }
    };

    if (!idProducto) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* HEADER FIJO */}
            <header className="flex-none bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">Registro Completo</h1>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center justify-center">
                        Edición y Enriquecimiento
                    </p>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 overflow-y-auto">
            {cargandoDetalle ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400 space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                    <p className="font-bold animate-pulse">Abriendo cuaderno...</p>
                </div>
            ) : (
                <form id="form-enriquecimiento" onSubmit={handleSubmit} className="p-4 md:p-8 max-w-7xl mx-auto pb-32 space-y-6 lg:space-y-8 w-full">

                    {/* //= TOP BLOCK: Evidencia Visual & Datos Básicos =// */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                        
                        {/* COLUMNA IZQUIERDA (Fotos) */}
                        <div className="space-y-6 flex flex-col h-full">
                            {/* Tarjeta 1: Evidencia Visual */}
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex-1">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2 ml-1 mb-6">
                                    <ImageIcon className="w-4 h-4 text-gray-400" />
                                    <span>Evidencia Visual</span>
                                </h3>

                                <div className="space-y-4">

                                    <CamaraWidget
                                        label="Agregar Foto Adicional"
                                        onImageCaptured={(file) => setFotosNuevas([...fotosNuevas, file])}
                                    />

                                    {(fotosExistentes.length > 0 || fotosNuevas.length > 0) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                                            {fotosExistentes.map((foto, index) => (
                                                <div
                                                    key={foto.id}
                                                    className={`relative rounded-2xl overflow-hidden group border border-gray-200 shadow-sm bg-gray-50 ${index === 0 ? 'col-span-2 sm:col-span-3 aspect-[4/3]' : 'aspect-square'}`}
                                                >
                                                    <img src={foto.url} alt="Producto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBorrarExistente(foto.id)}
                                                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur text-red-500 hover:text-white hover:bg-red-500 rounded-full shadow-sm transition-all md:opacity-0 group-hover:opacity-100"
                                                        title="Borrar foto"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {fotosNuevas.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className={`relative rounded-2xl overflow-hidden group border-2 border-red-200 border-dashed ${fotosExistentes.length === 0 && index === 0 ? 'col-span-2 sm:col-span-3 aspect-[4/3]' : 'aspect-square'}`}
                                                >
                                                    <img src={URL.createObjectURL(file)} alt="Nueva Foto" className="w-full h-full object-cover opacity-80" />
                                                    <div className="absolute inset-0 bg-red-600/10"></div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleBorrarNueva(index)}
                                                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur text-red-500 hover:text-white hover:bg-red-500 rounded-full shadow-sm transition-all md:opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (Formulario Datos) */}
                        <div className="space-y-6 flex flex-col h-full">
                            {/* Tarjeta 2: Datos Capturados */}
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex-1 space-y-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2 ml-1">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span>Datos del Producto</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Proveedor (Fábrica) <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                            <input
                                                type="text" required
                                                value={formData.proveedor_nombre} onChange={e => setFormData({ ...formData, proveedor_nombre: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre / Artículo <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" required
                                            value={formData.nombre_rapido} onChange={e => setFormData({ ...formData, nombre_rapido: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Moneda</label>
                                        <select
                                            value={formData.moneda} onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="RMB">RMB (¥)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio Ref.</label>
                                        <input
                                            type="number" step="0.01"
                                            value={formData.precio_referencia} onChange={e => setFormData({ ...formData, precio_referencia: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descripción / Notas</label>
                                    <textarea
                                        rows={3}
                                        value={formData.descripcion_libre} onChange={e => setFormData({ ...formData, descripcion_libre: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Nivel de Interés</label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[1, 2, 3, 4].map((num) => (
                                            <button
                                                key={num} type="button"
                                                onClick={() => setFormData({ ...formData, prioridad: num })}
                                                className={`py-3.5 rounded-2xl font-bold text-sm transition-all border-2 ${formData.prioridad === num ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div> {/* END TOP BLOCK */}

                    {/* //= BLOQUES INFERIORES: CLASIFICACIÓN Y LOGÍSTICA =// */}
                    {/* Tarjeta 3: Clasificación */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 w-full">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2 ml-1">
                            <Tags className="w-4 h-4 text-gray-400" />
                            <span>Clasificación <span className="text-red-500">*</span></span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Departamento</label>
                                <select
                                    required
                                    value={formData.id_departamento}
                                    onChange={e => setFormData({ ...formData, id_departamento: e.target.value, id_categoria: '' })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                >
                                    <option value="">Selecciona...</option>
                                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                                <select
                                    required disabled={!formData.id_departamento}
                                    value={formData.id_categoria} onChange={e => setFormData({ ...formData, id_categoria: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Selecciona...</option>
                                    {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 4: Logística */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 w-full">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2 ml-1">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span>Logística y Envío</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Incoterm</label>
                                <input
                                    type="text" placeholder="FOB, EXW..."
                                    value={formData.incoterm} onChange={e => setFormData({ ...formData, incoterm: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Shelf Life</label>
                                <input
                                    type="text" placeholder="Ej. 12 meses"
                                    value={formData.shelf_life} onChange={e => setFormData({ ...formData, shelf_life: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 outline-none text-sm font-medium text-gray-800 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between px-1">
                            <div>
                                <p className="text-base font-black text-gray-900">Solicitar Muestra Física</p>
                                <p className="text-sm text-gray-500 font-medium mt-1">¿Acordaste recibir muestras en la oficina?</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={formData.pidio_muestra} onChange={e => setFormData({ ...formData, pidio_muestra: e.target.checked })} />
                                <div className="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-900 shadow-inner"></div>
                            </label>
                        </div>
                    </div>

                    {(error || localError) && (
                        <div className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold text-center border border-red-100">
                            {error || localError}
                        </div>
                    )}
                </form>
            )}
            </div>

            {/* BOTÓN FLOTANTE */}
            {!cargandoDetalle && (
                <div className="flex-none p-4 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-[110]">
                    <button
                        type="submit"
                        form="form-enriquecimiento"
                        disabled={loading || !formData.id_departamento || !formData.id_categoria}
                        className={`w-full max-w-lg mx-auto py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center space-x-3 ${successMsg ? "bg-green-500 text-white shadow-green-200" : (!formData.id_departamento || !formData.id_categoria) ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white active:scale-95 shadow-gray-300"}`}
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : successMsg ? <CheckCircle2 className="w-6 h-6" /> : <><Save className="w-6 h-6" /><span>GUARDAR CAMBIOS</span></>}
                    </button>
                </div>
            )}
        </div>
    );
}