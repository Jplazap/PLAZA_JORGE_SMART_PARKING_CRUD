import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CImage,
  CRow,
  CSpinner,
} from '@coreui/react'

import {
  cilCamera,
  cilCarAlt,
  cilCheckCircle,
  cilCloudUpload,
  cilReload,
  cilWarning,
  cilXCircle,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

import {
  useVehiculos,
} from '../../hooks/useVehiculos'

import {
  detectarPlacaApi,
  normalizarRespuestaOcr,
  validarImagenOcr,
} from '../../lib/ocr/ocrApi'

// =====================================================
// UTILIDADES
// =====================================================

const normalizarPlaca = (valor) => {
  return String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim()
}

const obtenerImagenMarcada = (imagenMarcada) => {
  if (!imagenMarcada) {
    return null
  }

  if (typeof imagenMarcada === 'string') {
    if (imagenMarcada.startsWith('data:image/')) {
      return imagenMarcada
    }

    return 'data:image/jpeg;base64,' + imagenMarcada
  }

  if (
    typeof imagenMarcada === 'object' &&
    imagenMarcada.base64
  ) {
    const mime =
      imagenMarcada.mimeType ||
      imagenMarcada.mime_type ||
      'image/jpeg'

    const base64 = String(
      imagenMarcada.base64,
    )

    if (base64.startsWith('data:image/')) {
      return base64
    }

    return (
      'data:' +
      mime +
      ';base64,' +
      base64
    )
  }

  return null
}

// =====================================================
// COMPONENTE
// =====================================================

const MonitoreoEntrada = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const archivoInputRef = useRef(null)
  const previewObjectUrlRef = useRef(null)

  const {
    vehiculos,
    cargando: cargandoVehiculos,
    error: errorVehiculos,
  } = useVehiculos()

  const [camaraActiva, setCamaraActiva] =
    useState(false)

  const [iniciandoCamara, setIniciandoCamara] =
    useState(false)

  const [archivoImagen, setArchivoImagen] =
    useState(null)

  const [previewImagen, setPreviewImagen] =
    useState(null)

  const [origenImagen, setOrigenImagen] =
    useState('')

  const [procesando, setProcesando] =
    useState(false)

  const [resultado, setResultado] =
    useState(null)

  const [error, setError] =
    useState('')

  // ===================================================
  // LIBERAR STREAM DE CÁMARA
  // ===================================================

  const detenerStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop())

      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCamaraActiva(false)
  }, [])

  // ===================================================
  // LIBERAR PREVIEW
  // ===================================================

  const liberarPreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(
        previewObjectUrlRef.current,
      )

      previewObjectUrlRef.current = null
    }
  }, [])

  // ===================================================
  // ESTABLECER IMAGEN
  // ===================================================

  const establecerImagen = useCallback(
    (archivo, origen) => {
      if (!archivo) {
        return false
      }

      const validacion =
        validarImagenOcr(archivo)

      if (!validacion.ok) {
        setError(validacion.mensaje)
        return false
      }

      liberarPreview()

      const url =
        URL.createObjectURL(archivo)

      previewObjectUrlRef.current = url

      setArchivoImagen(archivo)
      setPreviewImagen(url)
      setOrigenImagen(origen)
      setResultado(null)
      setError('')

      return true
    },
    [liberarPreview],
  )

  // ===================================================
  // ACTIVAR CÁMARA
  // ===================================================

  const activarCamara = useCallback(
    async () => {
      setError('')
      setIniciandoCamara(true)

      try {
        detenerStream()

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            'El navegador no permite acceder a la cámara.',
          )
        }

        let stream = null

        try {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  facingMode: {
                    ideal: 'environment',
                  },
                  width: {
                    ideal: 1280,
                  },
                  height: {
                    ideal: 720,
                  },
                },
                audio: false,
              },
            )
        } catch {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
                audio: false,
              },
            )
        }

        streamRef.current = stream

        const video = videoRef.current

        if (!video) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop(),
            )

          streamRef.current = null

          throw new Error(
            'No se pudo inicializar el elemento de video.',
          )
        }

        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        video.autoplay = true

        await new Promise((resolve) => {
          if (
            video.readyState >= 1
          ) {
            resolve()
            return
          }

          const cargar = () => {
            video.removeEventListener(
              'loadedmetadata',
              cargar,
            )

            resolve()
          }

          video.addEventListener(
            'loadedmetadata',
            cargar,
          )
        })

        await video.play()

        if (
          !video.videoWidth ||
          !video.videoHeight
        ) {
          throw new Error(
            'La cámara se inició, pero no está entregando imágenes.',
          )
        }

        setCamaraActiva(true)
        setError('')
      } catch (err) {
        console.error(
          'Error al activar cámara:',
          err,
        )

        detenerStream()

        if (
          err?.name ===
          'NotAllowedError'
        ) {
          setError(
            'Permiso de cámara denegado. Permite el acceso a la cámara desde el navegador.',
          )
        } else if (
          err?.name ===
          'NotFoundError'
        ) {
          setError(
            'No se encontró ninguna cámara disponible.',
          )
        } else if (
          err?.name ===
          'NotReadableError'
        ) {
          setError(
            'La cámara está siendo utilizada por otra aplicación.',
          )
        } else {
          setError(
            err?.message ||
              'No fue posible activar la cámara.',
          )
        }
      } finally {
        setIniciandoCamara(false)
      }
    },
    [detenerStream],
  )

  // ===================================================
  // CAPTURAR FOTOGRAFÍA
  // ===================================================

  const capturarFotografia = useCallback(
    () => {
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas) {
        setError(
          'No se pudo acceder a la cámara.',
        )
        return
      }

      if (
        !video.videoWidth ||
        !video.videoHeight
      ) {
        setError(
          'La cámara todavía no está lista.',
        )
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const contexto =
        canvas.getContext('2d')

      if (!contexto) {
        setError(
          'No se pudo procesar la imagen.',
        )
        return
      }

      contexto.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError(
              'No se pudo generar la fotografía.',
            )
            return
          }

          const archivo =
            new File(
              [blob],
              `captura-placa-${Date.now()}.jpg`,
              {
                type: 'image/jpeg',
              },
            )

          establecerImagen(
            archivo,
            'CAMARA',
          )

          detenerStream()
        },
        'image/jpeg',
        0.95,
      )
    },
    [
      establecerImagen,
      detenerStream,
    ],
  )

  // ===================================================
  // SELECCIONAR ARCHIVO
  // ===================================================

  const seleccionarArchivo = (
    evento,
  ) => {
    const archivo =
      evento.target.files?.[0]

    if (!archivo) {
      return
    }

    detenerStream()

    const correcto =
      establecerImagen(
        archivo,
        'ARCHIVO',
      )

    if (!correcto) {
      evento.target.value = ''
    }
  }

  // ===================================================
  // BUSCAR VEHÍCULO LOCAL
  // ===================================================

  const buscarVehiculoLocal = (
    placa,
  ) => {
    const placaNormalizada =
      normalizarPlaca(placa)

    if (!placaNormalizada) {
      return null
    }

    return (
      vehiculos || []
    ).find(
      (vehiculo) =>
        normalizarPlaca(
          vehiculo.placa,
        ) === placaNormalizada,
    ) || null
  }

  // ===================================================
  // DETECTAR PLACA
  // ===================================================

  const detectarPlaca = async () => {
    if (!archivoImagen) {
      setError(
        'Primero captura una fotografía o selecciona una imagen.',
      )
      return
    }

    setProcesando(true)
    setError('')
    setResultado(null)

    try {
      console.log(
        'Enviando imagen al OCR:',
        archivoImagen,
      )

      const respuesta =
        await detectarPlacaApi(
          archivoImagen,
        )

      console.log(
        'RESPUESTA OCR:',
        respuesta,
      )

      const normalizado =
        normalizarRespuestaOcr(
          respuesta,
        )

      console.log(
        'OCR NORMALIZADO:',
        normalizado,
      )

      const placa =
        normalizarPlaca(
          normalizado.placa,
        )

      console.log(
        'PLACA DETECTADA:',
        placa,
      )

      if (!placa) {
        setResultado({
          estado: 'sin_placa',
          placa: '',
          confianza:
            normalizado.confianza,
          vehiculo: null,
          imagenMarcada:
            obtenerImagenMarcada(
              normalizado.imagenMarcada,
            ),
        })

        return
      }

      // Buscar vehículo en los registros locales
      const vehiculoLocal =
        buscarVehiculoLocal(placa)

      console.log(
        'VEHÍCULO EN SUPABASE:',
        vehiculoLocal,
      )

      // Vehículo que pueda venir directamente del OCR
      const vehiculoApi =
        normalizado.vehiculo || null

      // Prioridad a los datos registrados
      const vehiculo =
        vehiculoLocal ||
        vehiculoApi ||
        null

      const registrado =
        Boolean(vehiculo)

      const imagenMarcada =
        obtenerImagenMarcada(
          normalizado.imagenMarcada,
        )

      console.log(
        'IMAGEN MARCADA:',
        imagenMarcada,
      )

      setResultado({
        estado: registrado
          ? 'encontrado'
          : 'no_registrado',

        placa,

        confianza:
          normalizado.confianza,

        vehiculo,

        vehiculoEncontrado:
          registrado,

        imagenMarcada,

        respuestaOcr:
          normalizado,
      })
    } catch (err) {
      console.error(
        'Error durante la detección:',
        err,
      )

      setError(
        err?.message ||
          'No fue posible detectar la placa.',
      )
    } finally {
      setProcesando(false)
    }
  }

  // ===================================================
  // NUEVA CAPTURA
  // ===================================================

  const nuevaCaptura = () => {
    setResultado(null)
    setError('')
    setArchivoImagen(null)

    liberarPreview()
    setPreviewImagen(null)
    setOrigenImagen('')

    if (archivoInputRef.current) {
      archivoInputRef.current.value = ''
    }

    activarCamara()
  }

  // ===================================================
  // LIMPIAR
  // ===================================================

  const limpiarTodo = () => {
    detenerStream()
    liberarPreview()

    setArchivoImagen(null)
    setPreviewImagen(null)
    setOrigenImagen('')
    setResultado(null)
    setError('')

    if (archivoInputRef.current) {
      archivoInputRef.current.value = ''
    }
  }

  // ===================================================
  // LIMPIEZA
  // ===================================================

  useEffect(() => {
    return () => {
      detenerStream()
      liberarPreview()
    }
  }, [
    detenerStream,
    liberarPreview,
  ])

  // ===================================================
  // DATOS DEL RESULTADO
  // ===================================================

  const vehiculo =
    resultado?.vehiculo || null

  const placaDetectada =
    resultado?.placa || ''

  const imagenMarcada =
    resultado?.imagenMarcada || null

  const confianza =
    resultado?.confianza

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <CContainer
      fluid
      className="py-4"
    >
      <CRow className="mb-4">
        <CCol>
          <h2 className="fw-bold">
            <CIcon
              icon={cilCarAlt}
              className="me-2"
            />
            Monitoreo de entrada
          </h2>

          <p className="text-medium-emphasis mb-0">
            Captura una imagen para detectar
            automáticamente la placa y consultar
            el vehículo registrado.
          </p>
        </CCol>
      </CRow>

      {error && (
        <CAlert
          color="danger"
          className="d-flex align-items-center"
        >
          <CIcon
            icon={cilXCircle}
            className="me-2"
          />
          {error}
        </CAlert>
      )}

      {errorVehiculos && (
        <CAlert color="warning">
          No se pudieron cargar algunos vehículos
          registrados.
        </CAlert>
      )}

      <CRow>
        {/* =================================================
            CÁMARA
        ================================================== */}

        <CCol
          lg={6}
          className="mb-4"
        >
          <CCard className="h-100 shadow-sm">
            <CCardHeader>
              <strong>
                <CIcon
                  icon={cilCamera}
                  className="me-2"
                />
                Captura de placa
              </strong>
            </CCardHeader>

            <CCardBody>
              {!previewImagen && (
                <div
                  className="bg-dark rounded overflow-hidden position-relative"
                  style={{
                    minHeight: '360px',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-100 h-100"
                    style={{
                      minHeight: '360px',
                      objectFit: 'cover',
                    }}
                  />

                  {!camaraActiva &&
                    !iniciandoCamara && (
                      <div
                        className="position-absolute top-50 start-50 translate-middle text-center text-white"
                        style={{
                          width: '90%',
                        }}
                      >
                        <CIcon
                          icon={cilCamera}
                          size="4xl"
                          className="mb-3"
                        />

                        <div>
                          Presiona
                          <strong>
                            {' Activar cámara '}
                          </strong>
                          para comenzar.
                        </div>
                      </div>
                    )}
                </div>
              )}

              {previewImagen && (
                <div className="position-relative">
                  <CImage
                    src={previewImagen}
                    fluid
                    rounded
                    className="w-100"
                    style={{
                      maxHeight: '500px',
                      objectFit: 'contain',
                      backgroundColor: '#111',
                    }}
                  />

                  <CBadge
                    color={
                      origenImagen ===
                      'CAMARA'
                        ? 'primary'
                        : 'secondary'
                    }
                    className="position-absolute top-0 end-0 m-2"
                  >
                    {origenImagen}
                  </CBadge>
                </div>
              )}

              <canvas
                ref={canvasRef}
                style={{
                  display: 'none',
                }}
              />

              <div className="d-flex flex-wrap gap-2 mt-3">
                {!camaraActiva &&
                  !previewImagen && (
                    <CButton
                      color="primary"
                      onClick={
                        activarCamara
                      }
                      disabled={
                        iniciandoCamara
                      }
                    >
                      {iniciandoCamara ? (
                        <>
                          <CSpinner
                            size="sm"
                            className="me-2"
                          />
                          Activando...
                        </>
                      ) : (
                        <>
                          <CIcon
                            icon={cilCamera}
                            className="me-2"
                          />
                          Activar cámara
                        </>
                      )}
                    </CButton>
                  )}

                {camaraActiva && (
                  <CButton
                    color="success"
                    onClick={
                      capturarFotografia
                    }
                  >
                    <CIcon
                      icon={cilCamera}
                      className="me-2"
                    />
                    Capturar fotografía
                  </CButton>
                )}

                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() =>
                    archivoInputRef.current?.click()
                  }
                >
                  <CIcon
                    icon={cilCloudUpload}
                    className="me-2"
                  />
                  Subir imagen
                </CButton>

                <CFormInput
                  ref={archivoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={
                    seleccionarArchivo
                  }
                  className="d-none"
                />

                {previewImagen && (
                  <CButton
                    color="primary"
                    onClick={
                      detectarPlaca
                    }
                    disabled={
                      procesando ||
                      cargandoVehiculos
                    }
                  >
                    {procesando ? (
                      <>
                        <CSpinner
                          size="sm"
                          className="me-2"
                        />
                        Detectando...
                      </>
                    ) : (
                      <>
                        <CIcon
                          icon={cilCarAlt}
                          className="me-2"
                        />
                        Detectar placa
                      </>
                    )}
                  </CButton>
                )}

                {previewImagen && (
                  <CButton
                    color="danger"
                    variant="outline"
                    onClick={limpiarTodo}
                  >
                    <CIcon
                      icon={cilReload}
                      className="me-2"
                    />
                    Limpiar
                  </CButton>
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* =================================================
            RESULTADO
        ================================================== */}

        <CCol
          lg={6}
          className="mb-4"
        >
          <CCard className="h-100 shadow-sm">
            <CCardHeader>
              <strong>
                <CIcon
                  icon={cilCheckCircle}
                  className="me-2"
                />
                Resultado de detección
              </strong>
            </CCardHeader>

            <CCardBody>
              {!resultado && (
                <div className="text-center text-medium-emphasis py-5">
                  <CIcon
                    icon={cilCarAlt}
                    size="4xl"
                    className="mb-3"
                  />

                  <p className="mb-0">
                    Aquí aparecerá el resultado
                    de la detección.
                  </p>
                </div>
              )}

              {resultado && (
                <>
                  {/* =========================================
                      IMAGEN CON RECUADRO
                  ========================================== */}

                  {imagenMarcada && (
                    <div className="mb-4">
                      <h5 className="fw-bold mb-2">
                        Placa detectada
                      </h5>

                      <div
                        className="position-relative rounded overflow-hidden bg-dark"
                      >
                        <CImage
                          src={
                            imagenMarcada
                          }
                          fluid
                          className="w-100"
                          style={{
                            maxHeight:
                              '400px',
                            objectFit:
                              'contain',
                          }}
                        />

                        <div
                          className="position-absolute top-0 start-0 m-2"
                          style={{
                            pointerEvents:
                              'none',
                          }}
                        >
                          <CBadge
                            color="success"
                            className="fs-6"
                          >
                            <CIcon
                              icon={
                                cilCheckCircle
                              }
                              className="me-1"
                            />
                            PLACA DETECTADA
                          </CBadge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =========================================
                      PLACA
                  ========================================== */}

                  <div className="text-center mb-4">
                    <div className="text-medium-emphasis">
                      Placa detectada
                    </div>

                    <div
                      className="fw-bold"
                      style={{
                        fontSize: '2.5rem',
                        letterSpacing:
                          '0.12em',
                      }}
                    >
                      {placaDetectada ||
                        'NO DETECTADA'}
                    </div>

                    {confianza !==
                      null &&
                      confianza !==
                        undefined && (
                        <div className="text-medium-emphasis">
                          Confianza:{' '}
                          {typeof confianza ===
                          'number'
                            ? `${(
                                confianza <=
                                1
                                  ? confianza *
                                    100
                                  : confianza
                              ).toFixed(
                                1,
                              )}%`
                            : confianza}
                        </div>
                      )}
                  </div>

                  {/* =========================================
                      VEHÍCULO ENCONTRADO
                  ========================================== */}

                  {resultado.estado ===
                    'encontrado' &&
                    vehiculo && (
                      <CAlert
                        color="success"
                        className="mb-4"
                      >
                        <div className="d-flex align-items-center">
                          <CIcon
                            icon={
                              cilCheckCircle
                            }
                            size="xl"
                            className="me-2"
                          />

                          <div>
                            <strong>
                              Vehículo registrado
                            </strong>

                            <div>
                              La placa{' '}
                              <strong>
                                {
                                  placaDetectada
                                }
                              </strong>{' '}
                              pertenece a un
                              vehículo registrado.
                            </div>
                          </div>
                        </div>
                      </CAlert>
                    )}

                  {/* =========================================
                      VEHÍCULO NO REGISTRADO
                  ========================================== */}

                  {resultado.estado ===
                    'no_registrado' && (
                    <CAlert
                      color="warning"
                      className="mb-4"
                    >
                      <div className="d-flex align-items-center">
                        <CIcon
                          icon={
                            cilWarning
                          }
                          size="xl"
                          className="me-2"
                        />

                        <div>
                          <strong>
                            Vehículo no registrado
                          </strong>

                          <div>
                            La placa{' '}
                            <strong>
                              {
                                placaDetectada
                              }
                            </strong>{' '}
                            fue detectada, pero no
                            existe en los registros.
                          </div>
                        </div>
                      </div>
                    </CAlert>
                  )}

                  {/* =========================================
                      SIN PLACA
                  ========================================== */}

                  {resultado.estado ===
                    'sin_placa' && (
                    <CAlert color="danger">
                      <CIcon
                        icon={cilXCircle}
                        className="me-2"
                      />

                      No se pudo detectar una
                      placa en la imagen.
                    </CAlert>
                  )}

                  {/* =========================================
                      DATOS DEL VEHÍCULO
                  ========================================== */}

                  {vehiculo && (
                    <CCard
                      className="border mb-4"
                    >
                      <CCardHeader>
                        <strong>
                          <CIcon
                            icon={
                              cilCarAlt
                            }
                            className="me-2"
                          />
                          Información del vehículo
                        </strong>
                      </CCardHeader>

                      <CCardBody>
                        <CRow>
                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Placa
                            </small>

                            <div className="fw-bold fs-5">
                              {vehiculo.placa ||
                                placaDetectada}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Marca
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.marca ||
                                'No registrada'}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Modelo
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.modelo ||
                                'No registrado'}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Año
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.anio ||
                                'No registrado'}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Color
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.color ||
                                'No registrado'}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Tipo
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.tipo ||
                                'No registrado'}
                            </div>
                          </CCol>
                        </CRow>
                      </CCardBody>
                    </CCard>
                  )}

                  {/* =========================================
                      PROPIETARIO
                  ========================================== */}

                  {vehiculo && (
                    <CCard
                      className="border mb-4"
                    >
                      <CCardHeader>
                        <strong>
                          Datos del propietario
                        </strong>
                      </CCardHeader>

                      <CCardBody>
                        <CRow>
                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Propietario
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.propietario_nombre ||
                                'No registrado'}
                            </div>
                          </CCol>

                          <CCol
                            md={6}
                            className="mb-3"
                          >
                            <small className="text-medium-emphasis">
                              Cédula
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.cedula_enmascarada ||
                                'No registrada'}
                            </div>
                          </CCol>

                          <CCol
                            md={12}
                          >
                            <small className="text-medium-emphasis">
                              Correo institucional
                            </small>

                            <div className="fw-semibold">
                              {vehiculo.correo_institucional ||
                                'No registrado'}
                            </div>
                          </CCol>
                        </CRow>
                      </CCardBody>
                    </CCard>
                  )}

                  {/* =========================================
                      AUTORIZACIÓN
                  ========================================== */}

                  {vehiculo && (
                    <div className="text-center mb-4">
                      <div className="text-medium-emphasis mb-2">
                        Estado de autorización
                      </div>

                      {vehiculo.autorizado ? (
                        <CBadge
                          color="success"
                          className="fs-5 px-4 py-2"
                        >
                          <CIcon
                            icon={
                              cilCheckCircle
                            }
                            className="me-2"
                          />
                          AUTORIZADO
                        </CBadge>
                      ) : (
                        <CBadge
                          color="danger"
                          className="fs-5 px-4 py-2"
                        >
                          <CIcon
                            icon={
                              cilXCircle
                            }
                            className="me-2"
                          />
                          NO AUTORIZADO
                        </CBadge>
                      )}
                    </div>
                  )}

                  {/* =========================================
                      FOTOS DEL REGISTRO
                  ========================================== */}

                  {vehiculo && (
                    <CRow>
                      {vehiculo.foto_url && (
                        <CCol
                          md={4}
                          className="mb-3"
                        >
                          <small className="text-medium-emphasis">
                            Foto del vehículo
                          </small>

                          <CImage
                            src={
                              vehiculo.foto_url
                            }
                            fluid
                            rounded
                            className="mt-2"
                          />
                        </CCol>
                      )}

                      {vehiculo.foto_propietario_url && (
                        <CCol
                          md={4}
                          className="mb-3"
                        >
                          <small className="text-medium-emphasis">
                            Foto del propietario
                          </small>

                          <CImage
                            src={
                              vehiculo.foto_propietario_url
                            }
                            fluid
                            rounded
                            className="mt-2"
                          />
                        </CCol>
                      )}

                      {vehiculo.foto_fuente_url && (
                        <CCol
                          md={4}
                          className="mb-3"
                        >
                          <small className="text-medium-emphasis">
                            Imagen de referencia
                          </small>

                          <CImage
                            src={
                              vehiculo.foto_fuente_url
                            }
                            fluid
                            rounded
                            className="mt-2"
                          />
                        </CCol>
                      )}
                    </CRow>
                  )}

                  {/* =========================================
                      BOTÓN NUEVA CAPTURA
                  ========================================== */}

                  <div className="d-flex justify-content-center mt-3">
                    <CButton
                      color="primary"
                      onClick={
                        nuevaCaptura
                      }
                    >
                      <CIcon
                        icon={cilCamera}
                        className="me-2"
                      />
                      Nueva captura
                    </CButton>
                  </div>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default MonitoreoEntrada
