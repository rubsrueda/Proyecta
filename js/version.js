// Sistema de Versionamiento de Proyecta
// Formato: MAJOR.MINOR (incrementa MINOR con cada cambio)

export const VERSION = {
    number: '1.0002',
    date: '2026-01-30',
    description: 'Gestión de contratos: edición, estado de facturación y validaciones'
};

// Registrar versión en consola
console.log(`%c🚀 Proyecta v${VERSION.number}`, 'color: #2563eb; font-weight: bold; font-size: 14px;');
console.log(`%c📅 ${VERSION.date} - ${VERSION.description}`, 'color: #64748b; font-size: 12px;');
