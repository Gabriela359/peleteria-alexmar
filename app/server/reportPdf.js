import PDFDocument from 'pdfkit'

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

function drawSummaryCard(doc, x, y, w, h, label, value, accent = '#a9b7ff') {
  doc.fillColor('#1f2a43').roundedRect(x, y, w, h, 12).fill()
  doc.strokeColor('#2d3f67').lineWidth(1).roundedRect(x, y, w, h, 12).stroke()
  doc.fillColor(accent).font('Helvetica-Bold').fontSize(10).text(label, x + 18, y + 14, { width: w - 36, align: 'left' })
  doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(28).text(String(value), x + 18, y + 30, { width: w - 36, align: 'left' })
}

function drawInventoryRow(doc, x, y, w, item, index) {
  const isEven = index % 2 === 0
  if (isEven) {
    doc.fillColor('#0d1320').roundedRect(x, y, w, 28, 8).fill()
  }

  const productName = String(item?.nombre || 'Producto')
  const vendidos = Number(item?.vendidos ?? 0)
  const quedan = String(item?.quedan ?? '—')

  doc.fillColor('#ebf0ff').font('Helvetica-Bold').fontSize(12).text(productName, x + 18, y + 8, { width: 260 })
  doc.fillColor('#c9d3f5').font('Helvetica').fontSize(12).text('vendidos', x + 350, y + 8, { width: 70 })
  doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(12).text(String(vendidos), x + 420, y + 8, { width: 40 })
  doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(12).text(quedaN, x + 466, y + 8, { width: 90, align: 'right' })
}

export async function buildReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      autoFirstPage: true,
      compress: false,
    })

    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const fecha = report?.fecha || new Date().toISOString().slice(0, 10)
    const total = Number(report?.total || 0)
    const pares = Number(report?.pares || 0)
    const stockTotal = Number(report?.stockTotal || 0)
    const inventario = Array.isArray(report?.inventario) ? report.inventario : []
    const destinatarios = Array.isArray(report?.destinatarios) && report.destinatarios.length > 0
      ? report.destinatarios.join(', ')
      : '—'

    doc.fillColor('#0b1120').rect(0, 0, 595, 842).fill()

    const panelX = 36
    const panelY = 36
    const panelW = 523
    const panelH = 760

    doc.fillColor('#111b2d').roundedRect(panelX, panelY, panelW, panelH, 16).fill()
    doc.strokeColor('#2a3b5d').lineWidth(1).roundedRect(panelX, panelY, panelW, panelH, 16).stroke()

    doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(22).text('Reporte diario', panelX + 28, panelY + 26)

    doc.fillColor('#edf3ff').font('Helvetica').fontSize(14).text(
      `Se adjunta el cierre del día en formato PDF con el resumen y el inventario completo.`,
      panelX + 28,
      panelY + 78,
      { width: panelW - 56 }
    )

    doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(12).text(`Para: ${destinatarios}`, panelX + 28, panelY + 150)
    doc.fillColor('#dfe8ff').font('Helvetica').fontSize(12).text(`Fecha: ${fecha}`, panelX + 28, panelY + 170)
    doc.fillColor('#dfe8ff').font('Helvetica').fontSize(12).text('Envío: inmediato al pulsar el botón', panelX + 28, panelY + 190)

    const cardsY = panelY + 228
    const cardsW = 150
    const gap = 10
    const cardX = [panelX + 28, panelX + 28 + cardsW + gap, panelX + 28 + 2 * (cardsW + gap)]

    drawSummaryCard(doc, cardX[0], cardsY, cardsW, 90, 'VENDIDO', money(total), '#b9c5ff')
    drawSummaryCard(doc, cardX[1], cardsY, cardsW, 90, 'PARES', pares, '#b9c5ff')
    drawSummaryCard(doc, cardX[2], cardsY, cardsW, 90, 'EN INVENTARIO', stockTotal.toLocaleString('es-CO'), '#b9c5ff')

    const invY = cardsY + 120
    const invH = 290
    doc.fillColor('#1b2539').roundedRect(panelX + 24, invY, panelW - 48, invH, 12).fill()
    doc.strokeColor('#33466b').roundedRect(panelX + 24, invY, panelW - 48, invH, 12).stroke()

    doc.fillColor('#a9b7ff').font('Helvetica-Bold').fontSize(16).text('INVENTARIO AL CIERRE', panelX + 38, invY + 18)

    const headerY = invY + 52
    doc.fillColor('#dfe8ff').font('Helvetica-Bold').fontSize(12).text('Producto', panelX + 42, headerY)
    doc.fillColor('#dfe8ff').font('Helvetica-Bold').fontSize(12).text('Vendidos', panelX + 355, headerY)
    doc.fillColor('#dfe8ff').font('Helvetica-Bold').fontSize(12).text('Quedan', panelX + 450, headerY, { align: 'right', width: 70 })

    const tableY = headerY + 28
    let currentY = tableY

    if (inventario.length === 0) {
      doc.fillColor('#dfe8ff').font('Helvetica').fontSize(12).text('No hay información disponible.', panelX + 42, currentY + 16)
    } else {
      inventario.forEach((item, index) => {
        const rowHeight = 32
        const rowY = currentY + index * rowHeight
        doc.fillColor('#1d2942').roundedRect(panelX + 30, rowY, panelW - 60, rowHeight, 8).fill()
        doc.strokeColor('#323f5d').roundedRect(panelX + 30, rowY, panelW - 60, rowHeight, 8).stroke()

        const productName = String(item?.nombre || 'Producto')
        const vendidos = Number(item?.vendidos ?? 0)
        const quedan = String(item?.quedan ?? '—')

        doc.fillColor('#edf3ff').font('Helvetica-Bold').fontSize(12).text(productName, panelX + 42, rowY + 10, { width: 290 })
        doc.fillColor('#dfe8ff').font('Helvetica').fontSize(12).text('vendidos', panelX + 355, rowY + 10, { width: 70 })
        doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(12).text(String(vendidos), panelX + 420, rowY + 10, { width: 35 })
        doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(12).text(quedan, panelX + 450, rowY + 10, { width: 85, align: 'right' })
      })
    }

    const footerY = invY + invH + 26
    doc.fillColor('#dfe8ff').font('Helvetica').fontSize(11).text(
      `Resumen final: ${inventario.length} productos, ${pares} pares vendidos y ${stockTotal.toLocaleString('es-CO')} unidades en inventario.`,
      panelX + 28,
      footerY,
      { width: panelW - 56 }
    )

    doc.end()
  })
}
