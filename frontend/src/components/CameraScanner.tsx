import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck, Scan, AlertTriangle, CheckCircle2, ArrowRight, UserPlus, Info } from 'lucide-react';

// --- INTERFACES ---
interface ScanLiveResponse {
  match_percentage: number;
  distance: number;
  is_real?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  [key: string]: unknown;
}

interface LoginSuccessResponse {
  authenticated: boolean;
  message: string;
  distance: number;
  similarity_percentage: number;
  access_token?: string;
  user: UserProfile;
}

interface ErrorResponse {
  detail: string;
}

// Configuración centralizada de la API en Render
const API_BASE_URL = 'https://tiempo-oscuro.onrender.com/api/v1/auth';

export const CameraScanner: React.FC = () => {
  const navigate = useNavigate();

  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const isFetchingFrame = useRef<boolean>(false);
  const isAuthenticatingRef = useRef<boolean>(false);
  const lastFailedAuthTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [similarity, setSimilarity] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isSpoofDetected, setIsSpoofDetected] = useState<boolean>(false);

  // Apagar los tracks de la cámara
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Encendido manual de la cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });

      setIsCameraActive(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.error('Error al reproducir video:', e));
        }
      });
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setMessage({
        text: 'No se pudo acceder a la cámara. Revisa los permisos o que no esté en uso por otra app.',
        isError: true,
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Envío de fotogramas livianos para el preview en vivo (320x240 @ 0.5 calidad)
  const captureFastFrameAndSend = useCallback(async () => {
    const video = videoRef.current;
    const miniCanvas = miniCanvasRef.current;

    if (
      isFetchingFrame.current ||
      !video ||
      !miniCanvas ||
      video.readyState !== video.HAVE_ENOUGH_DATA
    ) {
      return;
    }

    const ctx = miniCanvas.getContext('2d');
    if (!ctx) return;

    isFetchingFrame.current = true;

    miniCanvas.width = 320;
    miniCanvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    miniCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          isFetchingFrame.current = false;
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'frame_small.jpg');

        // Configuración de AbortController para cancelar peticiones pendientes si es necesario
        abortControllerRef.current = new AbortController();

        try {
          const response = await fetch(`${API_BASE_URL}/scan-live`, {
            method: 'POST',
            body: formData,
            signal: abortControllerRef.current.signal,
          });

          if (response.ok) {
            const data: ScanLiveResponse = await response.json();
            if (typeof data.match_percentage === 'number') {
              setSimilarity(Math.round(data.match_percentage));
            }
            setIsSpoofDetected(data.is_real === false);
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error enviando fotograma:', error);
          }
        } finally {
          isFetchingFrame.current = false;
        }
      },
      'image/jpeg',
      0.5
    );
  }, []);

  // Intervalo optimizado para Servidores Gratuitos (1 fotograma cada 1.5 segundos)
  useEffect(() => {
    if (!isCameraActive || activeTab !== 'login' || userData) {
      setSimilarity(0);
      setIsSpoofDetected(false);
      return;
    }

    const intervalId = setInterval(captureFastFrameAndSend, 1500);
    return () => clearInterval(intervalId);
  }, [isCameraActive, activeTab, userData, captureFastFrameAndSend]);

  // Proceso de Autenticación Facial
  const handleLogin = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      isAuthenticatingRef.current = false;
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLoading(true);
    setMessage(null);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoading(false);
      isAuthenticatingRef.current = false;
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setLoading(false);
          isAuthenticatingRef.current = false;
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'login.jpg');

        try {
          const response = await fetch(`${API_BASE_URL}/login-face`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            const res = data as LoginSuccessResponse;

            if (res.access_token) {
              localStorage.setItem('token', res.access_token);
            }
            if (res.user) {
              localStorage.setItem('user', JSON.stringify(res.user));
            }

            const distMsg = res.distance !== undefined ? ` (Distancia: ${res.distance.toFixed(4)})` : '';
            setMessage({
              text: `${res.message || 'Acceso concedido'}${distMsg}`,
              isError: false,
            });
            setUserData(res.user);

            setTimeout(() => {
              stopCamera();
              const userRole = res.user?.role;
              if (userRole === 'admin' || userRole === 'supplier') {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            }, 1500);
          } else {
            const err = data as ErrorResponse;
            setMessage({
              text: typeof err.detail === 'string' ? err.detail : 'Rostro no reconocido o falta de coincidencia.',
              isError: true,
            });
            setUserData(null);
            lastFailedAuthTime.current = Date.now();
          }
        } catch (error: any) {
          console.error('Error durante la autenticación:', error);
          setMessage({
            text: error?.message ? `Error de conexión: ${error.message}` : 'Error al conectar con el servidor en Render.',
            isError: true,
          });
          lastFailedAuthTime.current = Date.now();
        } finally {
          setLoading(false);
          isAuthenticatingRef.current = false;
        }
      },
      'image/jpeg',
      0.80
    );
  }, [navigate]);

  // Auto-login disparado por alto porcentaje de coincidencia
  useEffect(() => {
    const now = Date.now();
    const isCoolingDown = now - lastFailedAuthTime.current < 3000;

    if (
      similarity >= 75 &&
      activeTab === 'login' &&
      !loading &&
      !userData &&
      !isAuthenticatingRef.current &&
      !isCoolingDown
    ) {
      isAuthenticatingRef.current = true;
      handleLogin();
    }
  }, [similarity, activeTab, loading, userData, handleLogin]);

  // Proceso de Registro de Plantilla de Rostro
  const handleRegister = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    setLoading(true);
    setMessage(null);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoading(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', blob, 'register.jpg');

        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/register-face`, {
            method: 'POST',
            headers: headers,
            body: formData,
          });

          const data = await response.json();

          if (response.ok) {
            setMessage({
              text: '¡Rostro registrado exitosamente!',
              isError: false,
            });
          } else {
            const err = data as ErrorResponse;
            setMessage({
              text: err.detail || 'Error al guardar el rostro.',
              isError: true,
            });
          }
        } catch (error) {
          setMessage({ text: 'Error conectando con el servidor en Render.', isError: true });
        } finally {
          setLoading(false);
        }
      },
      'image/jpeg',
      0.80
    );
  };

  const resetStateOnTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setMessage(null);
    setUserData(null);
    setSimilarity(0);
    setIsSpoofDetected(false);
    isAuthenticatingRef.current = false;
    lastFailedAuthTime.current = 0;
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Canvas Ocultos */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={miniCanvasRef} style={{ display: 'none' }} />

      {/* Encabezado */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.eyebrow}>IDENTIDAD ADMINISTRATIVA</span>
          <div style={styles.iconBadge}>
            <Scan size={18} color="#132a21" />
          </div>
        </div>
        <h1 style={styles.title}>Laboratorio de comparación</h1>
        <p style={styles.subtitle}>
          Compara una persona voluntaria con tu plantilla, sin cambiarla.
        </p>

        {/* Pestañas de Navegación */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => resetStateOnTabChange('login')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'login' ? styles.activeTab : styles.inactiveTab),
            }}
          >
            Escáner de Validación
          </button>
          <button
            onClick={() => resetStateOnTabChange('register')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'register' ? styles.activeTab : styles.inactiveTab),
            }}
          >
            Registrar Plantilla
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div style={styles.gridContainer}>
        {/* Visor de Cámara */}
        <div style={styles.cameraCard}>
          <div style={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                ...styles.video,
                display: isCameraActive ? 'block' : 'none',
              }}
            />

            {!isCameraActive && (
              <div style={styles.cameraPlaceholder}>
                <Camera size={48} color="#f4f1ea" strokeWidth={1.5} />
                <h2 style={styles.placeholderTitle}>Tu rostro, tu acceso</h2>
                <p style={styles.placeholderSub}>Solo se activa cuando tú lo decides.</p>
                <button style={styles.primaryBtn} onClick={startCamera}>
                  <span>Encender cámara</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={styles.cameraFooter}>
            {isCameraActive ? (
              activeTab === 'login' ? (
                <button
                  style={{ ...styles.footerActionBtn, opacity: loading ? 0.7 : 1 }}
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Escanear mi Rostro (Manual)'}
                </button>
              ) : (
                <button
                  style={{ ...styles.footerActionBtn, opacity: loading ? 0.7 : 1 }}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar mi Rostro'}
                </button>
              )
            ) : (
              <span style={styles.footerText}>Enciende tu cámara para comenzar</span>
            )}
          </div>
        </div>

        {/* Panel Lateral Interactivo */}
        {activeTab === 'login' ? (
          <div style={styles.metricsCard}>
            <span style={styles.metricsTitle}>SIMILITUD FACIAL</span>

            <div style={styles.percentageDisplay}>
              <span style={styles.percentageNumber}>
                {isCameraActive ? similarity : '—'}
              </span>
              <span style={styles.percentageSymbol}>%</span>
            </div>

            <div style={styles.progressSection}>
              <div style={styles.track}>
                <div
                  style={{
                    ...styles.fill,
                    width: `${similarity}%`,
                    backgroundColor: isSpoofDetected ? '#dc2626' : '#132a21',
                  }}
                />
                <div style={styles.thresholdMarker} />
              </div>
              <div style={styles.trackLabels}>
                <span>0%</span>
                <span style={styles.thresholdLabel}>Umbral 50%</span>
                <span>100%</span>
              </div>
            </div>

            {isSpoofDetected && (
              <div style={styles.alertBox}>
                <AlertTriangle size={16} />
                <span>Pantalla o imagen detectada. Usa un rostro real.</span>
              </div>
            )}

            {message && (
              <div
                style={{
                  ...styles.messageBox,
                  ...(message.isError ? styles.errorMessage : styles.successMessage),
                }}
              >
                {message.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            {!message && !isSpoofDetected && (
              <div style={styles.statusBox}>
                <ShieldCheck size={18} color="#6b7280" />
                <div>
                  <strong style={styles.statusTitle}>Esperando comparación</strong>
                  <p style={styles.statusSub}>El resultado aparecerá al terminar el reto.</p>
                </div>
              </div>
            )}

            <div style={styles.metadataContainer}>
              <div style={styles.metaRow}>
                <span>Modelo</span>
                <strong>SFace / DeepFace</strong>
              </div>
              <div style={styles.metaRow}>
                <span>Dimensiones</span>
                <strong>128</strong>
              </div>
              <div style={styles.metaRow}>
                <span>Distancia L2</span>
                <strong>{userData ? 'Coincidencia ok' : '—'}</strong>
              </div>
            </div>

            <p style={styles.disclaimer}>
              Porcentaje = similitud coseno × 100 (mínimo visible 0). No es una probabilidad de identidad.
            </p>

            {userData && (
              <div style={styles.userPanel}>
                <h4 style={styles.userPanelTitle}>Usuario Verificado</h4>
                <p style={styles.userPanelRow}><strong>Nombre:</strong> {userData.full_name || 'Usuario'}</p>
                <p style={styles.userPanelRow}><strong>Email:</strong> {userData.email}</p>
                <p style={styles.userPanelRow}><strong>Rol:</strong> {userData.role || 'Sin rol'}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.metricsCard}>
            <span style={styles.metricsTitle}>REGISTRO DE PLANTILLA</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={styles.registerBadge}>
                <UserPlus size={24} color="#132a21" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'serif', color: '#132a21' }}>
                  Captura de Vector
                </h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Añade un nuevo rostro al sistema
                </span>
              </div>
            </div>

            {message && (
              <div
                style={{
                  ...styles.messageBox,
                  ...(message.isError ? styles.errorMessage : styles.successMessage),
                }}
              >
                {message.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                <span>{message.text}</span>
              </div>
            )}

            <div style={styles.instructionList}>
              <div style={styles.instructionItem}>
                <Info size={16} color="#132a21" style={{ flexShrink: 0 }} />
                <span>Sitúate frente a la cámara con buena iluminación frontal.</span>
              </div>
              <div style={styles.instructionItem}>
                <Info size={16} color="#132a21" style={{ flexShrink: 0 }} />
                <span>Mantén la mirada fija y una expresión neutra.</span>
              </div>
              <div style={styles.instructionItem}>
                <Info size={16} color="#132a21" style={{ flexShrink: 0 }} />
                <span>Haz clic en "Guardar mi Rostro" para almacenar la plantilla en Supabase.</span>
              </div>
            </div>

            <div style={styles.metadataContainer}>
              <div style={styles.metaRow}>
                <span>Algoritmo</span>
                <strong>DeepFace SFace</strong>
              </div>
              <div style={styles.metaRow}>
                <span>Almacenamiento</span>
                <strong>Vector DB / Supabase</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS EN OBJETO ---
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    maxWidth: '1080px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: '32px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    color: '#8c7a6b',
    textTransform: 'uppercase',
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    backgroundColor: '#e8ece9',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'serif',
    fontSize: '32px',
    fontWeight: '400',
    color: '#132a21',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '8px',
  },
  tabButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    backgroundColor: '#132a21',
    color: '#f4f1ea',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
    color: '#64748b',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  cameraCard: {
    backgroundColor: '#132a21',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: '380px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#0c1b15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPlaceholder: {
    textAlign: 'center',
    color: '#f4f1ea',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  placeholderTitle: {
    fontFamily: 'serif',
    fontSize: '24px',
    fontWeight: '400',
    margin: '16px 0 8px 0',
  },
  placeholderSub: {
    fontSize: '13px',
    color: '#a3b18a',
    margin: '0 0 24px 0',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f4f1ea',
    color: '#132a21',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cameraFooter: {
    backgroundColor: '#0c1b15',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  footerText: {
    color: '#a3b18a',
    fontSize: '13px',
  },
  footerActionBtn: {
    width: '100%',
    backgroundColor: '#f4f1ea',
    color: '#132a21',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  metricsCard: {
    backgroundColor: '#f9f8f3',
    borderRadius: '16px',
    border: '1px solid #e8e5dc',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metricsTitle: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.1em',
    color: '#8c7a6b',
  },
  percentageDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  percentageNumber: {
    fontFamily: 'serif',
    fontSize: '48px',
    color: '#132a21',
    lineHeight: 1,
  },
  percentageSymbol: {
    fontSize: '20px',
    color: '#6b7280',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  track: {
    position: 'relative',
    height: '8px',
    backgroundColor: '#e2dfd5',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    transition: 'width 0.2s ease, background-color 0.2s ease',
  },
  thresholdMarker: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#8c7a6b',
  },
  trackLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#9ca3af',
  },
  thresholdLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  alertBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '12px',
  },
  messageBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
  },
  successMessage: {
    backgroundColor: '#e8ece9',
    color: '#132a21',
    border: '1px solid #c2ceb8',
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  statusBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f0ede4',
    borderRadius: '8px',
  },
  statusTitle: {
    display: 'block',
    fontSize: '13px',
    color: '#132a21',
  },
  statusSub: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0 0 0',
  },
  metadataContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #e8e5dc',
    paddingTop: '16px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6b7280',
  },
  disclaimer: {
    fontSize: '11px',
    color: '#9ca3af',
    lineHeight: 1.4,
    margin: 0,
  },
  userPanel: {
    borderTop: '1px solid #e8e5dc',
    paddingTop: '12px',
  },
  userPanelTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#132a21',
    margin: '0 0 6px 0',
  },
  userPanelRow: {
    fontSize: '12px',
    color: '#4b5563',
    margin: '2px 0',
  },
  registerBadge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e8ece9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  instructionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#4b5563',
    lineHeight: 1.4,
  },
};

export default CameraScanner;