import React from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';

const mmToMeters = (value) => value / 1000;

function Panel({ color, roughness, position, size }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness || 0.72} metalness={0.02} />
      <Edges color="#22261f" threshold={18} />
    </mesh>
  );
}

function Handle({ position, length }) {
  return (
    <mesh castShadow position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.012, 0.012, length, 20]} />
      <meshStandardMaterial color="#c8c0b4" roughness={0.26} metalness={0.85} />
    </mesh>
  );
}

function Rail({ position, length }) {
  return (
    <mesh castShadow position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.018, 0.018, length, 24]} />
      <meshStandardMaterial color="#bdb8ae" roughness={0.22} metalness={0.9} />
    </mesh>
  );
}

export function ModuleMesh({ module, material, position, onHover }) {
  const [hovered, setHovered] = React.useState(false);

  const width = mmToMeters(module.width);
  const height = mmToMeters(module.height);
  const depth = mmToMeters(module.depth);
  const panelThickness = 0.018;
  const innerWidth = Math.max(width - panelThickness * 2, width * 0.92);
  const innerDepth = Math.max(depth - panelThickness * 2, depth * 0.92);

  // Use material hex or default
  const color = material?.hex || '#F0EDE8';
  const roughness = material?.roughness || 0.72;
  const moduleType = module.type ? module.type.toLowerCase() : '';

  // Calculate highlight color: slightly lighter if hovered
  const highlightColor = hovered
    ? new THREE.Color(color).clone().multiplyScalar(1.15).getHexString()
    : color;

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover && onHover(module);
      }}
      onPointerOut={(e) => {
        setHovered(false);
        onHover && onHover(null);
      }}
    >
      {/* Side Panels */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[-width / 2 + panelThickness / 2, height / 2, 0]}
        size={[panelThickness, height, depth]}
      />
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[width / 2 - panelThickness / 2, height / 2, 0]}
        size={[panelThickness, height, depth]}
      />

      {/* Bottom Panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, panelThickness / 2, 0]}
        size={[width, panelThickness, depth]}
      />

      {/* Top Panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, height - panelThickness / 2, 0]}
        size={[width, panelThickness, depth]}
      />

      {/* Back Panel */}
      <Panel
        color={highlightColor}
        roughness={roughness}
        position={[0, height / 2, -depth / 2 + panelThickness / 2]}
        size={[innerWidth, height - panelThickness * 2, panelThickness]}
      />

      {/* Internal Logic based on Type */}
      {(moduleType.includes('shelf') ||
        moduleType.includes('hanging') ||
        moduleType.includes('specialty')) && (
        <Panel
          color={highlightColor}
          roughness={roughness}
          position={[0, height * 0.78, 0]}
          size={[innerWidth, panelThickness, innerDepth]}
        />
      )}

      {(moduleType.includes('shelf') || moduleType.includes('shoe')) &&
        [0.22, 0.39, 0.56].map((ratio) => (
          <Panel
            key={ratio}
            color={highlightColor}
            roughness={roughness}
            position={[0, height * ratio, 0]}
            size={[innerWidth, panelThickness, innerDepth]}
          />
        ))}

      {(moduleType.includes('drawer') || (module.layout && module.layout.drawers > 0)) &&
        [0.17, 0.3, 0.43, 0.56].map((ratio, idx) => {
          // Limit to actual number of drawers if specified in layout
          if (module.layout && module.layout.drawers && idx >= module.layout.drawers) return null;
          return (
            <group key={ratio}>
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[0, height * ratio, depth / 2 + 0.014]}
                size={[innerWidth, 0.17, 0.032]}
              />
              <Handle
                position={[0, height * ratio, depth / 2 + 0.042]}
                length={Math.min(width * 0.46, 0.36)}
              />
            </group>
          );
        })}

      {(moduleType.includes('hanging') || (module.layout && module.layout.hang > 0)) && (
        <>
          <Rail position={[0, height * 0.62, 0.05]} length={innerWidth * 0.86} />
          {/* Half Height Doors for Hanging Modules */}
          {[-0.24, 0.24].map((doorOffset) => (
            <group key={doorOffset}>
              <Panel
                color={highlightColor}
                roughness={roughness}
                position={[width * doorOffset, height * 0.42, depth / 2 + 0.012]}
                size={[innerWidth * 0.48, height * 0.7, 0.03]}
              />
              <Handle
                position={[width * doorOffset * 0.42, height * 0.45, depth / 2 + 0.04]}
                length={Math.min(height * 0.16, 0.36)}
              />
            </group>
          ))}
        </>
      )}
    </group>
  );
}

export default ModuleMesh;
