function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}')
    const expectedToken = PropertiesService.getScriptProperties().getProperty('ALEXMAR_API_TOKEN')

    if (!expectedToken || payload.token !== expectedToken) {
      return jsonResponse({ ok: false, error: 'No autorizado' })
    }

    const recipients = Array.isArray(payload.to)
      ? payload.to.map((email) => String(email || '').trim()).filter(Boolean)
      : []
    if (recipients.length === 0) {
      return jsonResponse({ ok: false, error: 'No hay destinatarios válidos' })
    }

    const from = String(payload.from || '').trim()
    const options = {
      to: recipients.join(','),
      subject: String(payload.subject || 'Reporte diario Peletería ALEXMAR'),
      body: String(payload.text || 'Reporte diario Peletería ALEXMAR'),
      htmlBody: String(payload.html || ''),
      name: 'Peletería ALEXMAR',
    }
    if (from) options.replyTo = from

    MailApp.sendEmail(options)
    return jsonResponse({ ok: true })
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo enviar el correo',
    })
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON)
}
