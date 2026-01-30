// Sistema de Versionamiento de Proyecta
// Formato: MAJOR.MINOR (incrementa MINOR con cada cambio)

export const VERSION = {
    number: '1.0003',
    date: '2026-01-30',
    description: 'Corrección formato código de ticket en PAN_TICKET_ALTA'
};

// Registrar versión en consola
console.log(`%c🚀 Proyecta v${VERSION.number}`, 'color: #2563eb; font-weight: bold; font-size: 14px;');
console.log(`%c📅 ${VERSION.date} - ${VERSION.description}`, 'color: #64748b; font-size: 12px;');
