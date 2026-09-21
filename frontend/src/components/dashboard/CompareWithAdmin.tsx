import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { compareFaceWithAdmin, type FaceComparisonResult } from '../../services/api_login';
import './CompareWithAdmin.css';

export const CompareWithAdmin: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); // Progreso de animación (0 a 100%)
  const [result, setResult] = useState<FaceComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Proceso de escaneo por tiempo determinado (3 segundos)
  const startScanProcess = useCallback(async () => {
    if (!webcamRef.current || isScanning) return;

    setIsScanning(true);
    setResult(null);
    setError(null);
    setScanProgress(0);

    // 1. Duración del escaneo visual: 3000ms (3 segundos)
    const scanDuration = 3000;
    const updateInterval = 50;
    const totalSteps = scanDuration / updateInterval;
    let currentStep = 0;

    // Animación fluida de la barra de carga hasta el 95%
    const progressTimer = setInterval(() => {
      currentStep++;
      setScanProgress(Math.min(Math.round((currentStep / totalSteps) * 100), 95));
    }, updateInterval);

    try {
      // Esperar a que la cámara estabilice la captura
      await new Promise((resolve) => setTimeout(resolve, 500));

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('No se pudo obtener la captura de la cámara.');
      }

      const blob = await (await fetch(imageSrc)).blob();
      const data = await compareFaceWithAdmin(blob);

      // Esperar a que termine la animación de 3 segundos para mostrar la respuesta
      const remainingTime = scanDuration - currentStep * updateInterval;
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      clearInterval(progressTimer);
      setScanProgress(100);
      setResult(data);
      setError(null);
    } catch (e: unknown) {
      clearInterval(progressTimer);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Error al procesar el escaneo facial.');
      }
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const toggleCamera = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
      setResult(null);
      setError(null);
      setScanProgress(0);
    } else {
      setIsCameraActive(true);
    }
  };

  // Valor a mostrar en la barra: Durante el escaneo muestra el progreso visual; una vez terminado, muestra la similitud calculada.
  const displayValue = isScanning
    ? scanProgress
    : result
    ? Math.min(Math.max(result.similarity, 0), 100)
    : 0;

  return (
    <div className="lab-container">
      {/* Encabezado */}
      <div className="lab-header">
        <div>
          <div className="lab-subtitle">Identidad Administrativa</div>
          <h2 className="lab-title">Laboratorio de comparación</h2>
          <p className="lab-description">
            Compara una persona voluntaria con tu plantilla, sin cambiarla.
          </p>
        </div>
        <div className="lab-header-icon">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
            />
          </svg>
        </div>
      </div>

      {/* Grid de 2 Columnas */}
      <div className="lab-grid">
        {/* Lado Izquierdo: Visor de Cámara */}
        <div className="camera-card">
          {isCameraActive ? (
            <div className="webcam-wrapper">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="webcam-video"
              />
              {isScanning && <div className="scanning-badge">Analizando ({scanProgress}%)...</div>}
            </div>
          ) : (
            <div className="camera-placeholder">
              <div className="camera-icon-circle">
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="placeholder-title">Tu rostro, tu acceso</h3>
              <p className="placeholder-text">Solo se activa cuando tú lo decides.</p>
              <button onClick={toggleCamera} className="btn-toggle-camera">
                Encender cámara →
              </button>
            </div>
          )}

          <div className="camera-footer">
            <span>
              {isScanning
                ? 'Escaneando rostro...'
                : isCameraActive
                ? 'Cámara lista para escanear'
                : 'Enciende tu cámara para comenzar'}
            </span>
            {isCameraActive && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={startScanProcess}
                  disabled={isScanning}
                  className="btn-toggle-camera"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  {isScanning ? 'Escaneando...' : 'Iniciar Escaneo (3s)'}
                </button>
                <button onClick={toggleCamera} disabled={isScanning} className="btn-turn-off">
                  Apagar cámara
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Panel de Similitud Facial */}
        <div className="results-card">
          <div>
            <div className="lab-subtitle">Similitud Facial</div>

            {/* Métrica de Porcentaje */}
            <div className="metric-container">
              <span className="metric-number">
                {isScanning ? `${scanProgress}` : result ? `${result.similarity.toFixed(1)}` : '—'}
              </span>
              <span className="metric-symbol">%</span>
            </div>

            {/* Barra de Progreso Dinámica */}
            <div className="progress-bar-wrapper">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${displayValue}%` }} />
              </div>
              <div className="threshold-marker">
                <div className="threshold-line" />
              </div>
              <div className="progress-labels">
                <span>0%</span>
                <span>Umbral 50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Estado de Validación */}
            <div className="status-section">
              <div className="status-header">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <h4 className="status-title">
                  {isScanning
                    ? 'Procesando escaneo...'
                    : result
                    ? result.matches
                      ? 'Coincidencia confirmada'
                      : 'Sin coincidencia suficiente'
                    : 'Esperando escaneo'}
                </h4>
              </div>
              <p className="status-text">
                {isScanning
                  ? 'Analizando rasgos vectoriales frente al administrador...'
                  : result
                  ? result.matches
                    ? 'El rostro coincide con los registros del administrador.'
                    : 'La distancia vectorial supera el umbral configurado.'
                  : 'Presiona "Iniciar Escaneo" para ejecutar la prueba de 3 segundos.'}
              </p>
            </div>
          </div>

          {/* Metadatos del Modelo */}
          <div className="model-details">
            <div className="model-row">
              <span>Modelo</span>
              <span className="model-value">SFace</span>
            </div>
            <div className="model-row">
              <span>Dimensiones</span>
              <span className="model-value">128</span>
            </div>
            <div className="model-row">
              <span>Distancia L2</span>
              <span className="model-value">
                {result ? result.distance.toFixed(4) : '—'}
              </span>
            </div>
            <p className="model-disclaimer">
              Porcentaje = similitud coseno × 100 (mínimo visible 0). No es una probabilidad de identidad.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
    </div>
  );
};