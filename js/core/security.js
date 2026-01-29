// js/core/security.js
import { State } from './state.js';

export const Security = {
    /**
     * Verifica si el usuario puede entrar a una pantalla
     */
    canAccess(screenCode) {
        return !!State.screenMap[screenCode];
    },

    /**
     * Devuelve el nivel de acceso (1, 2, 3)
     */
    getLevel(screenCode) {
        const screen = State.screenMap[screenCode];
        return screen ? screen.level : 0;
    },

    /**
     * Helpers rápidos para la UI
     */
    canEdit(screenCode) {
        return this.getLevel(screenCode) >= 2; // Nivel 2 o 3
    },

    canDelete(screenCode) {
        return this.getLevel(screenCode) === 3; // Solo Nivel 3
    }
};