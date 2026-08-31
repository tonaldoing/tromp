import type { Categoria } from '../stores/gastos'

// Parser del texto pegado en la pantalla de importación.
// Cada línea es un gasto: "descripción monto [categoría] [Nx]"
// Ejemplos válidos:
//   Netflix 15000 Servicios
//   Zapatillas 120.000 Varios 3x
//   Súper del mes; 85.500,50; Supermercado
//   Nafta 40000

export interface LineaImportada {
  linea: string
  ok: boolean
  error?: string
  descripcion?: string
  monto?: number
  categoria?: string
  cuotas?: number
}

// Acepta "15000", "15.000", "15.000,50", "15000.50", "$15.000"
export const parsearMonto = (texto: string): number | null => {
  let t = texto.trim().replace(/^\$/, '')
  if (!t) return null

  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) {
    // Formato es-AR: punto de miles, coma decimal
    t = t.replace(/\./g, '').replace(',', '.')
  } else if (/^\d+(,\d{1,2})$/.test(t)) {
    // Solo coma decimal
    t = t.replace(',', '.')
  } else if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return null
  }

  const n = Number(t)
  return Number.isFinite(n) && n > 0 ? n : null
}

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const parsearCuotas = (token: string): number | null => {
  const m = /^(\d{1,2})x$/i.exec(token) || /^x(\d{1,2})$/i.exec(token)
  if (!m) return null
  const n = Number(m[1] || m[2])
  return n >= 2 && n <= 60 ? n : null
}

// Busca si los últimos tokens forman el nombre de una categoría existente
const extraerCategoria = (
  tokens: string[],
  categorias: Categoria[],
): { categoria?: string; resto: string[] } => {
  for (let k = Math.min(3, tokens.length - 1); k >= 1; k--) {
    const candidato = normalizar(tokens.slice(-k).join(' '))
    const match = categorias.find((c) => normalizar(c.nombre) === candidato)
    if (match) {
      return { categoria: match.nombre, resto: tokens.slice(0, -k) }
    }
  }
  return { resto: tokens }
}

const parsearLinea = (linea: string, categorias: Categoria[]): LineaImportada => {
  // Formato con separadores explícitos: desc ; monto ; [categoría] ; [Nx]
  const separador = linea.includes('\t') ? '\t' : linea.includes(';') ? ';' : null

  let tokens: string[]
  if (separador) {
    const campos = linea
      .split(separador)
      .map((c) => c.trim())
      .filter(Boolean)
    tokens = campos.flatMap((c, i) => (i === 0 ? [c] : c.split(/\s+/)))
  } else {
    tokens = linea.trim().split(/\s+/)
  }

  if (tokens.length < 2) {
    return { linea, ok: false, error: 'Faltan datos: descripción y monto (ej: "Netflix 15000")' }
  }

  // 1. Cuotas: token tipo "3x" o "x3", donde aparezca
  let cuotas: number | undefined
  tokens = tokens.filter((t) => {
    const c = parsearCuotas(t)
    if (c && !cuotas) {
      cuotas = c
      return false
    }
    return true
  })

  // 2. Monto: el último token que parsea como número
  let monto: number | undefined
  for (let i = tokens.length - 1; i > 0; i--) {
    const token = tokens[i]
    if (!token) continue
    const m = parsearMonto(token)
    if (m !== null) {
      monto = m
      tokens.splice(i, 1)
      break
    }
  }
  if (monto === undefined) {
    return { linea, ok: false, error: 'No encontré un monto válido' }
  }

  // 3. Categoría: los últimos tokens que coincidan con una existente
  const { categoria, resto } = extraerCategoria(tokens, categorias)

  const descripcion = resto.join(' ').trim()
  if (!descripcion) {
    return { linea, ok: false, error: 'Falta la descripción' }
  }

  return { linea, ok: true, descripcion, monto, categoria, cuotas }
}

export const parsearLineas = (texto: string, categorias: Categoria[]): LineaImportada[] => {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linea) => parsearLinea(linea, categorias))
}
