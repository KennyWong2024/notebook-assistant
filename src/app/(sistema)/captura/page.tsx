import FormularioCaptura from "@/components/captura/FormularioCaptura";

export default function CapturaPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            <div className="max-w-md mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Captura Rápida</h1>
                    <p className="text-gray-500 font-medium">Modo Stand de Feria</p>
                </header>

                <FormularioCaptura />
            </div>
        </div>
    );
}