import { supabase } from './supabase';

export const MesaService = {
  
  async listarMesas() {
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('numero', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async agregarMesa(mesaData: { 
    numero: number, 
    comensales: number, 
    tipo: string, 
    foto: string, 
    qr_data: string 
  }) {
    const { data, error } = await supabase
      .from('mesas')
      .insert([
        { 
          numero: mesaData.numero, 
          comensales: mesaData.comensales, 
          tipo: mesaData.tipo, 
          foto: mesaData.foto, 
          qr_data: mesaData.qr_data,
          estado: 'Libre' 
        }
      ]);
    
    if (error) throw error;
    return data;
  }
};