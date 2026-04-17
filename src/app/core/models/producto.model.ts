export interface Producto {
    id?: string;
    nombre: string;
    descripcion: string;
    tiempo_elaboracion: number;
    precio: number;
    fotos: string[]; // URLs de las 3 fotos
    tipo: 'plato' | 'bebida' | 'postre';
    estado?: 'disponible' | 'agotado';
}