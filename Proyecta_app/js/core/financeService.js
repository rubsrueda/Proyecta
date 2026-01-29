import { supabase } from '../config.js';
import { State } from '../core/state.js';

export const FinanceService = {

    /**
     * Calcula la rentabilidad de una hora trabajada basada en el CONTRATO y el USUARIO.
     * @param {string} contratoId - ID del contrato padre.
     * @param {object} usuario - Objeto usuario (debe tener costo_hora_interno).
     */
    async calcularDesempeno(contratoId, usuario) {
        if (!contratoId || !usuario) return null;

        try {
            // 1. Obtener datos del CONTRATO (El Rey del Precio)
            const { data: contrato, error } = await supabase
                .from('pr_com_contratos')
                .select('monto_total, horas_totales, moneda')
                .eq('id_contrato', contratoId)
                .single();

            if (error || !contrato) {
                console.warn("No se encontró contrato para calcular precio.");
                return null;
            }

            // 2. Calcular PRECIO DE VENTA (Blended Rate)
            // Fórmula: Monto / Horas = Precio por Hora
            let precioVentaHora = 0;
            if (contrato.horas_totales > 0) {
                precioVentaHora = contrato.monto_total / contrato.horas_totales;
            }

            // 3. Obtener COSTO REAL (Del Consultor)
            const costoRealHora = parseFloat(usuario.costo_hora_interno || 0);

            return {
                precio_venta_hora: precioVentaHora, // Ej: 500
                costo_real_hora: costoRealHora,     // Ej: 250
                margen_hora: precioVentaHora - costoRealHora, // Ej: 250
                moneda: contrato.moneda
            };

        } catch (err) {
            console.error("[FinanceService] Error:", err);
            return null;
        }
    }
};