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
// El separador decimal puede ser "," o "." (los teclados numéricos del celular
// suelen tener solo el punto): se acepta uno solo y hasta 2 decimales; los
// separadores extra y caracteres inválidos se ignoran.
// Devuelve null si el texto no es un monto válido.
export const limpiarMontoInput = (valor: string): string | null => {
  const texto = valor.replace(/[^\d.,]/g, '')
  if (!texto) return ''

  let entera: string
  let decimal: string | null = null

  if (texto.includes(',')) {
    // Hay coma: es EL separador decimal; los puntos son de miles
    const posComa = texto.indexOf(',')
    entera = texto.slice(0, posComa)
    decimal = texto.slice(posComa + 1)
  } else {
    // Sin coma: el último punto cuenta como decimal solo si le siguen
    // 0-2 dígitos (un punto de miles siempre va seguido de 3)
    const ultimoPunto = texto.lastIndexOf('.')
    const despues = ultimoPunto >= 0 ? texto.slice(ultimoPunto + 1) : ''
    if (ultimoPunto >= 0 && despues.replace(/\D/g, '').length <= 2) {
      entera = texto.slice(0, ultimoPunto)
      decimal = despues
    } else {
      entera = texto
    }
  }

  entera = entera.replace(/\D/g, '')
  if (decimal !== null) {
    decimal = decimal.replace(/\D/g, '').slice(0, 2)
    if (!entera) entera = '0'
  }

  return decimal === null ? entera : `${entera}.${decimal}`
}
