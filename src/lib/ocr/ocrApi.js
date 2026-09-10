const TIPOS_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'application/octet-stream',
]

const MAX_BYTES = 4 * 1024 * 1024

// =====================================================
// VALIDAR IMAGEN
// =====================================================

export const validarImagenOcr = (archivo) => {
  if (!archivo) {
    return {
      ok: false,
      mensaje: 'Debe seleccionar una imagen.',
    }
  }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return {
      ok: false,
      mensaje:
        'Formato no compatible. Seleccione una imagen JPG o PNG.',
    }
  }

  if (archivo.size > MAX_BYTES) {
    return {
      ok: false,
      mensaje:
        'La imagen supera el tamaño máximo permitido de 4 MiB.',
    }
  }

  return {
    ok: true,
    mensaje: '',
  }
}

// =====================================================
// ENVIAR IMAGEN AL SERVICIO OCR
// =====================================================

export const detectarPlacaApi = async (archivo) => {
  const validacion = validarImagenOcr(archivo)

  if (!validacion.ok) {
    throw new Error(validacion.mensaje)
  }

  const endpoint =
    import.meta.env.VITE_OCR_ENDPOINT

  if (!endpoint) {
    throw new Error(
      'No está configurado VITE_OCR_ENDPOINT.',
    )
  }

  let response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type':
          archivo.type ||
          'application/octet-stream',
      },
      body: archivo,
    })
  } catch (error) {
    console.error(
      'Error de conexión con el servicio OCR:',
      error,
    )

    throw new Error(
      'No fue posible comunicarse con el servicio OCR.',
    )
  }

  let resultado = null

  try {
    resultado = await response.json()
  } catch {
    throw new Error(
      'El servicio OCR respondió con un formato no válido (HTTP ' +
        response.status +
        ').',
    )
  }

  if (!response.ok) {
    const mensajes = {
      400:
        'La imagen enviada no es válida o tiene dimensiones incorrectas.',
      413:
        'La imagen supera el tamaño máximo permitido de 4 MiB.',
      415:
        'El formato de imagen no es compatible.',
      502:
        'El servicio OCR o la conexión con Supabase presentó un error.',
      504:
        'El servicio OCR tardó demasiado en responder.',
    }

    throw new Error(
      mensajes[response.status] ||
        resultado?.mensaje ||
        resultado?.error ||
        'Error del servicio OCR (HTTP ' +
          response.status +
          ').',
    )
  }

  return resultado
}

// =====================================================
// NORMALIZAR RESPUESTA DEL OCR
// =====================================================

export const normalizarRespuestaOcr = (
  resultado,
) => {
  if (
    !resultado ||
    typeof resultado !== 'object'
  ) {
    return {
      estado: 'sin_placa',
      vehiculoEncontrado: false,
      placa: '',
      confianza: null,
      vehiculo: null,
      imagenMarcada: null,
    }
  }

  const estado =
    resultado.estado ||
    resultado.status ||
    'sin_placa'

  const vehiculoEncontrado =
    typeof resultado.vehiculo_encontrado ===
    'boolean'
      ? resultado.vehiculo_encontrado
      : null

  const vehiculo =
    resultado.vehiculo ?? null

  const placa =
    resultado.placa ||
    resultado.placa_detectada ||
    resultado.matricula ||
    resultado.license_plate ||
    ''

  const confianza =
    resultado.confianza ??
    resultado.confidence ??
    resultado.confianza_ocr ??
    null

  let imagenMarcada = null

  if (
    resultado.imagen_marcada &&
    resultado.imagen_marcada.base64
  ) {
    imagenMarcada = {
      mimeType:
        resultado.imagen_marcada.mime_type ||
        'image/jpeg',

      base64:
        resultado.imagen_marcada.base64,
    }
  }

  return {
    ...resultado,

    estado,

    vehiculoEncontrado,

    placa,

    confianza,

    vehiculo,

    imagenMarcada,
  }
}