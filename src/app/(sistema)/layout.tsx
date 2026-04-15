"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard, Map, Briefcase, Building2, Plus,
    User, ShieldAlert, LogOut, ChevronDown, BookOpen, PieChart
} from "lucide-react";

import SyncEngine from "@/components/pwa/SyncEngine";
import BotonFlotante from "@/components/ui/BotonFlotante";

export default function SistemaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.schema('sourcing').from('perfiles').select('rol, nombre_completo').eq('id', user.id).single();
                if (data) {
                    setUserRole(data.rol);
                    setUserName(data.nombre_completo);
                }
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const getSidebarClass = (path: string) => {
        const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
        return `flex items-center space-x-3 p-3 rounded-xl transition-colors ${isActive ? "bg-red-50 text-red-600 font-bold" : "text-gray-600 hover:bg-gray-100 font-medium"}`;
    };

    const getMobileClass = (path: string) => {
        const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
        return `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-red-600" : "text-gray-400 hover:text-gray-900"}`;
    };

    const initials = userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PM';

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">

            {/* =========================================
                 HEADER GLOBAL (Móvil y Desktop) - EXTENDIDO 100%
            ========================================= */}
            <header className="bg-white px-5 py-4 border-b border-gray-200 flex items-center justify-between z-30 shadow-sm relative shrink-0">

                {/* Logo Global Clickable */}
                <Link href="/dashboard" className="flex items-center">
                    <img
                        src="/logo.png"
                        alt="Pequeño Mundo"
                        className="h-8 md:h-10 w-auto object-contain cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    />
                </Link>

                <div className="flex-1 flex justify-end px-4">
                    <SyncEngine />
                </div>

                {/* MENÚ DE USUARIO DROPDOWN */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="relative z-50 flex items-center space-x-2 hover:bg-gray-50 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-gray-200 focus:outline-none"
                    >
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm border border-red-200">
                            {initials}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsDropdownOpen(false)}
                        ></div>
                    )}

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                                <p className="text-sm font-bold text-gray-900 truncate">{userName || 'Cargando...'}</p>
                                <p className="text-xs text-gray-500 capitalize">{userRole || '...'}</p>
                            </div>

                            <div className="p-2">
                                <Link href="/perfil" onClick={() => setIsDropdownOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">Mi Perfil</span>
                                </Link>

                                {(userRole === 'it' || userRole === 'director') && (
                                    <Link href="/admin" onClick={() => setIsDropdownOpen(false)} className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span className="font-medium">Gestión de Accesos</span>
                                    </Link>
                                )}
                            </div>

                            <div className="p-2 border-t border-gray-100">
                                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-colors">
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* =========================================
                     DESKTOP SIDEBAR (Debajo del Header)
                ========================================= */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 relative z-20">
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
                        <Link href="/dashboard" className={getSidebarClass("/dashboard")}>
                            <LayoutDashboard className="w-5 h-5" /> <span>Pendientes</span>
                        </Link>
                        <Link href="/analitica" className={getSidebarClass("/analitica")}>
                            <PieChart className="w-5 h-5" /> <span>Analítica y Reportes</span>
                        </Link>
                        <Link href="/historico" className={getSidebarClass("/historico")}>
                            <BookOpen className="w-5 h-5" /> <span>Histórico</span>
                        </Link>
                        <Link href="/proveedores" className={getSidebarClass("/proveedores")}>
                            <Building2 className="w-5 h-5" /> <span>Proveedores</span>
                        </Link>
                        <Link href="/ferias" className={getSidebarClass("/ferias")}>
                            <Briefcase className="w-5 h-5" /> <span>Ferias</span>
                        </Link>
                    </nav>
                </aside>

                {/* =========================================
                     MAIN CONTENT AREA
                ========================================= */}
                <main className="flex-1 overflow-y-auto bg-gray-50 pb-24 md:pb-0">
                    {children}
                </main>
            </div>

            {/* =========================================
                 FAB: BOTÓN GLOBAL DE CAPTURA (Móvil)
            ========================================= */}
            {pathname !== '/ferias' && (
                <BotonFlotante href="/captura" />
            )}

            {/* =========================================
                 MOBILE BOTTOM NAV (4 Elementos)
            ========================================= */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex justify-between items-center px-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">

                <Link href="/dashboard" className={`w-1/4 ${getMobileClass("/dashboard")}`}>
                    <LayoutDashboard className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">Pendientes</span>
                </Link>

                <Link href="/historico" className={`w-1/4 ${getMobileClass("/historico")}`}>
                    <BookOpen className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">Histórico</span>
                </Link>

                <Link href="/proveedores" className={`w-1/4 ${getMobileClass("/proveedores")}`}>
                    <Building2 className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">Directorio</span>
                </Link>

                <Link href="/ferias" className={`w-1/4 ${getMobileClass("/ferias")}`}>
                    <Briefcase className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">Ferias</span>
                </Link>

            </nav>
        </div>
    );
}