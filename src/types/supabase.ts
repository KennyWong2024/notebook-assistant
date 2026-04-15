import {
    Profile,
    Fair,
    Provider,
    ProductProspect,
    Attachment,
    CatalogDepartment,
    CatalogCategory,
    CatalogAssetType,
    FairAssignment,
    ViewPendientesBandeja,
    ViewHistorialProducto,
    ViewDirectorioProveedor
} from './database';

export interface Database {
    public: {
        Tables: Record<string, any>; // Fallback publico
        Views: Record<string, any>;
    };
    sourcing: {
        Tables: {
            perfiles: {
                Row: Profile;
                Insert: Partial<Profile>;
                Update: Partial<Profile>;
            };
            ferias: {
                Row: Fair;
                Insert: Partial<Fair>;
                Update: Partial<Fair>;
            };
            proveedores: {
                Row: Provider;
                Insert: Partial<Provider>;
                Update: Partial<Provider>;
            };
            productos_prospecto: {
                Row: ProductProspect;
                Insert: Partial<ProductProspect>;
                Update: Partial<ProductProspect>;
            };
            activos_adjuntos: {
                Row: Attachment;
                Insert: Partial<Attachment>;
                Update: Partial<Attachment>;
            };
            catalogo_departamentos: {
                Row: CatalogDepartment;
                Insert: Partial<CatalogDepartment>;
                Update: Partial<CatalogDepartment>;
            };
            catalogo_categorias: {
                Row: CatalogCategory;
                Insert: Partial<CatalogCategory>;
                Update: Partial<CatalogCategory>;
            };
            catalogo_tipos_activo: {
                Row: CatalogAssetType;
                Insert: Partial<CatalogAssetType>;
                Update: Partial<CatalogAssetType>;
            };
            asignaciones_feria: {
                Row: FairAssignment;
                Insert: Partial<FairAssignment>;
                Update: Partial<FairAssignment>;
            };
            proveedor_feria_interacciones: {
                Row: {
                    id: string;
                    id_proveedor: string;
                    id_feria: string;
                    notas_generales?: string;
                    email_contacto?: string;
                    creado_por?: string;
                    created_at: string;
                };
                Insert: any;
                Update: any;
            };
        };
        Views: {
            v_resumen_ferias: {
                Row: any;
            };
            v_historial_productos: {
                Row: ViewHistorialProducto;
            };
            v_directorio_proveedores: {
                Row: ViewDirectorioProveedor;
            };
            v_pendientes_bandeja: {
                Row: ViewPendientesBandeja;
            };
        };
        Functions: Record<string, any>;
        Enums: Record<string, any>;
    };
}
