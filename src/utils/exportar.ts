import type { Gasto } from '../stores/gastos'
import { formatearDinero } from './formato'

// Genera el resumen del mes en Markdown (para copiar/compartir y revisar afuera)
export const generarResumenMd = (fecha: Date, movimientos: Gasto[]): string => {
  const nombreMes = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    fecha,
  )
  const titulo = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)

  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso')
  const gastos = movimientos.filter((m) => m.tipo === 'gasto')
  const totalIngresos = ingresos.reduce((s, m) => s + m.monto, 0)
  const totalGastos = gastos.reduce((s, m) => s + m.monto, 0)
  const balance = totalIngresos - totalGastos

  const plata = (v: number) => `$${formatearDinero(v)}`
  const signo = (m: Gasto) => (m.tipo === 'ingreso' ? `+${plata(m.monto)}` : `-${plata(m.monto)}`)
  const dia = (f: Date) =>
    `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`

  const porCategoria = (lista: Gasto[]) => {
    const mapa = new Map<string, number>()
    lista.forEach((m) => mapa.set(m.categoria, (mapa.get(m.categoria) || 0) + m.monto))
    return [...mapa.entries()].sort((a, b) => b[1] - a[1])
  }

  const lineas: string[] = []
  lineas.push(`# Trompocostos — ${titulo}`)
  lineas.push('')
  lineas.push(
    `**Balance: ${balance >= 0 ? '+' : '-'}${plata(Math.abs(balance))}** · ` +
      `Ingresos: ${plata(totalIngresos)} · Gastos: ${plata(totalGastos)} · ` +
      `${movimientos.length} movimientos`,
  )

  if (gastos.length > 0) {
    lineas.push('', '## Gastos por categoría', '', '| Categoría | Total | % |', '|---|---:|---:|')
    for (const [cat, total] of porCategoria(gastos)) {
      const pct = totalGastos > 0 ? Math.round((total / totalGastos) * 100) : 0
      lineas.push(`| ${cat} | ${plata(total)} | ${pct}% |`)
    }
  }

  if (ingresos.length > 0) {
    lineas.push('', '## Ingresos por categoría', '', '| Categoría | Total |', '|---|---:|')
    for (const [cat, total] of porCategoria(ingresos)) {
      lineas.push(`| ${cat} | ${plata(total)} |`)
    }
  }

  if (movimientos.length > 0) {
    lineas.push(
      '',
      '## Movimientos',
      '',
      '| Fecha | Descripción | Categoría | Monto |',
      '|---|---|---|---:|',
    )
    const ordenados = [...movimientos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    for (const m of ordenados) {
      const cuotas =
        m.totalCuotas && m.totalCuotas > 1 ? ` (${m.cuotaActual}/${m.totalCuotas})` : ''
      // Escapar pipes para no romper la tabla
      const desc = `${m.descripcion}${cuotas}`.replace(/\|/g, '\\|')
      lineas.push(`| ${dia(m.fecha)} | ${desc} | ${m.categoria} | ${signo(m)} |`)
    }
  } else {
    lineas.push('', '_Sin movimientos este mes._')
  }

  lineas.push('')
  return lineas.join('\n')
}
