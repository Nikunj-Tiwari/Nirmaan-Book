import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import RoomEnvironment from './three/RoomEnvironment';
import WardrobeAssembly from './three/WardrobeAssembly';
import { COLOURS } from '../data/config';
import { useConfig } from '../store/ConfigContext';

const mmToMeters = (value) => value / 1000;

function CameraRig({ roomWidth, roomHeight, roomDepth, modules, viewPreset }) {
  const { camera, controls } = useThree();

  // Calculate auto-fit parameters
  const fitParams = useMemo(() => {
    const totalW = modules.reduce((sum, mod) => sum + mod.width, 0);
    const w = mmToMeters(totalW || roomWidth);
    const h = mmToMeters(roomHeight);
    const d = mmToMeters(roomDepth);

    return {
      center: [0, h / 2, 0],
      defaultPos: [Math.max(w * 0.8, 2), h * 0.6, Math.max(d * 2.5, 3)],
      frontPos: [0, h / 2, Math.max(d * 3, 3.5)],
      sidePos: [Math.max(w * 2, 3), h / 2, 0],
      topPos: [0, Math.max(h * 3, 4), 0.01], // Slight offset to avoid gimbal lock
    };
  }, [roomWidth, roomHeight, roomDepth, modules]);

  // Handle View Preset changes
  useEffect(() => {
    if (!camera || !fitParams) return;

    let targetPos;
    switch (viewPreset) {
      case 'front':
        targetPos = fitParams.frontPos;
        break;
      case 'side':
        targetPos = fitParams.sidePos;
        break;
      case 'top':
        targetPos = fitParams.topPos;
        break;
      default:
        targetPos = fitParams.defaultPos;
    }

    // Smooth transition could be added here, but direct set is more reliable without extra libs
    camera.position.set(...targetPos);
    if (controls) {
      controls.target.set(...fitParams.center);
      controls.update();
    }
  }, [viewPreset, camera, controls, fitParams]);

  return null;
}

export function Viewer3D({
  modules = [],
  material,
  roomWidth,
  roomHeight = 2400,
  roomDepth = 600,
}) {
  const { actions } = useConfig();
  const [viewPreset, setViewPreset] = useState('perspective');
  const [hoveredModule, setHoveredModule] = useState(null);

  if (!modules) return null;

  const handleColorSelect = (swatch) => {
    actions.setFinish('colour', swatch);
  };

  return (
    <div
      className="viewer-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 450,
        position: 'relative',
        background: '#f8fafc',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [2, 1.5, 3], fov: 42 }}
        gl={{
          alpha: true,
          antialias: true,
          stencil: false,
          depth: true,
          preserveDrawingBuffer: true,
        }}
      >
        <CameraRig
          roomWidth={roomWidth}
          roomHeight={roomHeight}
          roomDepth={roomDepth}
          modules={modules}
          viewPreset={viewPreset}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxDistance={10}
          minDistance={0.5}
          maxPolarAngle={Math.PI / 2.1}
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
          <ContactShadows position={[0, 0.01, 0]} opacity={0.3} scale={15} blur={2.5} far={4} />
        </Suspense>
      </Canvas>

      {/* --- HUD OVERLAYS --- */}

      {/* Top Left: Info */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          borderRadius: 14,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 4,
          }}
        >
          Live Interactive 3D
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          {modules.length} {modules.length === 1 ? 'Module' : 'Modules'} Configured
        </div>
        {hoveredModule && (
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
            Hovering: {hoveredModule.name}
          </div>
        )}
      </div>

      {/* Top Right: View Controls */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            padding: 6,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {['perspective', 'front', 'side', 'top'].map((preset) => (
            <button
              key={preset}
              onClick={() => setViewPreset(preset)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: viewPreset === preset ? '#3b82f6' : 'transparent',
                color: viewPreset === preset ? 'white' : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Right: Color Selector Swatches */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px',
          borderRadius: 16,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          zIndex: 10,
          maxWidth: 320,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Quick Finish Swatches
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {COLOURS.map((swatch) => (
            <button
              key={swatch.name}
              onClick={() => handleColorSelect(swatch)}
              title={swatch.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: swatch.hex,
                border: material?.name === swatch.name ? '3px solid #3b82f6' : '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
            />
          ))}
        </div>
      </div>

      {/* Empty State Logic */}
      {modules.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(248, 250, 252, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 5,
            color: '#64748b',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'center',
            padding: 40,
          }}
        >
          <div>
            <div style={{ fontSize: 24, marginBottom: 12 }}>📐</div>
            Add modules in Step 1 to begin visualization
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewer3D;
