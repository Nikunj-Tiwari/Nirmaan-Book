import React, { Suspense, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import RoomEnvironment from './three/RoomEnvironment';
import WardrobeAssembly from './three/WardrobeAssembly';
import { useConfig } from '../store/ConfigContext';

const mmToMeters = (v) => v / 1000;

// ─── View preset positions ────────────────────────────────────────────────────
function getPresetPositions(modules, roomWidth, roomHeight, roomDepth) {
  const totalW = modules.reduce((s, m) => s + m.width, 0);
  const w = mmToMeters(totalW || roomWidth);
  const h = mmToMeters(roomHeight);
  const d = mmToMeters(roomDepth);

  return {
    center: new THREE.Vector3(0, h * 0.46, 0),
    perspective: new THREE.Vector3(Math.max(w * 0.9, 1.8), h * 0.62, Math.max(d * 2.6, 3.2)),
    front: new THREE.Vector3(0, h * 0.52, Math.max(d * 3.2, 3.8)),
    side: new THREE.Vector3(Math.max(w * 2.4, 3.2), h * 0.5, 0.6),
    top: new THREE.Vector3(0.01, Math.max(h * 2.8, 3.5), 0.02),
  };
}

// ─── Smooth camera rig (lerps toward target every frame) ─────────────────────
function CameraRig({ modules, roomWidth, roomHeight, roomDepth, viewPreset }) {
  const { camera, controls } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const presets = useMemo(
    () => getPresetPositions(modules, roomWidth, roomHeight, roomDepth),
    [modules, roomWidth, roomHeight, roomDepth]
  );

  // Update targets whenever preset changes
  React.useEffect(() => {
    const pos = presets[viewPreset] || presets.perspective;
    targetPos.current.copy(pos);
    targetLookAt.current.copy(presets.center);

    if (!initialized.current) {
      // Snap immediately on first render
      camera.position.copy(pos);
      if (controls) {
        controls.target.copy(presets.center);
        controls.update();
      }
      initialized.current = true;
    }
  }, [viewPreset, presets, camera, controls]);

  useFrame(() => {
    // Smoothly lerp camera to target (only when not being manually dragged)
    const lerpFactor = 0.055;
    camera.position.lerp(targetPos.current, lerpFactor);

    if (controls) {
      controls.target.lerp(targetLookAt.current, lerpFactor);
      controls.update();
    }
  });

  return null;
}

// ─── Loading spinner overlay ──────────────────────────────────────────────────
function LoadingOverlay({ darkMode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode ? '#111' : '#f8fafc',
        zIndex: 8,
      }}
    >
      <div style={{ textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(59,130,246,0.3)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 10px',
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 600 }}>Building 3D model…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── View preset button ───────────────────────────────────────────────────────
const VIEW_PRESETS = [
  { id: 'perspective', label: '3D', icon: '◈' },
  { id: 'front', label: 'Front', icon: '▭' },
  { id: 'side', label: 'Side', icon: '▯' },
  { id: 'top', label: 'Top', icon: '⊡' },
];

// ─── Main Viewer3D component ──────────────────────────────────────────────────
export function Viewer3D({
  modules = [],
  material,
  roomWidth,
  roomHeight = 2400,
  roomDepth = 600,
  darkMode = false,
}) {
  const [viewPreset, setViewPreset] = useState('perspective');
  const [hoveredModule, setHoveredModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = darkMode ? '#0f1115' : '#f4f5f7';

  return (
    <div
      className="viewer-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: bgColor,
        borderRadius: 'inherit',
        overflow: 'hidden',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2, 1.6, 3.2], fov: 40 }}
        gl={{
          alpha: false,
          antialias: true,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        onCreated={() => setIsLoading(false)}
      >
        <color attach="background" args={[bgColor]} />

        <CameraRig
          modules={modules}
          roomWidth={roomWidth}
          roomHeight={roomHeight}
          roomDepth={roomDepth}
          viewPreset={viewPreset}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.07}
          maxDistance={12}
          minDistance={0.4}
          maxPolarAngle={Math.PI / 2.05}
          enablePan={true}
        />

        <Suspense fallback={null}>
          <RoomEnvironment width={roomWidth || 2400} height={roomHeight} depth={roomDepth} />

          {modules.length > 0 && (
            <WardrobeAssembly
              modules={modules}
              material={material}
              roomDimensions={{ width: roomWidth || 2400, height: roomHeight, depth: roomDepth }}
              onModuleHover={setHoveredModule}
            />
          )}

          <ContactShadows
            position={[0, 0.005, 0]}
            opacity={darkMode ? 0.45 : 0.28}
            scale={14}
            blur={2.2}
            far={5}
            color={darkMode ? '#000' : '#7a8090'}
          />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay darkMode={darkMode} />}

      {/* ── HUD: Top-left info badge ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          background: darkMode ? 'rgba(15,17,21,0.75)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          padding: '9px 14px',
          borderRadius: 12,
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(209,213,219,0.7)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 130,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 3,
          }}
        >
          Live 3D Preview
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: darkMode ? '#f1f5f9' : '#0f172a',
          }}
        >
          {modules.length === 0
            ? 'No modules yet'
            : `${modules.length} Module${modules.length !== 1 ? 's' : ''}`}
        </div>
        {hoveredModule && (
          <div
            style={{
              fontSize: 10,
              color: '#3b82f6',
              marginTop: 3,
              fontWeight: 600,
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            ↗ {hoveredModule.id}
          </div>
        )}
      </div>

      {/* ── HUD: Top-right view controls ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: darkMode ? 'rgba(15,17,21,0.75)' : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            padding: '5px',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            border: darkMode
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(209,213,219,0.7)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {VIEW_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewPreset(p.id)}
              title={`Switch to ${p.label} view`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: viewPreset === p.id ? '#3b82f6' : 'transparent',
                color: viewPreset === p.id ? '#fff' : darkMode ? '#94a3b8' : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (viewPreset !== p.id) {
                  e.currentTarget.style.background = darkMode
                    ? 'rgba(59,130,246,0.18)'
                    : 'rgba(59,130,246,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewPreset !== p.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 13 }}>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {modules.length === 0 && !isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 10,
            color: darkMode ? '#475569' : '#94a3b8',
            textAlign: 'center',
            padding: 40,
            pointerEvents: 'none',
            zIndex: 6,
          }}
        >
          <div style={{ fontSize: 38, opacity: 0.5 }}>📐</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            Add modules in Step 2 to see the 3D model
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewer3D;
