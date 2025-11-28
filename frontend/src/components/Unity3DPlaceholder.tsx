import React, { useEffect, useState } from 'react';
import { unity3dService, WorldData } from '@/services/unity3dService';
import './Unity3DPlaceholder.css';

/**
 * ============================================
 * COMPONENTE PLACEHOLDER PARA UNITY 3D WEBGL
 * ============================================
 * 
 * ESTE COMPONENTE SERÁ REEMPLAZADO con el build
 * de Unity WebGL cuando esté disponible.
 * 
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 
 * 1. Generar el build de Unity WebGL
 * 2. Copiar los archivos generados a /public/unity-build/
 * 3. Reemplazar este componente con el loader de Unity:
 *    - Importar el script de Unity
 *    - Inicializar createUnityInstance()
 *    - Conectar eventos bidireccionales
 * 
 * ENDPOINTS API DISPONIBLES:
 * - GET /api/3d/points - Puntos de interés
 * - GET /api/3d/areas - Áreas del campus
 * - GET /api/3d/world - Datos completos
 * 
 * COMUNICACIÓN:
 * - React → Unity: unity3dService.sendToUnity(message)
 * - Unity → React: unity3dService.onUnityEvent(callback)
 * 
 * Ver documentación completa en:
 * docs/3D_INTEGRATION_GUIDE.md
 */

const Unity3DPlaceholder: React.FC = () => {
    const [worldData, setWorldData] = useState<WorldData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWorldData();
        setupUnityEvents();
    }, []);

    const loadWorldData = async () => {
        try {
            const data = await unity3dService.getWorldData();
            setWorldData(data);
            console.log('📊 Datos del mundo 3D cargados:', data);
        } catch (error) {
            console.error('Error cargando datos 3D:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupUnityEvents = () => {
        unity3dService.onUnityEvent((event) => {
            console.log('🎮 Evento desde Unity:', event);
            // Manejar eventos del 3D aquí
        });
    };

    const handleTestInteraction = () => {
        unity3dService.sendToUnity({
            type: 'NAVIGATE_TO_POINT',
            pointId: 1,
        });
        console.log('✉️ Mensaje enviado a Unity (simulado)');
    };

    return (
        <div className="unity3d-placeholder">
            <div className="placeholder-overlay">
                <div className="placeholder-content">
                    <div className="placeholder-icon">🎮</div>
                    <h2>ESPACIO RESERVADO PARA INTEGRACIÓN</h2>
                    <h3>MODELADO 3D UNITY WEBGL</h3>

                    <div className="placeholder-info">
                        <p><strong>Este espacio está preparado para el modelo 3D del campus</strong></p>
                        <p>Dimensiones: Responsivas (100% ancho x altura viewport)</p>
                        <p>Tecnología: Unity WebGL</p>
                    </div>

                    {worldData && (
                        <div className="placeholder-data">
                            <h4>📡 Conexión API Activa</h4>
                            <div className="data-grid">
                                <div className="data-item">
                                    <span className="data-label">Puntos de Interés:</span>
                                    <span className="data-value">{worldData.metadata.totalPoints}</span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Áreas del Campus:</span>
                                    <span className="data-value">{worldData.metadata.totalAreas}</span>
                                </div>
                                <div className="data-item">
                                    <span className="data-label">Última Actualización:</span>
                                    <span className="data-value">
                                        {new Date(worldData.metadata.lastUpdate).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary test-btn"
                        onClick={handleTestInteraction}
                        disabled={loading}
                    >
                        {loading ? 'Cargando datos...' : '🧪 Probar Comunicación Unity'}
                    </button>

                    <div className="integration-steps">
                        <h4>🔧 Pasos para Integración:</h4>
                        <ol>
                            <li>Generar build de Unity WebGL</li>
                            <li>Copiar archivos a <code>/public/unity-build/</code></li>
                            <li>Actualizar Unity3DPlaceholder.tsx con loader de Unity</li>
                            <li>Configurar comunicación bidireccional</li>
                            <li>Testear endpoints <code>/api/3d/*</code></li>
                        </ol>
                    </div>

                    <div className="docs-link">
                        <p>📖 Documentación completa: <code>docs/3D_INTEGRATION_GUIDE.md</code></p>
                    </div>
                </div>
            </div>

            {/* Aquí irá el canvas de Unity WebGL */}
            <canvas id="unity-canvas" style={{ display: 'none' }}></canvas>
        </div>
    );
};

export default Unity3DPlaceholder;
