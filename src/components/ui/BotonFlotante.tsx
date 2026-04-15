import Link from "next/link";
import { Plus } from "lucide-react";

interface Props {
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
}

export default function BotonFlotante({ onClick, href, icon }: Props) {
    const contenido = (
        <div className="bg-red-600 text-white p-4 rounded-full shadow-xl shadow-red-200/50 flex items-center justify-center transform transition-transform active:scale-95 border-4 border-white/80">
            {icon ? icon : <Plus className="w-7 h-7 stroke-[3]" />}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-center group outline-none">
                {contenido}
            </Link>
        );
    }

    return (
        <button type="button" onClick={onClick} className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-center group outline-none">
            {contenido}
        </button>
    );
}