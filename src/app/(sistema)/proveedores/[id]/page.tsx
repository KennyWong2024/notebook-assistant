import ShowroomProveedor from "@/components/proveedores/ShowroomProveedor";

export default async function ShowroomPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen animate-in fade-in duration-300">
            <ShowroomProveedor idProveedor={id} />
        </div>
    );
}