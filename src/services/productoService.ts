import { supabase } from './SupabaseClient';

export type TipoProducto = 'plato' | 'bebida' | 'postre';

export interface NuevoProducto {
  nombre: string;
  descripcion: string;
  tiempo_elaboracion: number;
  precio: number;
  fotos: string[];
  tipo: TipoProducto;
}

export const ProductoService = {

  /**
   * Obtiene TODOS los productos disponibles de la carta, sin filtro de categoría.
   * Ordenados por tipo (plato → bebida → postre) para una lectura natural.
   * Usada por la vista de carta del cliente.
   */
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('estado', 'disponible')
      .order('tipo', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // /**
  //  * Obtiene productos de una única categoría con estado 'disponible'.
  //  * Útil para el filtro por tab (Platos / Bebidas / Postres) en la carta del cliente.
  //  */
  // async obtenerPorCategoria(categoria: TipoProducto) {
  //   const { data, error } = await supabase
  //     .from('productos')
  //     .select('*')
  //     .eq('tipo', categoria)
  //     .eq('estado', 'disponible')
  //     .order('nombre', { ascending: true });

  //   if (error) throw error;
  //   return data || [];
  // },

  /**
   * Obtiene productos filtrando por uno o más tipos (plato, bebida, postre).
   * Usada por VisorProductos para renderizar el menú según el rol del operador.
   */
  async obtenerPorCategorias(categorias: TipoProducto[]) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .in('tipo', categorias);

    if (error) throw error;
    return data || [];
  },

  /**
   * Inserta un nuevo producto en la tabla `productos`.
   * Las fotos ya deben estar subidas a Storage y sus URLs públicas deben pasarse en `fotos[]`.
   * Lanza error con código '23505' si el nombre ya existe en esa categoría (constraint unique).
   */
  async crear(producto: NuevoProducto) {
    const { error } = await supabase
      .from('productos')
      .insert([{
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        tiempo_elaboracion: producto.tiempo_elaboracion,
        precio: producto.precio,
        fotos: producto.fotos,
        tipo: producto.tipo,
        estado: 'disponible',
      }]);

    if (error) throw error;
  },
};
