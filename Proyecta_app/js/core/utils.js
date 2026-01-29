// js/core/utils.js

export const Utils = {
    // Formato de moneda (Ej: $1,200.50 USD)
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount || 0);
    },

    // Formato de fecha corta (DD/MM/YYYY)
    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    },

    // Carga scripts CSS dinámicamente (por si una pantalla necesita estilos propios)
    loadCSS(href) {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    },

    // Pausa artificial (útil para UX en cargas muy rápidas)
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};