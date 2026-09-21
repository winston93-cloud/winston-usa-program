import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'

export type CartaAlumnoData = {
  nombreCompleto: string
  folio?: string
  alumnoRef?: string
  nivel?: string
  grado?: string
}

export type CartaAssets = {
  fontBytes: ArrayBuffer | Uint8Array
  headerBytes: ArrayBuffer | Uint8Array
  footerBytes: ArrayBuffer | Uint8Array
}

const PAGE_W = 612
const PAGE_H = 792
/** Márgenes laterales solo del texto (header/footer van a todo el ancho). */
const MARGIN_X = 54
const CONTENT_W = PAGE_W - MARGIN_X * 2
const GAP_AFTER_HEADER = 28
const GAP_BEFORE_FOOTER = 8
const INK = rgb(0.15, 0.2, 0.24)
const MUTED = rgb(0.35, 0.4, 0.45)
const LINE = rgb(0.75, 0.8, 0.85)

const PAGOS: { concepto: string; fecha: string; importe: string }[] = [
  {
    concepto: 'Inscripción al programa',
    fecha: '15 de octubre',
    importe: 'USD $100',
  },
  {
    concepto: 'Segunda parcialidad',
    fecha: '15 de noviembre',
    importe: 'USD $125',
  },
  {
    concepto: 'Tercera parcialidad',
    fecha: '15 de diciembre',
    importe: 'USD $125',
  },
]

function asUint8(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data)
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function fullWidthSize(img: PDFImage) {
  const width = PAGE_W
  const height = (img.height / img.width) * PAGE_W
  return { width, height }
}

function slugNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 48)
}

/** Nombre de archivo local para la carta de un alumno. */
export function cartaFileName(alumno: CartaAlumnoData): string {
  const folio = (alumno.folio || 'SIN-FOLIO').replace(/[^\w-]+/g, '_')
  const nombre = slugNombre(alumno.nombreCompleto || 'ALUMNO') || 'ALUMNO'
  return `carta-bienvenida-${folio}-${nombre}.pdf`
}

type Block =
  | { kind: 'para'; text: string; size: number; lineH: number; color: typeof INK; gapAfter: number }
  | { kind: 'table'; gapAfter: number }
  | { kind: 'spacer'; height: number }

/**
 * Genera el PDF de la carta de bienvenida Hökku / Winston USA Program.
 * Header y footer a todo el ancho en cada página; el cuerpo fluye a más hojas si hace falta.
 */
export async function buildCartaBienvenidaPdf(
  alumno: CartaAlumnoData,
  assets: CartaAssets,
): Promise<Uint8Array> {
  const nombre = (alumno.nombreCompleto || '').trim() || '[NOMBRE DEL ALUMNO]'

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const font = await doc.embedFont(asUint8(assets.fontBytes), { subset: true })
  const headerImg = await doc.embedPng(asUint8(assets.headerBytes))
  const footerImg = await doc.embedPng(asUint8(assets.footerBytes))

  const header = fullWidthSize(headerImg)
  const footer = fullWidthSize(footerImg)
  const contentTop = PAGE_H - header.height - GAP_AFTER_HEADER
  const contentBottom = footer.height + GAP_BEFORE_FOOTER

  const body = 11
  const lineH = 15
  const gap = 10

  const blocks: Block[] = [
    {
      kind: 'para',
      text: 'Estimados padres de familia:',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: `Reciban una cordial felicitación por la incorporación de ${nombre} al Winston USA Program, desarrollado mediante la alianza académica entre el Instituto Winston Churchill y Hökku Academy.`,
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: 'Esta decisión representa mucho más que un proceso de validación escolar: es un paso importante en la construcción de una trayectoria académica con proyección internacional. A través del programa, los estudios cursados por su hijo(a) en el Instituto Winston Churchill se integran a un proceso de reconocimiento académico que le permitirá contar con documentación estadounidense respaldada por una institución acreditada por COGNIA.',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: 'La participación en este programa fortalece su perfil académico, favorece la continuidad y movilidad educativa y amplía sus posibilidades para desenvolverse, en el futuro, dentro de contextos educativos nacionales e internacionales. Cada ciclo completado representa un avance en este camino y refleja el compromiso de la familia con la formación integral y la preparación global de su hijo(a).',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: 'Para concluir correctamente el proceso correspondiente al ciclo escolar 2026–2027, deberán cubrirse las siguientes parcialidades:',
      size: body,
      lineH,
      color: INK,
      gapAfter: 8,
    },
    { kind: 'table', gapAfter: gap },
    {
      kind: 'para',
      text: 'Los pagos se realizarán en pesos mexicanos, conforme al tipo de cambio vigente el día en que se efectúe cada operación.',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: 'Es indispensable completar las tres parcialidades puntualmente, a más tardar en diciembre. La recepción oportuna de la documentación académica y la participación del alumno en la ceremonia de entrega al cierre del ciclo escolar dependerán del cumplimiento de este calendario.',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: `Nos entusiasma acompañar a ${nombre.toUpperCase()} en este paso hacia nuevas oportunidades. Agradecemos profundamente la confianza depositada en nuestro proyecto educativo y felicitamos a toda la familia por impulsar una formación que trasciende fronteras.`,
      size: body,
      lineH,
      color: INK,
      gapAfter: gap + 2,
    },
    {
      kind: 'para',
      text: 'Atentamente,',
      size: body,
      lineH,
      color: INK,
      gapAfter: gap,
    },
    {
      kind: 'para',
      text: 'Mtra. Claudia Araceli Benitez Olmedo',
      size: body,
      lineH,
      color: INK,
      gapAfter: 2,
    },
    {
      kind: 'para',
      text: 'Dirección Académica',
      size: 10,
      lineH: 13,
      color: MUTED,
      gapAfter: 0,
    },
    {
      kind: 'para',
      text: 'Instituto Winston Churchill',
      size: 10,
      lineH: 13,
      color: MUTED,
      gapAfter: 0,
    },
    {
      kind: 'para',
      text: 'direccion.academica@winston93.edu.mx',
      size: 10,
      lineH: 13,
      color: MUTED,
      gapAfter: 0,
    },
  ]

  const metaBits = [alumno.folio, alumno.alumnoRef, alumno.nivel, alumno.grado]
    .filter(Boolean)
    .join(' · ')

  let page = addDecoratedPage(doc, headerImg, footerImg, header, footer)
  let y = contentTop

  for (const block of blocks) {
    if (block.kind === 'spacer') {
      ;({ page, y } = ensureSpace(
        doc,
        page,
        y,
        block.height,
        contentTop,
        contentBottom,
        headerImg,
        footerImg,
        header,
        footer,
      ))
      y -= block.height
      continue
    }

    if (block.kind === 'table') {
      const tableH = tableHeight()
      ;({ page, y } = ensureSpace(
        doc,
        page,
        y,
        tableH + block.gapAfter,
        contentTop,
        contentBottom,
        headerImg,
        footerImg,
        header,
        footer,
      ))
      y = drawPagosTable(page, font, y)
      y -= block.gapAfter
      continue
    }

    const lines = wrapText(block.text, font, block.size, CONTENT_W)
    let lineIndex = 0
    while (lineIndex < lines.length) {
      const avail = y - contentBottom
      const maxLines = Math.max(1, Math.floor(avail / block.lineH))
      if (avail < block.lineH) {
        page = addDecoratedPage(doc, headerImg, footerImg, header, footer)
        y = contentTop
        continue
      }
      const chunk = lines.slice(lineIndex, lineIndex + maxLines)
      for (const line of chunk) {
        page.drawText(line, {
          x: MARGIN_X,
          y,
          size: block.size,
          font,
          color: block.color,
        })
        y -= block.lineH
      }
      lineIndex += chunk.length
    }
    y -= block.gapAfter
  }

  if (metaBits) {
    const metaSize = 8
    if (y - contentBottom < metaSize + 4) {
      page = addDecoratedPage(doc, headerImg, footerImg, header, footer)
      y = contentTop
    }
    page.drawText(metaBits, {
      x: MARGIN_X,
      y: contentBottom + 2,
      size: metaSize,
      font,
      color: MUTED,
    })
  }

  return doc.save()
}

function addDecoratedPage(
  doc: PDFDocument,
  headerImg: PDFImage,
  footerImg: PDFImage,
  header: { width: number; height: number },
  footer: { width: number; height: number },
): PDFPage {
  const page = doc.addPage([PAGE_W, PAGE_H])
  page.drawImage(headerImg, {
    x: 0,
    y: PAGE_H - header.height,
    width: header.width,
    height: header.height,
  })
  page.drawImage(footerImg, {
    x: 0,
    y: 0,
    width: footer.width,
    height: footer.height,
  })
  return page
}

function ensureSpace(
  doc: PDFDocument,
  page: PDFPage,
  y: number,
  need: number,
  contentTop: number,
  contentBottom: number,
  headerImg: PDFImage,
  footerImg: PDFImage,
  header: { width: number; height: number },
  footer: { width: number; height: number },
): { page: PDFPage; y: number } {
  if (y - need >= contentBottom) return { page, y }
  const next = addDecoratedPage(doc, headerImg, footerImg, header, footer)
  return { page: next, y: contentTop }
}

function tableHeight(): number {
  const rowH = 30
  // header + 3 pagos + total + bottom line padding
  return rowH * 5 + 8
}

function drawPagosTable(page: PDFPage, font: PDFFont, topY: number): number {
  const rowH = 30
  const cols = [220, 150, 100] as const
  const tableW = cols[0] + cols[1] + cols[2]
  const x0 = MARGIN_X
  let y = topY
  const borderThickness = 1.2

  const rows: [string, string, string][] = [
    ['Parcialidad', 'Fecha límite', 'Importe'],
    ...PAGOS.map(
      (p) => [p.concepto, p.fecha, p.importe] as [string, string, string],
    ),
    ['Total anual', '', 'USD $350'],
  ]

  const drawCentered = (
    text: string,
    colX: number,
    colW: number,
    yText: number,
    size: number,
  ) => {
    if (!text) return
    const textW = font.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: colX + (colW - textW) / 2,
      y: yText,
      size,
      font,
      color: INK,
    })
  }

  // Borde superior de la tabla
  page.drawLine({
    start: { x: x0, y },
    end: { x: x0 + tableW, y },
    thickness: borderThickness,
    color: LINE,
  })

  for (let i = 0; i < rows.length; i++) {
    const [a, b, c] = rows[i]
    const size = 10
    // Centrado vertical dentro de la fila (baseline aprox. al centro óptico).
    const yText = y - rowH / 2 - size * 0.35

    drawCentered(a, x0, cols[0], yText, size)
    drawCentered(b, x0 + cols[0], cols[1], yText, size)
    drawCentered(c, x0 + cols[0] + cols[1], cols[2], yText, size)

    y -= rowH

    // Separador entre filas (no el borde final)
    if (i < rows.length - 1) {
      page.drawLine({
        start: { x: x0, y },
        end: { x: x0 + tableW, y },
        thickness: 1,
        color: LINE,
      })
    }
  }

  // Borde inferior de la tabla (mismo estilo que el superior)
  page.drawLine({
    start: { x: x0, y },
    end: { x: x0 + tableW, y },
    thickness: borderThickness,
    color: LINE,
  })

  return y - 20
}

/** Descarga el PDF en el navegador (pruebas locales). */
export function downloadPdfBytes(bytes: Uint8Array, fileName: string): void {
  const copy = Uint8Array.from(bytes)
  const blob = new Blob([copy], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
