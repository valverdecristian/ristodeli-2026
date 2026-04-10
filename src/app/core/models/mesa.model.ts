export interface Mesa {
    id?: string;
    numero: number;
    comensales: number;
    tipo: 'Estándar' | 'VIP' | 'Discapacitados';
    qr_data?: string; // Aca se guarda lo que el QR va a leer
    estado?: string;
}