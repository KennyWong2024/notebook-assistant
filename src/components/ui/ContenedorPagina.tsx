import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function ContenedorPagina({ children }: Props) {
    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 w-full animate-in fade-in duration-500">
            {children}
        </div>
    );
}