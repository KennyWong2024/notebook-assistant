"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
    Download, TrendingUp, PackageOpen, PieChart, BarChart4, Loader2, Building2, Filter
} from "lucide-react";
import * as XLSX from "xlsx";
import {
    PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import ContenedorPagina from "@/components/ui/ContenedorPagina";

type KPI = {
    totalProductos: number;
    completados: number;
};

const COLORES_ESTADO = {
    'borrador': '#9ca3af',
    'completado': '#ef4444',
    'muestra_solicitada': '#f59e0b',
    'aprobado_gerencia': '#10b981',
    'orden_colocada': '#0ea5e9',
    'descartado': '#374151'
};

export default function PanelAnalitica() {
    // 1. Estados Principales
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any[]>([]); // Toda la data cruda
    const [isExporting, setIsExporting] = useState(false);

    // 2. Estados de Filtrado
    const [listaFerias, setListaFerias] = useState<string[]>([]);
    const [feriaSeleccionada, setFeriaSeleccionada] = useState<string>("");

    // 3. Carga Inicial de Datos
    useEffect(() => {
        cargarAnaliticas();
    }, []);

    const cargarAnaliticas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.schema('sourcing').from('v_analitica_productos').select('*');
            if (error) throw error;
            if (!data) return;

            setRawData(data);

            // Extraer ferias únicas dinámicamente de la data (asumiendo que la vista retorna una columna 'Feria' o 'feria')
            const feriasUnicas = Array.from(new Set(data.map(d => d.Feria || d.feria).filter(Boolean))) as string[];
            setListaFerias(feriasUnicas.sort());

        } catch (error) {
            console.error("Error cargando capa analitica", error);
        } finally {
            setLoading(false);
        }
    };

    // 4. Lógica de Filtrado (Se recalcula automáticamente al cambiar la feria)
    const datosFiltrados = useMemo(() => {
        if (!feriaSeleccionada) return rawData; // Si no hay filtro, retorna todo
        return rawData.filter(row => (row.Feria || row.feria) === feriaSeleccionada);
    }, [rawData, feriaSeleccionada]);

    // 5. Procesamiento de Métricas basado en la data filtrada
    const { kpis, datosEstado, datosDpto } = useMemo(() => {
        let totProd = datosFiltrados.length;
        let completados = 0;
        const stateMap: Record<string, number> = {};
        const dptoMap: Record<string, number> = {};

        datosFiltrados.forEach((row) => {
            if (row.estado_compra !== 'borrador') completados++;

            const est = row.estado_compra || 'desconocido';
            stateMap[est] = (stateMap[est] || 0) + 1;

            const dp = row.Dpto || 'Sin Departamento';
            dptoMap[dp] = (dptoMap[dp] || 0) + 1;
        });

        const formatoEstado = Object.keys(stateMap).map(k => ({
            name: k.replace(/_/g, ' ').toUpperCase(),
            value: stateMap[k],
            color: COLORES_ESTADO[k as keyof typeof COLORES_ESTADO] || '#9ca3af'
        }));

        const formatoDptos = Object.keys(dptoMap).map(k => ({
            name: k,
            productos: dptoMap[k]
        })).sort((a, b) => b.productos - a.productos).slice(0, 5);

        return {
            kpis: { totalProductos: totProd, completados },
            datosEstado: formatoEstado,
            datosDpto: formatoDptos
        };
    }, [datosFiltrados]);

    // 6. Exportación a Excel instantánea (Usa los datos ya filtrados en memoria)
    const handleExportExcel = () => {
        setIsExporting(true);
        try {
            if (datosFiltrados.length === 0) {
                alert("No hay información para exportar con este filtro.");
                return;
            }

            // Mapeamos la data para que el Excel tenga las columnas exactas que queremos
            const dataParaExcel = datosFiltrados.map(row => ({
                Feria: row.Feria || row.feria || 'N/A',
                Producto: row.Producto,
                "Nota de Producto": row["Nota de Producto"],
                Prioridad: row.Prioridad,
                Proveedor: row.Proveedor,
                Responsable: row.Responsable,
                Dpto: row.Dpto,
                Categoria: row.Categoria,
                Foto: row.Foto,
                "Notas Generales": row["Notas Generales"]
            }));

            const ws = XLSX.utils.json_to_sheet(dataParaExcel);
            const wb = XLSX.utils.book_new();

            // Nombre de la hoja condicionado a la feria
            const nombreHoja = feriaSeleccionada ? feriaSeleccionada.substring(0, 30) : "Reporte Global";
            XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

            ws['!cols'] = [
                { wch: 20 }, // Feria
                { wch: 25 }, // Producto
                { wch: 40 }, // Nota
                { wch: 10 }, // Prioridad
                { wch: 25 }, // Proveedor
                { wch: 20 }, // Responsable
                { wch: 20 }, // Dpto
                { wch: 20 }, // Categoria
                { wch: 10 }, // Foto
                { wch: 50 }, // Nota General
            ];

            const nombreArchivo = feriaSeleccionada
                ? `Reporte_${feriaSeleccionada.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
                : `Reporte_Global_PM_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

            XLSX.writeFile(wb, nombreArchivo);

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error generando el Excel.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ContenedorPagina>
            {/* ENCABEZADO Y CONTROLES */}
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <PieChart className="w-6 h-6 md:w-8 md:h-8 mr-3 text-red-600 hidden md:block" />
                        Capa Analítica
                    </h1>
                    <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mt-1">Cuadro de Mando Ejecutivo</p>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-3">
                    {/* SELECTOR DE FERIA */}
                    <div className="w-full sm:w-64 relative">
                        <Filter className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <select
                            value={feriaSeleccionada}
                            onChange={(e) => setFeriaSeleccionada(e.target.value)}
                            disabled={loading || listaFerias.length === 0}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-700 font-bold transition-all shadow-sm appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Todas las ferias</option>
                            {listaFerias.map(feria => (
                                <option key={feria} value={feria}>{feria}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        disabled={loading || isExporting || datosFiltrados.length === 0}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-all active:scale-95 flex items-center justify-center space-x-2"
                    >
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        <span>Exportar Data</span>
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-red-500" />
                    <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">Computando Métricas...</p>
                </div>
            ) : (
                <>
                    {/* TARJETAS DE KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4">
                            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                                <PackageOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Productos Prospectados</p>
                                <p className="text-3xl font-black text-gray-900">{kpis.totalProductos}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4">
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Productos Revisados</p>
                                <p className="text-3xl font-black text-gray-900">{kpis.completados}</p>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN DE GRÁFICOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* GRÁFICO 1 */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center space-x-2 mb-6">
                                <PieChart className="w-5 h-5 text-gray-400" />
                                <h3 className="font-black text-gray-700 tracking-tight text-lg">Distribución por Etapa</h3>
                            </div>
                            <div className="h-72 w-full">
                                {datosEstado.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie data={datosEstado} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                                                {datosEstado.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-xs font-bold text-gray-600">{value}</span>} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">No hay datos suficientes.</div>
                                )}
                            </div>
                        </div>

                        {/* GRÁFICO 2 */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center space-x-2 mb-6">
                                <BarChart4 className="w-5 h-5 text-gray-400" />
                                <h3 className="font-black text-gray-700 tracking-tight text-lg">Top Departamentos</h3>
                            </div>
                            <div className="h-72 w-full">
                                {datosDpto.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosDpto} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="productos" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">No hay datos suficientes.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TABLA BASE */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <h3 className="font-black text-gray-700 tracking-tight text-lg">Resumen de Datos</h3>
                        </div>
                        <p className="text-gray-500 text-sm max-w-2xl">
                            Este panel extrae directamente la recolección del equipo.
                            {feriaSeleccionada
                                ? ` Actualmente estás viendo datos exclusivos para la feria: "${feriaSeleccionada}". Al exportar, el archivo Excel contendrá únicamente esta información.`
                                : " Actualmente estás viendo el consolidado global de todas las ferias activas."
                            }
                        </p>
                    </div>
                </>
            )}
        </ContenedorPagina>
    );
}