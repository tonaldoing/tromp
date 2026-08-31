// Helpers de formato de dinero compartidos por todas las vistas

export const formatearDinero = (monto: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(monto)
}

// Formatea lo que el usuario tipea en un input de monto ("1234.5" -> "1.234,5")
export const formatearMontoInput = (valor: string): string => {
  if (!valor) return ''

  const partes = valor.split('.')
  const parteEntera = partes[0]?.replace(/\D/g, '') || ''
  const parteDecimal = partes[1] ? partes[1].replace(/\D/g, '').slice(0, 2) : ''

  if (!parteEntera) return ''

  const numeroFormateado = new Intl.NumberFormat('es-AR').format(Number(parteEntera))

  if (parteDecimal) {
    return `${numeroFormateado},${parteDecimal}`
  }

  if (valor.endsWith('.') || valor.endsWith(',')) {
    return `${numeroFormateado},`
  }

  return numeroFormateado
}

// Normaliza el valor de un input de monto a un string numérico ("1.234,5" -> "1234.5").
// Devuelve null si el texto no es un monto válido.
export const limpiarMontoInput = (valor: string): string | null => {
  const limpio = valor
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  return /^\d*\.?\d{0,2}$/.test(limpio) ? limpio : null
}
