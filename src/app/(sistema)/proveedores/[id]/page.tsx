import ShowroomProveedor from "@/components/proveedores/ShowroomProveedor";

export default async function ShowroomPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return <ShowroomProveedor idProveedor={id} />;
}