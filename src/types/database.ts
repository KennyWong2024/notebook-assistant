export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Profile {
    id: string;
    email: string;
    nombre_completo: string;
    rol: 'director' | 'gerente' | 'comprador' | 'it';
    departamento?: string;
    estado_activo: boolean;
    created_at: string;
}

export interface Fair {
    id: string;
    nombre: string;
    region?: string;
    pais?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    creado_por?: string;
    estado_activo: boolean;
    created_at: string;
}

export interface Provider {
    id: string;
    nombre_empresa: string;
    contacto_principal?: string;
    email_contacto?: string;
    pais_origen?: string;
    sap_bp_id?: string;
    creado_por?: string;
    estado_activo: boolean;
    created_at: string;
}

export interface ProductProspect {
    id: string;
    codigo_trazabilidad: string;
    id_proveedor: string;
    id_feria: string;
    creado_por: string;
    nombre_rapido: string;
    precio_referencia?: number;
    moneda: string;
    descripcion_libre?: string;
    id_departamento?: number;
    id_categoria?: number;
    incoterm?: string;
    shelf_life?: string;
    pidio_muestra: boolean;
    sap_material_id?: string;
    estado_sincronizacion_sap: 'no_sincronizado' | 'en_proceso' | 'sincronizado_exito' | 'error';
    fecha_sincronizacion_sap?: string;
    estado_compra: 'borrador' | 'completado' | 'muestra_solicitada' | 'aprobado_gerencia' | 'orden_colocada' | 'descartado';
    estado_activo: boolean;
    created_at: string;
    updated_at: string;
    prioridad?: number;
}

export interface Attachment {
    id: string;
    url_storage: string;
    id_tipo_activo: number;
    creado_por?: string;
    id_proveedor?: string;
    id_producto?: string;
    id_feria?: string;
    estado_activo: boolean;
    created_at: string;
}

export interface CatalogDepartment {
    id: number;
    nombre: string;
    estado_activo: boolean;
}

export interface CatalogCategory {
    id: number;
    id_departamento: number;
    nombre: string;
    estado_activo: boolean;
}

export interface CatalogAssetType {
    id: number;
    nombre_tipo: string;
    descripcion?: string;
}

export interface FairAssignment {
    id: string;
    id_feria: string;
    id_usuario: string;
    asignado_por?: string;
    estado_activo: boolean;
    created_at: string;
}

export type ProductoPendiente = {
    id: string;
    codigo_trazabilidad: string;
    nombre_rapido: string | null;
    precio_referencia: number | null;
    moneda: string;
    proveedor: string;
    feria: string;
    foto_url: string | null;
    prioridad: number | null;
};

export interface ViewPendientesBandeja {
    id: string;
    codigo_trazabilidad: string;
    nombre_rapido: string | null;
    precio_referencia: number | null;
    moneda: string | null;
    prioridad: number | null;
    estado_compra: string;
    creado_por: string;
    proveedor: string | null;
    feria: string | null;
    foto_url: string | null;
}

export interface ViewHistorialProducto {
    id: string;
    codigo_trazabilidad: string;
    nombre_rapido: string | null;
    precio_referencia: number | null;
    moneda: string | null;
    estado_compra: 'completado' | 'muestra_solicitada' | 'aprobado_gerencia' | 'orden_colocada' | 'descartado';
    estado_sincronizacion_sap: 'no_sincronizado' | 'en_proceso' | 'sincronizado_exito' | 'error';
    proveedor: string | null;
    feria: string | null;
    categoria: string | null;
    departamento: string | null;
    foto_principal_url: string | null;
}