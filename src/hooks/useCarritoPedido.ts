import { useMemo, useState } from 'react';
import { ItemCarrito } from '../services/pedidoService';

export function useCarritoPedido() {
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

    // Agregar o modificar cantidad de un producto en el carrito
    const actualizarCantidad = (producto: Omit<ItemCarrito, 'cantidad'>, cambio: number) => {
        setCarrito((carritoActual) => {
            const indice = carritoActual.findIndex(i => i.producto_nombre === producto.producto_nombre);

            if (indice > -1) {
                const nuevoCarrito = [...carritoActual];
                const nuevaCantidad = nuevoCarrito[indice].cantidad + cambio;

                if (nuevaCantidad <= 0) {
                    nuevoCarrito.splice(indice, 1); // Si baja de 1, se remueve
                } else {
                    nuevoCarrito[indice].cantidad = nuevaCantidad;
                }
                return nuevoCarrito;
            }

            if (cambio > 0) {
                return [...carritoActual, { ...producto, cantidad: 1 }];
            }
            return carritoActual;
        });
    };

    const importeTotal = useMemo(() => {
        return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }, [carrito]);

    const tiempoEstimadoMaximo = useMemo(() => {
        if (carrito.length === 0) return 0;
        return Math.max(...carrito.map(item => item.tiempo_elaboracion));
    }, [carrito]);

    const vaciarCarrito = () => setCarrito([]);

    return {
        carrito,
        actualizarCantidad,
        importeTotal,
        tiempoEstimadoMaximo,
        vaciarCarrito
    };
}