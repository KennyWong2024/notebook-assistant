"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Download, TrendingUp, PackageOpen, PieChart, BarChart4, Loader2, Building2
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
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KPI>({ totalProductos: 0, completados: 0 });
    const [datosEstado, setDatosEstado] = useState<any[]>([]);
    const [datosDpto, setDatosDpto] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        cargarAnaliticas();
    }, []);

    const cargarAnaliticas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.schema('sourcing').from('v_analitica_productos').select('*');
            if (error) throw error;
            if (!data) return;

            let totProd = data.length;
            let completados = 0;
            const stateMap: Record<string, number> = {};
            const dptoMap: Record<string, number> = {};

            data.forEach((row) => {
                if (row.estado_compra !== 'borrador') completados++;
                const est = row.estado_compra || 'desconocido';
                stateMap[est] = (stateMap[est] || 0) + 1;
                const dp = row.Dpto || 'Sin Departamento';
                dptoMap[dp] = (dptoMap[dp] || 0) + 1;
            });

            setKpis({ totalProductos: totProd, completados });
            setDatosEstado(Object.keys(stateMap).map(k => ({
                name: k.replace(/_/g, ' ').toUpperCase(),
                value: stateMap[k],
                color: COLORES_ESTADO[k as keyof typeof COLORES_ESTADO] || '#9ca3af'
            })));

            const formatDptos = Object.keys(dptoMap).map(k => ({
                name: k,
                productos: dptoMap[k]
            })).sort((a, b) => b.productos - a.productos).slice(0, 5);
            setDatosDpto(formatDptos);

        } catch (error) {
            console.error("Error cargando capa analitica", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const { data, error } = await supabase.schema('sourcing').from('v_analitica_productos')
                .select('Producto, "Nota de Producto", Prioridad, Proveedor, Responsable, Dpto, Categoria, Foto, "Notas Generales"')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) {
                alert("No hay información capturada para exportar.");
                return;
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Directorio e Historial");

            ws['!cols'] = [
                { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 25 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 50 },
            ];

            XLSX.writeFile(wb, `Reporte_Pequeño_Mundo_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error generando el Excel. Verifique sus permisos de red.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <ContenedorPagina>
            {/* ENCABEZADO */}
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <PieChart className="w-6 h-6 md:w-8 md:h-8 mr-3 text-red-600 hidden md:block" />
                        Capa Analítica
                    </h1>
                    <p className="text-sm font-bold text-gray-400 tracking-widest uppercase mt-1">Cuadro de Mando Ejecutivo</p>
                </div>

                <button
                    onClick={handleExportExcel}
                    disabled={loading || isExporting}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-6 py-3 rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    <span>{isExporting ? 'Procesando XLSX...' : 'Descargar Reporte'}</span>
                </button>
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
                                <h3 className="font-black text-gray-700 tracking-tight text-lg">Distribución por Etapa (Funnel)</h3>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={datosEstado}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {datosEstado.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value) => <span className="text-xs font-bold text-gray-600">{value}</span>}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* GRÁFICO 2 */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center space-x-2 mb-6">
                                <BarChart4 className="w-5 h-5 text-gray-400" />
                                <h3 className="font-black text-gray-700 tracking-tight text-lg">Top Departamentos</h3>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={datosDpto} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="productos" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* TABLA BASE */}
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <h3 className="font-black text-gray-700 tracking-tight text-lg">Resumen Global</h3>
                        </div>
                        <p className="text-gray-500 text-sm max-w-2xl">
                            Este panel extrae directamente la recolección de todo el equipo en terreno de los servidores nativos. El acceso directo de esta información le pertenece únicamente a los gerentes y directores de su nivel.
                        </p>
                    </div>
                </>
            )}
        </ContenedorPagina>
    );
}