import PDFDocument from 'pdfkit'

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

function drawSummaryCard(doc, x, y, width, label, value) {
  doc.fillColor('#1f2a43').roundedRect(x, y, width, 90, 12).fill()
  doc.strokeColor('#2d3f67').lineWidth(1).roundedRect(x, y, width, 90, 12).stroke()
  doc.fillColor('#b9c5ff').font('Helvetica-Bold').fontSize(10).text(label, x + 18, y + 16, { width: width - 36 })
  doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(24).text(String(value), x + 18, y + 42, { width: width - 36 })
}

export async function buildReportPdf(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, compress: false })
    const chunks = []
    const pageWidth = 595
    const left = 42
    const contentWidth = 511
    const fecha = report?.fecha || new Date().toISOString().slice(0, 10)
    const total = Number(report?.total || 0)
    const inventario = Array.isArray(report?.inventario) ? report.inventario : []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    function drawPageBackground() {
      doc.fillColor('#0b1120').rect(0, 0, pageWidth, 842).fill()
      doc.fillColor('#111b2d').roundedRect(left, 30, contentWidth, 782, 16).fill()
      doc.strokeColor('#2a3b5d').lineWidth(1).roundedRect(left, 30, contentWidth, 782, 16).stroke()
    }

    function drawTableHeader(y) {
      doc.fillColor('#a9b7ff').font('Helvetica-Bold').fontSize(9)
        .text('Producto', left + 12, y, { width: 210 })
        .text('Cantidad', left + 230, y, { width: 62 })
        .text('Total vendido', left + 300, y, { width: 90, align: 'right' })
        .text('Queda en inventario', left + 398, y, { width: 100, align: 'right' })
      doc.moveTo(left + 12, y + 17).lineTo(left + contentWidth - 12, y + 17)
        .strokeColor('#33466b').lineWidth(1).stroke()
    }

    function drawContinuationPage() {
      doc.addPage()
      drawPageBackground()
      doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(17).text('Reporte diario · continuación', left + 26, 52)
      doc.fillColor('#dfe8ff').font('Helvetica').fontSize(11).text(`Fecha: ${fecha}`, left + 26, 80)
      drawTableHeader(118)
      return 145
    }

    drawPageBackground()
    doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(22).text('Reporte diario', left + 26, 54)
    doc.fillColor('#dfe8ff').font('Helvetica').fontSize(12).text(`Fecha: ${fecha}`, left + 26, 88)
    drawSummaryCard(doc, left + 26, 120, contentWidth - 52, 'TOTAL VENDIDO', money(total))

    doc.fillColor('#f3f7ff').font('Helvetica-Bold').fontSize(13).text('Productos vendidos e inventario', left + 26, 236)
    drawTableHeader(260)
    let currentY = 287

    if (inventario.length === 0) {
      doc.fillColor('#dfe8ff').font('Helvetica').fontSize(11)
        .text('No hay productos registrados para este día.', left + 12, currentY, { width: contentWidth - 24 })
    } else {
      for (const [index, item] of inventario.entries()) {
        const nombre = String(item?.nombre || 'Producto')
        const quedan = String(item?.quedan ?? '—')
        doc.font('Helvetica').fontSize(10)
        const rowHeight = Math.max(
          32,
          doc.heightOfString(nombre, { width: 202 }) + 14,
          doc.heightOfString(quedan, { width: 92 }) + 14
        )
        if (currentY + rowHeight > 785) currentY = drawContinuationPage()

        if (index % 2 === 0) {
          doc.fillColor('#0d1320').roundedRect(left + 8, currentY, contentWidth - 16, rowHeight, 6).fill()
        }

        doc.fillColor('#edf3ff').font('Helvetica').fontSize(10)
          .text(nombre, left + 12, currentY + 7, { width: 202 })
        doc.fillColor('#f5f7ff').font('Helvetica-Bold').fontSize(10)
          .text(String(Number(item?.vendidos ?? 0)), left + 230, currentY + 8, { width: 62 })
          .text(money(item?.totalVenta), left + 300, currentY + 8, { width: 90, align: 'right' })
          .text(quedan, left + 398, currentY + 8, { width: 92, align: 'right' })
        currentY += rowHeight
      }
    }

    doc.end()
  })
}
