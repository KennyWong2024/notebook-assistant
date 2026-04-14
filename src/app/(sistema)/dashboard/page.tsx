import BandejaPendientes from "@/components/pendientes/BandejaPendientes";

export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-300">
            <BandejaPendientes />
        </div>
    );
}