import React, { Suspense, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import RoomEnvironment from './three/RoomEnvironment';
import WardrobeAssembly from './three/WardrobeAssembly';
import { useConfig } from '../store/ConfigContext';

const mmToMeters = (v) => v / 1000;

// ─── Camera presets ───────────────────────────────────────────────────────────
function getPresets(modules, rW, rH, rD) {
  const totalW = modules.reduce((s, m) => s + m.width, 0);
  const w = mmToMeters(totalW || rW);
  const h = mmToMeters(rH);
  const d = mmToMeters(rD);

  // Camera is INSIDE the room at +Z, looking toward wardrobe at origin.
  // Wardrobe front face is at z = +d, back at z = 0.
  const eyeZ = Math.max(d * 2.8, 3.5); // distance from camera to back wall
  const eyeX = w * 0.15; // slight offset for natural angle
  const eyeY = h * 0.52; // eye-level ≈ 52% of wardrobe height
  const lookY = h * 0.44; // look slightly below eye to see interior

  return {
    center: new THREE.Vector3(0, lookY, d / 2),
    perspective: new THREE.Vector3(eyeX, eyeY, eyeZ),
    front: new THREE.Vector3(0, h * 0.5, Math.max(d * 3.5, 4.2)),
    side: new THREE.Vector3(Math.max(w * 1.8, 2.8), h * 0.5, d * 1.2),
    top: new THREE.Vector3(0.01, Math.max(h * 2.2, 4.0), d * 0.5),
    corner: new THREE.Vector3(-Math.max(w * 0.9, 1.6), h * 0.58, Math.max(d * 2.2, 3.0)),
  };
}

// ─── Smooth camera rig ────────────────────────────────────────────────────────
function CameraRig({ modules, roomWidth, roomHeight, roomDepth, viewPreset }) {
  const { camera, controls } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const presets = useMemo(
    () => getPresets(modules, roomWidth, roomHeight, roomDepth),
    [modules, roomWidth, roomHeight, roomDepth]
  );

  React.useEffect(() => {
    const pos = presets[viewPreset] || presets.perspective;
    targetPos.current.copy(pos);
    targetLookAt.current.copy(presets.center);

    if (!initialized.current) {
      camera.position.copy(pos);
      if (controls) {
        controls.target.copy(presets.center);
        controls.update();
      }
      initialized.current = true;
    }
  }, [viewPreset, presets, camera, controls]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.055);
    if (controls) {
      controls.target.lerp(targetLookAt.current, 0.055);
      controls.update();
    }
  });

  return null;
}

// ─── SVG Icon helpers ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  perspective:
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  front: 'M3 3h18v18H3z',
  side: 'M9 3L3 9v12h12V9L9 3z',
  top: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  corner: 'M4 4l16 0M4 4l0 16M20 4l0 8M4 20l8 0',
  reset: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15',
};

const VIEW_PRESETS = [
  { id: 'perspective', label: 'Perspective', shortLabel: '3D' },
  { id: 'front', label: 'Front', shortLabel: 'Fr' },
  { id: 'side', label: 'Side', shortLabel: 'Si' },
  { id: 'top', label: 'Top', shortLabel: 'Tp' },
  { id: 'corner', label: 'Corner', shortLabel: 'Co' },
];

const WALL_LABELS = {
  A: { label: 'Main', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  B: { label: 'Left', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  C: { label: 'Right', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
};

// ─── Loading overlay ──────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        zIndex: 8,
      }}
    >
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(59,130,246,0.25)',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
          Building 3D model…
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Wall Assignment Pill ─────────────────────────────────────────────────────
function WallPill({ wallKey, currentWall, availableWalls, onAssign }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {availableWalls.map((w) => {
        const info = WALL_LABELS[w];
        const isActive = currentWall === w;
        return (
          <button
            key={w}
            onClick={() => onAssign(wallKey, w)}
            title={`Move to ${info.label} wall`}
            style={{
              padding: '2px 8px',
              borderRadius: 5,
              border: isActive ? `1px solid ${info.color}` : '1px solid rgba(255,255,255,0.12)',
              background: isActive ? info.bg : 'transparent',
              color: isActive ? info.color : 'rgba(255,255,255,0.4)',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.06em',
              transition: 'all 0.15s',
              lineHeight: 1.5,
            }}
          >
            {w}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Viewer3D ────────────────────────────────────────────────────────────
export function Viewer3D({
  modules = [],
  material,
  roomWidth,
  roomHeight = 2400,
  roomDepth = 600,
  wallType = 'single',
  width2 = 1200,
  width3 = 1200,
}) {
  const { actions, config } = useConfig();
  const [viewPreset, setViewPreset] = useState('perspective');
  const [hoveredModule, setHoveredModule] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWallPanel, setShowWallPanel] = useState(false);
  const orbitRef = useRef();

  const isMultiWall = wallType === 'l-shape' || wallType === 'u-shape';
  const availableWalls = wallType === 'u-shape' ? ['A', 'B', 'C'] : ['A', 'B'];

  // Reset camera to perspective
  const resetCamera = useCallback(() => {
    setViewPreset('_reset_' + Date.now()); // force re-effect
    setTimeout(() => setViewPreset('perspective'), 50);
  }, []);

  const handleRotate = () => {
    if (!selectedModule) return;
    const currentRot = selectedModule.rotation || 0;
    const nextRot = (currentRot + 90) % 360;
    actions.setModuleOverride(selectedModule.wallKey, 'rotation', nextRot);
    // Update local selection to reflect state change immediately
    setSelectedModule({ ...selectedModule, rotation: nextRot });
  };

  const handleWallChange = (newWall) => {
    if (!selectedModule) return;
    actions.setModuleWall(selectedModule.wallKey, newWall);
    setSelectedModule({ ...selectedModule, wall: newWall });
  };

  const bgColor = '#0d1117';

  // Glass panel style
  const glass = {
    background: 'rgba(13,17,23,0.82)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    borderRadius: 14,
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: bgColor,
        borderRadius: 'inherit',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
      }}
    >
      {/* ── 3D Canvas ────────────────────────────────────────────────── */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0.3, 1.4, 3.8], fov: 42, near: 0.1, far: 40 }}
        gl={{
          alpha: false,
          antialias: true,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
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
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxDistance={15}
          minDistance={0.01}
          minPolarAngle={0}
          maxPolarAngle={Math.PI} // Full freedom
          enablePan={true}
          target={[0, 1.1, 0.3]}
        />

        <Suspense fallback={null}>
          <RoomEnvironment
            width={roomWidth || 2400}
            height={roomHeight}
            depth={roomDepth}
            wallType={wallType}
            width2={width2}
            width3={width3}
          />

          {modules.length > 0 && (
            <WardrobeAssembly
              modules={modules}
              material={material}
              roomDimensions={{
                width: roomWidth || 2400,
                height: roomHeight,
                depth: roomDepth,
                wallType,
                width2,
                width3,
              }}
              onModuleHover={setHoveredModule}
              onModuleClick={setSelectedModule}
            />
          )}

          <ContactShadows
            position={[0, 0.005, 0]}
            opacity={0.5}
            scale={16}
            blur={2.5}
            far={6}
            color="#000"
          />
        </Suspense>
      </Canvas>

      {/* ── Loading overlay ───────────────────────────────────────────── */}
      {isLoading && <LoadingOverlay />}

      {/* ── TOP-LEFT: Info badge ──────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          ...glass,
          padding: '10px 14px',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 140,
        }}
      >
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 4,
          }}
        >
          ◈ Live 3D Preview
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
          {modules.length === 0
            ? 'No modules'
            : `${modules.length} Module${modules.length !== 1 ? 's' : ''}`}
        </div>
        {hoveredModule && (
          <div
            style={{
              fontSize: 10,
              color: '#60a5fa',
              marginTop: 4,
              fontWeight: 600,
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            ↗ {hoveredModule.id}
          </div>
        )}
        {isMultiWall && (
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
            }}
          >
            {availableWalls.map((w) => {
              const count = modules.filter((m) => m.wall === w).length;
              const info = WALL_LABELS[w];
              return (
                <div
                  key={w}
                  style={{
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: info.bg,
                    border: `1px solid ${info.color}40`,
                    fontSize: 9,
                    fontWeight: 700,
                    color: info.color,
                    letterSpacing: '0.05em',
                  }}
                >
                  {w}: {count}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TOP-RIGHT: View preset controls + reset ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'flex-end',
        }}
      >
        {/* View preset pills */}
        <div style={{ ...glass, padding: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {VIEW_PRESETS.map((p) => {
            const isActive = viewPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setViewPreset(p.id)}
                title={p.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 11px',
                  borderRadius: 9,
                  border: isActive ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))'
                    : 'transparent',
                  color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }
                }}
              >
                <Icon d={ICONS[p.id]} size={13} color="currentColor" strokeWidth={2} />
                {p.label}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 4px' }} />

          {/* Reset camera */}
          <button
            onClick={resetCamera}
            title="Reset camera to default view"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 11px',
              borderRadius: 9,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            <Icon d={ICONS.reset} size={13} color="currentColor" strokeWidth={2} />
            Reset
          </button>
        </div>
      </div>

      {/* ── CENTER-RIGHT: Module Inspector ────────────────────────────── */}
      {selectedModule && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: 12,
            transform: 'translateY(-50%)',
            ...glass,
            padding: '16px',
            width: 200,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.1em' }}
            >
              MODULE SETTINGS
            </div>
            <button
              onClick={() => setSelectedModule(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>
              {selectedModule.id}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              {selectedModule.width}x{selectedModule.height}x{selectedModule.depth}mm
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Rotation Control */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 8,
              }}
            >
              ORIENTATION
            </div>
            <button
              onClick={handleRotate}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 8,
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#60a5fa',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Rotate 90°
              <span style={{ opacity: 0.5 }}>({selectedModule.rotation || 0}°)</span>
            </button>
          </div>

          {/* Wall Control */}
          {isMultiWall && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 8,
                }}
              >
                ASSIGN TO WALL
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {availableWalls.map((w) => {
                  const isActive = (selectedModule.wall || 'A') === w;
                  return (
                    <button
                      key={w}
                      onClick={() => handleWallChange(w)}
                      style={{
                        padding: '6px',
                        borderRadius: 6,
                        border: isActive ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          <button
            onClick={() => actions.setModuleQty(selectedModule.id, -1)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
            }}
          >
            Remove Module
          </button>
        </div>
      )}

      {/* ── BOTTOM: Wall Assignment Panel (L/U shape only) ─────────────── */}
      {isMultiWall && modules.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 10,
          }}
        >
          {/* Toggle button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
            <button
              onClick={() => setShowWallPanel((v) => !v)}
              style={{
                ...glass,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                color: showWallPanel ? '#60a5fa' : 'rgba(255,255,255,0.55)',
                border: showWallPanel
                  ? '1px solid rgba(59,130,246,0.4)'
                  : '1px solid rgba(255,255,255,0.09)',
                background: showWallPanel ? 'rgba(59,130,246,0.15)' : 'rgba(13,17,23,0.82)',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              Wall Assignment
              <span
                style={{
                  background: 'rgba(59,130,246,0.25)',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 9,
                  color: '#93c5fd',
                }}
              >
                {wallType === 'u-shape' ? 'A / B / C' : 'A / B'}
              </span>
            </button>
          </div>

          {/* Panel */}
          {showWallPanel && (
            <div
              style={{
                ...glass,
                padding: '10px 12px',
                maxHeight: 190,
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Assign modules to walls
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {availableWalls.map((w) => {
                    const info = WALL_LABELS[w];
                    return (
                      <div
                        key={w}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 9,
                          color: info.color,
                          fontWeight: 700,
                        }}
                      >
                        <div
                          style={{ width: 6, height: 6, borderRadius: 2, background: info.color }}
                        />
                        {w} = {info.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Module rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {modules.map((mod, idx) => {
                  const currentWall = mod.wall || 'A';
                  const info = WALL_LABELS[currentWall];
                  return (
                    <div
                      key={mod.wallKey || `${mod.id}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        gap: 8,
                      }}
                    >
                      {/* Module identity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <div
                          style={{
                            width: 6,
                            height: 20,
                            borderRadius: 3,
                            background: info.color,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#e2e8f0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 110,
                            }}
                          >
                            {mod.id}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: 'rgba(255,255,255,0.35)',
                              fontWeight: 500,
                            }}
                          >
                            {mod.width}mm · {info.label} wall
                          </div>
                        </div>
                      </div>

                      {/* Wall pills */}
                      <WallPill
                        wallKey={mod.wallKey}
                        currentWall={currentWall}
                        availableWalls={availableWalls}
                        onAssign={actions.setModuleWall}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
            gap: 12,
            color: '#334155',
            textAlign: 'center',
            padding: 40,
            pointerEvents: 'none',
            zIndex: 6,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#334155"
            strokeWidth={1}
            strokeLinecap="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              No modules added yet
            </div>
            <div style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>
              Go to Step 2 to add modules
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewer3D;
