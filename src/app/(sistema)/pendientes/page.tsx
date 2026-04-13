import BandejaPendientes from "@/components/pendientes/BandejaPendientes";

export default function PendientesPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24 animate-in fade-in duration-300">
            <div className="max-w-md mx-auto">
                <header className="mb-8 pt-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        Mis Pendientes
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Productos capturados en feria pendientes de enriquecer.
                    </p>
                </header>

                <main>
                    <BandejaPendientes />
                </main>
            </div>
        </div>
    );
}