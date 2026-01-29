// UBICACIÓN: js/services/financeService.js
import { supabase } from '../config.js';
import { State } from '../core/state.js';

export const FinanceService = {

    /**
     * Busca la tarifa activa para un rol específico en un contrato.
     */
    async obtenerTarifa(contratoId, rolId) {
        if (!contratoId || !rolId) return null;

        try {
            // Buscamos una tarifa que coincida con el contrato y el rol
            const { data, error } = await supabase
                .from('pr_com_tarifas')
                .select('costo_interno, precio_venta, id_tarifa')
                .eq('id_contrato', contratoId)
                .eq('rol_seniority', rolId) 
                .single(); // Esperamos un solo resultado

            if (error) {
                // Es normal que de error si no hay tarifa definida, no es crítico
                console.warn(`[FinanceService] Sin tarifa para Contrato ${contratoId} / Rol ${rolId}`);
                return null;
            }

            return data;
        } catch (err) {
            console.error("[FinanceService] Error:", err);
            return null;
        }
    },

    /**
     * Obtiene el rol de facturación del usuario actual.
     * Si la base de datos no tiene el campo 'rol_facturacion' aún, 
     * usamos un valor por defecto para que no rompa.
     */
    getUsuarioRolFacturacion() {
        // Leemos del State global que cargamos al login
        return State.profile.rol_facturacion || 'Consultor Senior'; 
        // ^ CAMBIA 'Consultor Senior' por el nombre exacto que usaste en RateCards
    }
};