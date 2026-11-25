// ============================================================================
// Datos INVENTADOS para el modo demostración. Ningún nombre, código, serie ni
// documento corresponde a personas o equipos reales.
// ============================================================================

// Usuarios con los que se puede entrar a la demo (cualquier contraseña).
export const USUARIOS_DEMO = [
  { id: 1, name: 'Ana Lucía Morales', username: 'demo.admin', role: 'admin' },
  { id: 3, name: 'Sofía Herrera', username: 'demo.consulta', role: 'user' },
]

const t = (fecha) => new Date(fecha).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const s = { created_at: t('2026-08-03T15:00:00Z'), updated_at: t('2026-08-03T15:00:00Z') }
const FIRMA_A = 'signatures/demo-firma-1.png'
const FIRMA_B = 'signatures/demo-firma-2.png'

export const DATOS_DEMO = {
  users: [
    { id: 1, name: 'Ana Lucía Morales', username: 'demo.admin', role: 'admin' },
    { id: 2, name: 'Javier Castillo', username: 'j.castillo', role: 'admin' },
    { id: 3, name: 'Sofía Herrera', username: 'demo.consulta', role: 'user' },
  ],

  departments: [
    'TIC', 'Recursos Humanos', 'Contabilidad', 'Producción', 'Bodega', 'Calidad', 'Compras', 'Mantenimiento',
  ].map((name, i) => ({ id: i + 1, name, ...s })),

  brands: ['Dell', 'HP', 'Lenovo', 'Logitech', 'Samsung', 'Epson', 'Genius', 'Kingston'].map((name, i) => ({ id: i + 1, name, ...s })),

  employees: [
    { id: 1, code: 'DEMO-001', name: 'Carlos Ramírez', department_id: 3 },
    { id: 2, code: 'DEMO-002', name: 'María Fernanda López', department_id: 2 },
    { id: 3, code: 'DEMO-003', name: 'José Antonio Pérez', department_id: 4 },
    { id: 4, code: 'DEMO-004', name: 'Gabriela Ruiz', department_id: 6 },
    { id: 5, code: 'DEMO-005', name: 'Luis Enrique Soto', department_id: 5 },
    { id: 6, code: 'DEMO-006', name: 'Daniela Méndez', department_id: 7 },
    { id: 7, code: 'DEMO-007', name: 'Héctor Gómez', department_id: 8 },
    { id: 8, code: 'DEMO-008', name: 'Paola Rivas', department_id: 1 },
    { id: 9, code: 'DEMO-009', name: 'Ricardo Flores', department_id: 4 },
    { id: 10, code: 'DEMO-010', name: 'Valeria Ortiz', department_id: 3 },
  ].map((e) => ({ ...e, ...s })),

  equipments: [
    { id: 1, name: 'Laptop administrativa', brand_id: 1, model: 'Latitude 5440', serie: 'DEMO-LT-0001', type: 'laptop', original: true, is_used: false },
    { id: 2, name: 'Laptop de supervisión', brand_id: 3, model: 'ThinkPad E14', serie: 'DEMO-LT-0002', type: 'laptop', original: true, is_used: true },
    { id: 3, name: 'Laptop de oficina', brand_id: 2, model: 'ProBook 440 G10', serie: 'DEMO-LT-0003', type: 'laptop', original: true, is_used: false },
    { id: 4, name: 'Computadora de escritorio', brand_id: 1, model: 'OptiPlex 7010', serie: 'DEMO-PC-0001', type: 'desktop', original: true, is_used: true },
    { id: 5, name: 'Monitor 24"', brand_id: 5, model: 'S24C310', serie: 'DEMO-MN-0001', type: 'monitor', original: true, is_used: false },
    { id: 6, name: 'Monitor 22"', brand_id: 2, model: 'V22v G5', serie: 'DEMO-MN-0002', type: 'monitor', original: true, is_used: true },
    { id: 7, name: 'Mouse inalámbrico', brand_id: 4, model: 'M185', serie: 'DEMO-MS-0001', type: 'mouse', original: true, is_used: false },
    { id: 8, name: 'Mouse óptico', brand_id: 7, model: 'DX-110', serie: 'DEMO-MS-0002', type: 'mouse', original: false, is_used: false },
    { id: 9, name: 'Teclado USB', brand_id: 4, model: 'K120', serie: 'DEMO-TC-0001', type: 'keyboard', original: true, is_used: false },
    { id: 10, name: 'Teclado en español', brand_id: 7, model: 'KB-125', serie: 'DEMO-TC-0002', type: 'keyboard', original: true, is_used: true },
    { id: 11, name: 'Cargador de laptop', brand_id: 1, model: '65W USB-C', serie: 'DEMO-CG-0001', type: 'charger', original: true, is_used: false },
    { id: 12, name: 'Diadema con micrófono', brand_id: 4, model: 'H390', serie: 'DEMO-DM-0001', type: 'headset', original: true, is_used: false },
    { id: 13, name: 'Cámara web', brand_id: 4, model: 'C270', serie: 'DEMO-CW-0001', type: 'webcam', original: true, is_used: false },
    { id: 14, name: 'Impresora multifuncional', brand_id: 6, model: 'EcoTank L3250', serie: 'DEMO-IM-0001', type: 'printer', original: true, is_used: true },
    { id: 15, name: 'Teléfono IP', brand_id: 2, model: 'Demo IP-200', serie: 'DEMO-TL-0001', type: 'phone', original: true, is_used: false },
    { id: 16, name: 'Adaptador USB-C a HDMI', brand_id: 8, model: 'Nucleum', serie: 'DEMO-AD-0001', type: 'adapter', original: true, is_used: false },
    { id: 17, name: 'Laptop de respaldo', brand_id: 3, model: 'IdeaPad 3', serie: 'DEMO-LT-0004', type: 'laptop', original: true, is_used: true },
    { id: 18, name: 'Cable HDMI 1.8 m', brand_id: 8, model: 'HDMI-18', serie: 'DEMO-CB-0001', type: 'cable', original: false, is_used: false },
  ].map((e) => ({ ...e, registerdBy: 1, ...s, deleted_at: null })),

  caracteristics: [
    [1, 'Procesador', 'Intel Core i5 de 13.ª generación'], [1, 'Memoria RAM', '16 GB'], [1, 'Almacenamiento', 'SSD 512 GB'],
    [2, 'Procesador', 'AMD Ryzen 5'], [2, 'Memoria RAM', '8 GB'], [2, 'Almacenamiento', 'SSD 256 GB'],
    [3, 'Procesador', 'Intel Core i5'], [3, 'Memoria RAM', '16 GB'],
    [4, 'Procesador', 'Intel Core i7'], [4, 'Memoria RAM', '16 GB'], [4, 'Almacenamiento', 'SSD 1 TB'],
    [5, 'Resolución', '1920 × 1080'], [6, 'Resolución', '1920 × 1080'],
    [17, 'Procesador', 'Intel Core i3'], [17, 'Memoria RAM', '8 GB'],
  ].map(([equipment_id, name, description], i) => ({ id: i + 1, equipment_id, name, description, ...s })),

  delivery_documents: [
    { id: 1, location: 1, delivery_date: t('2026-08-12T15:20:00Z'), employee_id: 1, user_id: 1, observations: 'Entrega por ingreso de personal.' },
    { id: 2, location: 2, delivery_date: t('2026-08-19T16:05:00Z'), employee_id: 3, user_id: 2, observations: null },
    { id: 3, location: 1, delivery_date: t('2026-08-26T14:40:00Z'), employee_id: 2, user_id: 1, observations: 'Equipo para teletrabajo.' },
    { id: 4, location: 1, delivery_date: t('2026-09-02T17:10:00Z'), employee_id: 4, user_id: 1, observations: null },
    { id: 5, location: 2, delivery_date: t('2026-09-09T15:30:00Z'), employee_id: 7, user_id: 2, observations: 'Reemplazo de equipo dañado.' },
    { id: 6, location: 1, delivery_date: t('2026-09-16T16:45:00Z'), employee_id: 6, user_id: 1, observations: null },
  ].map((d, i) => ({ ...d, responsable_signature: i % 2 ? FIRMA_B : FIRMA_A, administrador_signature: i % 2 ? FIRMA_A : FIRMA_B })),

  delivery_document_details: [
    [1, 1, 1, null], [2, 1, 11, null], [3, 1, 7, null],
    [4, 2, 4, 'Con cable de poder.'], [5, 2, 6, null], [6, 2, 10, null],
    [7, 3, 2, 'Presenta un rayón leve en la tapa.'], [8, 3, 12, null],
    [9, 4, 3, null], [10, 4, 13, null],
    [11, 5, 14, null],
    [12, 6, 17, null], [13, 6, 8, null],
  ].map(([id, delivery_document_id, equipment_id, observations]) => ({ id, delivery_document_id, equipment_id, observations, ...s })),

  return_documents: [
    { id: 1, return_date: t('2026-09-05T15:00:00Z'), delivery_document_id: 3, user_id: 1, observations: 'Devolución por fin de teletrabajo.' },
    { id: 2, return_date: t('2026-09-23T16:15:00Z'), delivery_document_id: 6, user_id: 2, observations: null },
  ].map((d) => ({ ...d, responsable_signature: FIRMA_A, administrador_signature: FIRMA_B })),

  return_document_details: [
    { id: 1, return_document_id: 1, delivery_document_detail_id: 7, observations: 'Se devuelve en buen estado.' },
    { id: 2, return_document_id: 1, delivery_document_detail_id: 8, observations: null },
    { id: 3, return_document_id: 2, delivery_document_detail_id: 13, observations: 'El botón derecho falla.' },
  ],
}
