// ============================================================================
// MODO DEMOSTRACIÓN (VITE_DEMO=true)
//
// API simulada en el navegador: intercepta las llamadas a la API Laravel
// (/api/...) y responde con datos INVENTADOS guardados en memoria, con el
// mismo formato { statusCode, message, data } y los mismos recursos que el
// backend real. No contiene información real de la empresa. Los cambios se
// pierden al recargar la página.
// ============================================================================

import { DATOS_DEMO, USUARIOS_DEMO } from './datosDemo.js'

const copia = (v) => JSON.parse(JSON.stringify(v))
let db = copia(DATOS_DEMO)
let sesionRol = 'admin'
let sesionUsuarioId = 1

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const PLANTAS = { 1: 'Planta Tejar', 2: 'Planta Parramos' }
const iso = (fecha) => new Date(fecha).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
const dos = (n) => String(n).padStart(2, '0')

// Mismo formato que AssignmentResource en Laravel: 'd-m-Y h:m:s A'
// (en PHP la "m" del medio también es el mes; se respeta tal cual).
function fechaAsignacion(fecha) {
  const d = new Date(fecha)
  const h = d.getHours() % 12 || 12
  return `${dos(d.getDate())}-${dos(d.getMonth() + 1)}-${d.getFullYear()} ${dos(h)}:${dos(d.getMonth() + 1)}:${dos(d.getSeconds())} ${d.getHours() < 12 ? 'AM' : 'PM'}`
}

function sello() {
  const ahora = iso(Date.now())
  return { created_at: ahora, updated_at: ahora }
}

const siguienteId = (lista) => lista.reduce((max, x) => Math.max(max, x.id), 0) + 1
const porId = (lista, id) => lista.find((x) => String(x.id) === String(id))

function respuesta(status, cuerpo) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
const ok = (data, message = 'Operación realizada (demo)', status = 200) =>
  respuesta(status, { statusCode: status, message, data })
const noEncontrado = (que = 'Registro') => respuesta(404, { statusCode: 404, message: `${que} no encontrado` })
const invalido = (errors) =>
  respuesta(422, { statusCode: 422, message: Object.values(errors)[0][0], errors })
const prohibido = () => respuesta(403, { statusCode: 403, message: 'No autorizado: se requiere rol admin' })

// Paginación igual que paginateOrAll: con `limit` pagina; sin él, todo.
function paginarOTodo(items, params, recurso = (x) => x) {
  const limit = params.get('limit')
  if (limit == null) return items.map(recurso)
  const tam = Math.max(1, Number(limit) || 15)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / tam))
  const currentPage = Math.min(Math.max(1, Number(params.get('page')) || 1), lastPage)
  const data = items.slice((currentPage - 1) * tam, currentPage * tam).map(recurso)
  return { __paginado: true, data, total, currentPage, lastPage }
}

function okListado(resultado, message) {
  if (resultado && resultado.__paginado) {
    const { data, total, currentPage, lastPage } = resultado
    return respuesta(200, { statusCode: 200, message, data, total, currentPage, lastPage })
  }
  return ok(resultado, message)
}

// Token con forma de JWT (solo para que el aviso de sesión lea `exp`).
function tokenDemo() {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: sesionUsuarioId, exp, demo: true })}.demo`
}

function archivoComoDataUrl(archivo) {
  return new Promise((resolver) => {
    if (!archivo || typeof archivo === 'string') return resolver(archivo || null)
    const lector = new FileReader()
    lector.onload = () => resolver(lector.result)
    lector.onerror = () => resolver(null)
    lector.readAsDataURL(archivo)
  })
}

// items[0][equipment_id] -> [{ equipment_id }]
function itemsDeFormData(fd) {
  const items = []
  for (const [clave, valor] of fd.entries()) {
    const m = /^items\[(\d+)\]\[(\w+)\]$/.exec(clave)
    if (m) {
      items[Number(m[1])] = items[Number(m[1])] || {}
      items[Number(m[1])][m[2]] = valor
    }
  }
  return items.filter(Boolean)
}

// ---------------------------------------------------------------------------
// Relaciones y recursos (mismos campos que app/Http/Resources del backend)
// ---------------------------------------------------------------------------

const marca = (id) => porId(db.brands, id)
const depto = (id) => porId(db.departments, id)
const empleado = (id) => porId(db.employees, id)
const equipo = (id) => porId(db.equipments, id)
const usuario = (id) => porId(db.users, id)
const detalleEntrega = (id) => porId(db.delivery_document_details, id)
const devolucionDeDetalle = (detalleId) =>
  db.return_document_details.find((r) => String(r.delivery_document_detail_id) === String(detalleId)) || null
const detallesDe = (entregaId) =>
  db.delivery_document_details.filter((d) => String(d.delivery_document_id) === String(entregaId))
const estaAsignado = (equipoId) => {
  const ultimo = db.delivery_document_details
    .filter((d) => String(d.equipment_id) === String(equipoId))
    .sort((a, b) => b.id - a.id)[0]
  return Boolean(ultimo) && !devolucionDeDetalle(ultimo.id)
}

function estadoEntrega(entregaId) {
  const detalles = detallesDe(entregaId)
  const devueltos = detalles.filter((d) => devolucionDeDetalle(d.id)).length
  if (devueltos === 0) return 'pendiente'
  return devueltos < detalles.length ? 'parcial' : 'devuelto'
}

const rEmpleado = (e) => ({ id: e.id, code: e.code, name: e.name, department: depto(e.department_id)?.name ?? null })
const rUsuario = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role })
const rEquipo = (e) => ({
  id: e.id,
  name: e.name,
  brand: marca(e.brand_id)?.name ?? null,
  serie: e.serie,
  registeredBy: usuario(e.registerdBy)?.name ?? null,
  original: e.original ? 'Nuevo' : 'Usado',
  isAssigned: estaAsignado(e.id),
})
const rCaracteristica = (c) => ({ id: c.id, name: c.name, equipment: equipo(c.equipment_id)?.name ?? null })

function camposEquipo(eq) {
  return {
    equipment_id: eq.id,
    equipment_name: eq.name,
    equipment_brand: marca(eq.brand_id)?.name ?? null,
    equipment_model: eq.model,
    equipment_serie: eq.serie,
    equipment_type: eq.type,
  }
}

function rDetalleEntrega(d) {
  const eq = equipo(d.equipment_id)
  const dev = devolucionDeDetalle(d.id)
  return {
    id: d.id,
    delivery_document_id: d.delivery_document_id,
    ...camposEquipo(eq),
    is_used: eq.is_used ? 'Usado' : 'Nuevo',
    original: eq.original ? 'Original' : 'Copia',
    observations: d.observations ?? null,
    returned: dev !== null,
    return_document_id: dev?.return_document_id ?? null,
  }
}

function rEntrega(doc) {
  const emp = empleado(doc.employee_id)
  const detalles = detallesDe(doc.id)
  return {
    id: doc.id,
    location: PLANTAS[doc.location] ?? 'Planta desconocida',
    delivery_date: doc.delivery_date,
    responsable_signature: doc.responsable_signature,
    administrador_signature: doc.administrador_signature,
    employee_id: emp.id,
    employee_name: emp.name,
    employee_department: depto(emp.department_id)?.name ?? null,
    user_id: doc.user_id,
    user_name: usuario(doc.user_id)?.name ?? null,
    observations: doc.observations ?? null,
    status: estadoEntrega(doc.id),
    items_count: detalles.length,
    pending_items_count: detalles.filter((d) => !devolucionDeDetalle(d.id)).length,
    items: detalles.map(rDetalleEntrega),
  }
}

function rDetalleDevolucion(r) {
  const d = detalleEntrega(r.delivery_document_detail_id)
  const eq = equipo(d.equipment_id)
  return {
    id: r.id,
    return_document_id: r.return_document_id,
    delivery_document_detail_id: d.id,
    ...camposEquipo(eq),
    is_used: eq.is_used ? 'Usado' : 'Nuevo',
    original: eq.original ? 'Original' : 'Copia',
    observations: r.observations ?? null,
  }
}

function rDevolucion(doc) {
  const entrega = porId(db.delivery_documents, doc.delivery_document_id)
  const emp = empleado(entrega.employee_id)
  return {
    id: doc.id,
    return_date: doc.return_date,
    responsable_signature: doc.responsable_signature,
    administrador_signature: doc.administrador_signature,
    employee_id: emp.id,
    employee_name: emp.name,
    employee_department: depto(emp.department_id)?.name ?? null,
    location: PLANTAS[entrega.location] ?? 'Planta desconocida',
    observations: doc.observations ?? null,
    delivery_document_id: doc.delivery_document_id,
    delivery_document_status: estadoEntrega(entrega.id),
    user_id: doc.user_id,
    user_name: usuario(doc.user_id)?.name ?? null,
    items: db.return_document_details.filter((r) => String(r.return_document_id) === String(doc.id)).map(rDetalleDevolucion),
  }
}

function rAsignacion(d) {
  const entrega = porId(db.delivery_documents, d.delivery_document_id)
  const emp = empleado(entrega.employee_id)
  const dev = devolucionDeDetalle(d.id)
  const docDev = dev ? porId(db.return_documents, dev.return_document_id) : null
  return {
    delivery_document_detail_id: d.id,
    delivery_document_id: entrega.id,
    delivery_date: fechaAsignacion(entrega.delivery_date),
    location: PLANTAS[entrega.location] ?? 'Planta desconocida',
    employee_id: emp.id,
    employee_name: emp.name,
    employee_department: depto(emp.department_id)?.name ?? null,
    ...camposEquipo(equipo(d.equipment_id)),
    observations: d.observations ?? null,
    returned: dev !== null,
    return_document_id: docDev?.id ?? null,
    return_date: docDev ? fechaAsignacion(docDev.return_date) : null,
    return_observations: dev?.observations ?? null,
  }
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

const desc = (a, b) => b.id - a.id

function catalogoSimple(lista, nombre, partes, metodo, body, params) {
  const [, id] = partes
  if (!id && metodo === 'GET') return okListado(paginarOTodo(lista, params), `${nombre} obtenidos`)
  if (!id && metodo === 'POST') {
    if (!body?.name?.trim()) return invalido({ name: ['El nombre es requerido'] })
    const nuevo = { id: siguienteId(lista), name: body.name.trim(), ...sello() }
    lista.push(nuevo)
    return ok(nuevo, `${nombre} creado`, 201)
  }
  const item = porId(lista, id)
  if (!item) return noEncontrado(nombre)
  if (metodo === 'GET') return ok(item)
  if (metodo === 'PUT') {
    if (!body?.name?.trim()) return invalido({ name: ['El nombre es requerido'] })
    Object.assign(item, { name: body.name.trim(), updated_at: iso(Date.now()) })
    return ok(item)
  }
  return null
}

async function atender(metodo, partes, params, body) {
  const [recurso, id, sub] = partes
  const esAdmin = sesionRol === 'admin'

  switch (recurso) {
    case 'login': {
      const u = USUARIOS_DEMO.find((x) => x.username === String(body?.username || '').trim().toLowerCase())
      if (!u || !body?.password) return respuesta(400, { statusCode: 400, message: 'Credenciales inválidas' })
      sesionRol = u.role
      sesionUsuarioId = u.id
      return ok({ name: u.name, role: u.role, token: tokenDemo() }, 'Sesión Iniciada Correctamente')
    }
    case 'check-status': {
      const u = usuario(sesionUsuarioId)
      return ok({ name: u?.name, role: u?.role, token: tokenDemo() })
    }
    case 'register':
    case 'users': {
      if (!esAdmin) return prohibido()
      if (metodo === 'GET' && !id) return ok([...db.users].sort((a, b) => a.name.localeCompare(b.name)).map(rUsuario))
      if (metodo === 'POST') {
        if (!body?.name || !body?.username) return invalido({ username: ['El usuario es requerido'] })
        if (db.users.some((u) => u.username === body.username)) return invalido({ username: ['El usuario ya existe'] })
        const nuevo = { id: siguienteId(db.users), name: body.name, username: body.username, role: body.role || 'user' }
        db.users.push(nuevo)
        return ok(rUsuario(nuevo), 'Usuario Creado Correctamente', 201)
      }
      const u = porId(db.users, id)
      if (!u) return noEncontrado('Usuario')
      if (metodo === 'GET') return ok(rUsuario(u))
      if (metodo === 'PUT') {
        Object.assign(u, { name: body.name ?? u.name, username: body.username ?? u.username, role: body.role ?? u.role })
        return ok(rUsuario(u))
      }
      break
    }
    case 'brands':
      return catalogoSimple(db.brands, 'Marca', partes, metodo, body, params)
    case 'departments':
      return catalogoSimple(db.departments, 'Departamento', partes, metodo, body, params)

    case 'equipments': {
      if (id === 'available') {
        let lista = db.equipments.filter((e) => !estaAsignado(e.id))
        const tipo = params.get('type')
        const q = (params.get('search') || '').toLowerCase()
        if (tipo) lista = lista.filter((e) => e.type === tipo)
        if (q) lista = lista.filter((e) => [e.name, e.serie, e.model].some((v) => String(v).toLowerCase().includes(q)))
        return ok(lista.map(rEquipo))
      }
      if (!id && metodo === 'GET') return okListado(paginarOTodo(db.equipments, params, rEquipo), 'Equipos Obtenidos Correctamente')
      if (!id && metodo === 'POST') {
        const faltan = ['name', 'model', 'brand_id', 'serie', 'type'].filter((c) => !String(body?.[c] ?? '').trim())
        if (faltan.length) return invalido(Object.fromEntries(faltan.map((c) => [c, ['Este campo es requerido']])))
        if (db.equipments.some((e) => e.serie === body.serie)) return invalido({ serie: ['La serie ya está registrada'] })
        const nuevo = {
          id: siguienteId(db.equipments),
          name: body.name, brand_id: Number(body.brand_id), original: Boolean(body.original), is_used: Boolean(body.is_used),
          model: body.model, serie: body.serie, type: body.type, registerdBy: sesionUsuarioId, ...sello(), deleted_at: null,
        }
        db.equipments.push(nuevo)
        return ok(nuevo, 'Equipo Creado Correctamente', 201)
      }
      const eq = equipo(id)
      if (!eq) return noEncontrado('Equipo')
      if (sub === 'history') {
        const lista = db.delivery_document_details.filter((d) => String(d.equipment_id) === String(eq.id)).sort(desc)
        return ok(lista.map(rAsignacion))
      }
      if (metodo === 'GET') return ok(eq)
      if (metodo === 'PUT') {
        if (estaAsignado(eq.id) && (body.serie !== eq.serie || body.type !== eq.type)) {
          return invalido({ serie: ['No se puede cambiar la serie ni el tipo de un equipo asignado'] })
        }
        Object.assign(eq, {
          name: body.name, brand_id: Number(body.brand_id), original: Boolean(body.original), is_used: Boolean(body.is_used),
          model: body.model, serie: body.serie, type: body.type, updated_at: iso(Date.now()),
        })
        return ok(eq)
      }
      break
    }

    case 'caracteristics': {
      if (!id && metodo === 'GET') {
        const eqId = params.get('equipmentId')
        const lista = eqId ? db.caracteristics.filter((c) => String(c.equipment_id) === String(eqId)) : db.caracteristics
        return okListado(paginarOTodo(lista, params, rCaracteristica), 'Características Obtenidas Correctamente')
      }
      if (!id && metodo === 'POST') {
        if (!body?.name?.trim()) return invalido({ name: ['El nombre es requerido'] })
        const nueva = { id: siguienteId(db.caracteristics), name: body.name, description: body.description ?? '', equipment_id: Number(body.equipment_id), ...sello() }
        db.caracteristics.push(nueva)
        return ok(nueva, 'Características Creadas Correctamente', 201)
      }
      const c = porId(db.caracteristics, id)
      if (!c) return noEncontrado('Característica')
      if (metodo === 'GET') return ok(c)
      if (metodo === 'PUT') {
        Object.assign(c, { name: body.name, description: body.description, equipment_id: Number(body.equipment_id), updated_at: iso(Date.now()) })
        return ok(c)
      }
      break
    }

    case 'employees': {
      if (!id && metodo === 'GET') return okListado(paginarOTodo(db.employees, params, rEmpleado), 'Empleados Obtenidos Correctamente')
      if (!id && metodo === 'POST') {
        if (!body?.name?.trim() || !body?.code?.trim()) return invalido({ name: ['El nombre y el código son requeridos'] })
        const nuevo = { id: siguienteId(db.employees), code: body.code, name: body.name, department_id: Number(body.department_id), ...sello() }
        db.employees.push(nuevo)
        return ok({ code: nuevo.code, name: nuevo.name, department_id: nuevo.department_id }, 'Empleado Creado Correctamente', 201)
      }
      const emp = empleado(id)
      if (!emp) return noEncontrado('Empleado')
      if (sub === 'equipments') {
        const lista = db.delivery_document_details
          .filter((d) => String(porId(db.delivery_documents, d.delivery_document_id)?.employee_id) === String(emp.id))
          .filter((d) => !devolucionDeDetalle(d.id))
          .sort(desc)
        return ok(lista.map(rAsignacion))
      }
      if (metodo === 'GET') return ok(emp)
      if (metodo === 'PUT') {
        Object.assign(emp, { code: body.code, name: body.name, department_id: Number(body.department_id), updated_at: iso(Date.now()) })
        return ok(emp)
      }
      break
    }

    case 'delivery_documents': {
      if (!id && metodo === 'GET') {
        let lista = [...db.delivery_documents].sort(desc)
        if (params.get('employeeId')) lista = lista.filter((d) => String(d.employee_id) === params.get('employeeId'))
        return okListado(paginarOTodo(lista, params, rEntrega), 'Documentos de Entrega Obtenidos Correctamente')
      }
      if (!id && metodo === 'POST') {
        if (!esAdmin) return prohibido()
        const items = itemsDeFormData(body)
        if (!body.get('employee_id')) return invalido({ employee_id: ['El empleado es requerido'] })
        if (!items.length) return invalido({ items: ['Debe entregar al menos un equipo'] })
        const ocupado = items.find((it) => estaAsignado(it.equipment_id))
        if (ocupado) return invalido({ 'items.0.equipment_id': ['El equipo ya está asignado'] })
        const doc = {
          id: siguienteId(db.delivery_documents),
          location: Number(body.get('location')) || 1,
          delivery_date: iso(Date.now()),
          responsable_signature: await archivoComoDataUrl(body.get('responsable_signature')),
          administrador_signature: await archivoComoDataUrl(body.get('administrador_signature')),
          employee_id: Number(body.get('employee_id')),
          user_id: sesionUsuarioId,
          observations: body.get('observations') || null,
        }
        db.delivery_documents.push(doc)
        for (const it of items) {
          db.delivery_document_details.push({
            id: siguienteId(db.delivery_document_details), delivery_document_id: doc.id,
            equipment_id: Number(it.equipment_id), observations: it.observations || null, ...sello(),
          })
        }
        return ok(true, 'Documento de Entregas Creado Correctamente', 201)
      }
      const doc = porId(db.delivery_documents, id)
      if (!doc) return noEncontrado('Documento de entrega')
      if (sub === 'pending_items') return ok(detallesDe(doc.id).filter((d) => !devolucionDeDetalle(d.id)).map(rDetalleEntrega))
      if (metodo === 'GET') return ok(rEntrega(doc))
      if (metodo === 'PUT') {
        if (!esAdmin) return prohibido()
        Object.assign(doc, body || {})
        return ok(rEntrega(doc))
      }
      if (metodo === 'DELETE') {
        if (!esAdmin) return prohibido()
        if (detallesDe(doc.id).some((d) => devolucionDeDetalle(d.id))) {
          return respuesta(409, { statusCode: 409, message: 'La entrega ya tiene devoluciones registradas' })
        }
        db.delivery_document_details = db.delivery_document_details.filter((d) => d.delivery_document_id !== doc.id)
        db.delivery_documents = db.delivery_documents.filter((d) => d.id !== doc.id)
        return ok(true, 'Documento de Entrega Eliminado Correctamente')
      }
      break
    }

    case 'delivery_document_details': {
      if (!id && metodo === 'GET') {
        let lista = db.delivery_document_details
        if (params.get('deliveryDocumentId')) lista = lista.filter((d) => String(d.delivery_document_id) === params.get('deliveryDocumentId'))
        if (params.get('equipmentId')) lista = lista.filter((d) => String(d.equipment_id) === params.get('equipmentId'))
        if (['1', 'true'].includes(params.get('pending'))) lista = lista.filter((d) => !devolucionDeDetalle(d.id))
        return okListado(paginarOTodo(lista, params, rDetalleEntrega), 'Detalles obtenidos')
      }
      if (!id && metodo === 'POST') {
        if (estaAsignado(body.equipment_id)) return invalido({ equipment_id: ['El equipo ya está asignado'] })
        const nuevo = { id: siguienteId(db.delivery_document_details), delivery_document_id: Number(body.delivery_document_id), equipment_id: Number(body.equipment_id), observations: body.observations || null, ...sello() }
        db.delivery_document_details.push(nuevo)
        return ok(rDetalleEntrega(nuevo), 'Detalle creado', 201)
      }
      const d = detalleEntrega(id)
      if (!d) return noEncontrado('Detalle')
      if (metodo === 'GET') return ok(rDetalleEntrega(d))
      if (metodo === 'PUT') {
        d.observations = body.observations ?? null
        return ok(rDetalleEntrega(d))
      }
      if (metodo === 'DELETE') {
        if (devolucionDeDetalle(d.id)) return respuesta(409, { statusCode: 409, message: 'El equipo ya fue devuelto' })
        db.delivery_document_details = db.delivery_document_details.filter((x) => x.id !== d.id)
        return ok(true)
      }
      break
    }

    case 'return_documents': {
      if (!id && metodo === 'GET') {
        let lista = [...db.return_documents].sort(desc)
        if (params.get('deliveryDocumentId')) lista = lista.filter((r) => String(r.delivery_document_id) === params.get('deliveryDocumentId'))
        if (params.get('employeeId')) {
          lista = lista.filter((r) => String(porId(db.delivery_documents, r.delivery_document_id)?.employee_id) === params.get('employeeId'))
        }
        return okListado(paginarOTodo(lista, params, rDevolucion), 'Devolución de Documentos Obtenidos Correctamente')
      }
      if (!id && metodo === 'POST') {
        if (!esAdmin) return prohibido()
        const items = itemsDeFormData(body)
        const entregaId = Number(body.get('delivery_document_id'))
        if (!porId(db.delivery_documents, entregaId)) return invalido({ delivery_document_id: ['El documento de entrega seleccionado no existe'] })
        if (!items.length) return invalido({ items: ['Debe devolver al menos un equipo'] })
        if (items.some((it) => devolucionDeDetalle(it.delivery_document_detail_id))) {
          return invalido({ items: ['Uno de los equipos ya fue devuelto'] })
        }
        const doc = {
          id: siguienteId(db.return_documents),
          return_date: iso(Date.now()),
          responsable_signature: await archivoComoDataUrl(body.get('responsable_signature')),
          administrador_signature: await archivoComoDataUrl(body.get('administrador_signature')),
          observations: body.get('observations') || null,
          delivery_document_id: entregaId,
          user_id: sesionUsuarioId,
        }
        db.return_documents.push(doc)
        for (const it of items) {
          db.return_document_details.push({
            id: siguienteId(db.return_document_details), return_document_id: doc.id,
            delivery_document_detail_id: Number(it.delivery_document_detail_id), observations: it.observations || null,
          })
        }
        return ok(true, 'Devolución de Documento Creado Correctamente', 201)
      }
      const doc = porId(db.return_documents, id)
      if (!doc) return noEncontrado('Devolución')
      if (metodo === 'GET') return ok(rDevolucion(doc))
      if (metodo === 'PUT') {
        if (!esAdmin) return prohibido()
        doc.observations = body?.observations ?? null
        return ok(rDevolucion(doc))
      }
      break
    }

    case 'return_document_details': {
      if (!id && metodo === 'GET') {
        let lista = db.return_document_details
        if (params.get('returnDocumentId')) lista = lista.filter((r) => String(r.return_document_id) === params.get('returnDocumentId'))
        return okListado(paginarOTodo(lista, params, rDetalleDevolucion), 'Detalles de devolución obtenidos')
      }
      if (!id && metodo === 'POST') {
        if (devolucionDeDetalle(body.delivery_document_detail_id)) return invalido({ delivery_document_detail_id: ['El equipo ya fue devuelto'] })
        const nuevo = { id: siguienteId(db.return_document_details), return_document_id: Number(body.return_document_id), delivery_document_detail_id: Number(body.delivery_document_detail_id), observations: body.observations || null }
        db.return_document_details.push(nuevo)
        return ok(rDetalleDevolucion(nuevo), 'Detalle creado', 201)
      }
      const r = porId(db.return_document_details, id)
      if (!r) return noEncontrado('Detalle de devolución')
      if (metodo === 'GET') return ok(rDetalleDevolucion(r))
      if (metodo === 'PUT') {
        r.observations = body?.observations ?? null
        return ok(rDetalleDevolucion(r))
      }
      break
    }
    default:
      break
  }
  return respuesta(404, { statusCode: 404, message: 'Ruta no disponible en la demo' })
}

// ---------------------------------------------------------------------------
// Instalación: reemplaza window.fetch solo para las rutas de la API.
// ---------------------------------------------------------------------------

export function install() {
  const fetchOriginal = window.fetch.bind(window)
  // Si quedó una sesión guardada de otra visita, se respeta su rol.
  try {
    const guardada = JSON.parse(localStorage.getItem('legumex_session') || 'null')
    const u = guardada && USUARIOS_DEMO.find((x) => x.username === guardada.user?.username)
    if (u) {
      sesionRol = u.role
      sesionUsuarioId = u.id
    }
  } catch (_) {
    // sin sesión previa
  }

  window.fetch = async (entrada, opciones = {}) => {
    const texto = typeof entrada === 'string' ? entrada : entrada?.url || String(entrada)
    // Firmas guardadas en memoria como data URL: el PDF las pide por /storage/...
    const iData = texto.indexOf('data:image')
    if (iData >= 0 && !texto.startsWith('data:')) return fetchOriginal(texto.slice(iData))
    let url
    try {
      url = new URL(texto, window.location.href)
    } catch (_) {
      return fetchOriginal(entrada, opciones)
    }
    const m = /^\/api\/(.*)$/.exec(url.pathname)
    if (!m) return fetchOriginal(entrada, opciones)

    const metodo = String(opciones.method || 'GET').toUpperCase()
    let body = opciones.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (_) {
        body = {}
      }
    }
    const partes = m[1].replace(/\/+$/, '').split('/').filter(Boolean)
    // Pequeña espera para que los estados de carga se vean como en el sistema real.
    await new Promise((r) => setTimeout(r, 120))
    try {
      return await atender(metodo, partes, url.searchParams, body)
    } catch (err) {
      console.warn('[demo] Error en la API simulada', err)
      return respuesta(500, { statusCode: 500, message: 'Error en la demo' })
    }
  }
}

export function reiniciarDemo() {
  db = copia(DATOS_DEMO)
}
