import React, { useMemo } from 'react';
import ModuleMesh from './ModuleMesh';

const mm = (v) => v / 1000;

/**
 * WardrobeAssembly — Room-oriented placement
 *
 * Modules read posX / posZ from overrides (set by inspector sliders)
 * to apply a free offset along their wall surface.
 *
 * Wall A: posX shifts the module left/right along the back wall
 * Wall B: posZ shifts the module forward/backward along the left side wall
 * Wall C: posZ shifts the module forward/backward along the right side wall
 */
export function WardrobeAssembly({
  modules,
  material,
  handle,
  fascia,
  lighting,
  selectedAccessories,
  roomDimensions,
  onModuleHover,
  onModuleClick,
}) {
  const {
    width = 2400,
    height = 2400,
    depth = 600,
    wallType = 'single',
    width2 = 0,
    width3 = 0,
  } = roomDimensions;

  const depthM = mm(depth);
  const widthAM = mm(width);

  const { wallA, wallB, wallC } = useMemo(() => {
    if (!modules || modules.length === 0) return { wallA: [], wallB: [], wallC: [] };

    const modsA = modules.filter((m) => !m.wall || m.wall === 'A');
    const modsB = wallType !== 'single' ? modules.filter((m) => m.wall === 'B') : [];
    const modsC = wallType === 'u-shape' ? modules.filter((m) => m.wall === 'C') : [];

    // Wall A: default centered layout; posX override shifts horizontally
    const layoutA = (mods) => {
      const totalW = mods.reduce((s, m) => s + (m.width || 600), 0);
      let cursor = -mm(totalW) / 2;
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const baseX = cursor + mmWidth / 2;
        cursor += mmWidth;
        const x = baseX + (mod.posX || 0);
        return {
          module: mod,
          pos: [x, 0, depthM / 2],
          key: mod.wallKey || `A-${mod.id}-${i}`,
        };
      });
    };

    // Wall B/C: default stacked from corner; posZ override shifts along wall
    const layoutPerp = (mods, prefix) => {
      let cursor = 0;
      return mods.map((mod, i) => {
        const mmWidth = mm(mod.width || 600);
        const baseZ = cursor + mmWidth / 2;
        cursor += mmWidth;
        const z = baseZ + (mod.posZ || 0);
        return {
          module: mod,
          baseZ: z,
          key: mod.wallKey || `${prefix}-${mod.id}-${i}`,
        };
      });
    };

    return {
      wallA: layoutA(modsA),
      wallB: layoutPerp(modsB, 'B'),
      wallC: layoutPerp(modsC, 'C'),
    };
  }, [modules, wallType, depthM]);

  // Compute actual bounding box of modules on Wall A for flush pelmet & LED strip placement
  const { maxModuleHA, spanWA, centerXA } = useMemo(() => {
    if (!wallA || wallA.length === 0) {
      return { maxModuleHA: mm(height), spanWA: widthAM, centerXA: 0 };
    }
    const maxH = Math.max(...wallA.map((w) => mm(w.module.height || 2100)));
    const minX = Math.min(...wallA.map((w) => w.pos[0] - mm(w.module.width || 600) / 2));
    const maxX = Math.max(...wallA.map((w) => w.pos[0] + mm(w.module.width || 600) / 2));
    const span = Math.max(maxX - minX, 0.6);
    const cx = (minX + maxX) / 2;
    return { maxModuleHA: maxH, spanWA: span, centerXA: cx };
  }, [wallA, height, widthAM]);

  return (
    <group>
      {/* ── Wall A — Main back wall ───────────────────────────────────── */}
      {wallA.map(({ module, pos, key }) => (
        <ModuleMesh
          key={key}
          material={material}
          module={module}
          position={pos}
          rotationY={(module.rotation || 0) * (Math.PI / 180)}
          handle={handle}
          fascia={fascia}
          selectedAccessories={selectedAccessories}
          onHover={onModuleHover}
          onClick={onModuleClick}
        />
      ))}

      {/* ── Wall B — Left side wall ───────────────────────────────────── */}
      {wallB.map(({ module, baseZ, key }) => (
        <ModuleMesh
          key={key}
          material={material}
          module={module}
          position={[-(widthAM / 2) + depthM / 2, 0, baseZ]}
          rotationY={Math.PI / 2 + (module.rotation || 0) * (Math.PI / 180)}
          handle={handle}
          fascia={fascia}
          selectedAccessories={selectedAccessories}
          onHover={onModuleHover}
          onClick={onModuleClick}
        />
      ))}

      {/* ── Wall C — Right side wall ──────────────────────────────────── */}
      {wallC.map(({ module, baseZ, key }) => (
        <ModuleMesh
          key={key}
          material={material}
          module={module}
          position={[widthAM / 2 - depthM / 2, 0, baseZ]}
          rotationY={-Math.PI / 2 + (module.rotation || 0) * (Math.PI / 180)}
          handle={handle}
          fascia={fascia}
          selectedAccessories={selectedAccessories}
          onHover={onModuleHover}
          onClick={onModuleClick}
        />
      ))}

      {/* ── Top Fascia Pelmet Board — Flush atop Wall A wardrobe ────── */}
      {wallA.length > 0 && fascia && (
        <group position={[centerXA, maxModuleHA + 0.04, depthM / 2 + 0.01]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[spanWA, 0.08, 0.024]} />
            <meshStandardMaterial
              color={material?.hex || '#5C3822'}
              roughness={fascia === 'J-Pull' ? 0.9 : 0.6}
            />
          </mesh>
          {(fascia === 'Inline' || fascia === 'Sofia' || fascia === 'Carmen') && (
            <mesh position={[0, 0.035, 0.01]}>
              <boxGeometry args={[spanWA + 0.02, 0.02, 0.04]} />
              <meshStandardMaterial color={material?.hex || '#5C3822'} roughness={0.5} />
            </mesh>
          )}
          {fascia === 'J-Pull' && (
            <mesh position={[0, -0.035, 0.005]}>
              <boxGeometry args={[spanWA, 0.008, 0.015]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
          )}
        </group>
      )}

      {/* ── Realistic LED Strip Light — Aluminum profile + opal diffuser + downlight ── */}
      {lighting &&
        (lighting.name?.toLowerCase().includes('led') || lighting.id === 'led-strip') && (
          <group position={[centerXA, maxModuleHA - 0.005, depthM / 2 + 0.025]}>
            {/* Black anodized aluminum extrusion casing */}
            <mesh castShadow position={[0, 0.008, 0]}>
              <boxGeometry args={[spanWA * 0.98, 0.016, 0.018]} />
              <meshStandardMaterial color="#262626" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Opal frosted diffuser lens with rich warm white/amber glow */}
            <mesh position={[0, 0.003, 0.006]}>
              <boxGeometry args={[spanWA * 0.96, 0.008, 0.01]} />
              <meshStandardMaterial
                color="#FFF5E0"
                emissive="#FFB852"
                emissiveIntensity={4.2}
                roughness={0.1}
              />
            </mesh>
            {/* Continuous illuminated light line */}
            <mesh position={[0, -0.002, 0.006]}>
              <boxGeometry args={[spanWA * 0.94, 0.003, 0.006]} />
              <meshBasicMaterial color="#FFE099" />
            </mesh>
            {/* Warm downlight cast across wardrobe front */}
            {[-spanWA * 0.35, 0, spanWA * 0.35].map((lx, idx) => (
              <pointLight
                key={`led-pl-${idx}`}
                color="#FFE1A8"
                intensity={2.6}
                distance={2.8}
                decay={2}
                position={[lx, -0.08, 0.1]}
              />
            ))}
          </group>
        )}

      {/* ── Spotlights ─────────────────────────────────────────────── */}
      {lighting &&
        (lighting.name?.toLowerCase().includes('spot') || lighting.id === 'spotlights') && (
          <group position={[centerXA, maxModuleHA + 0.04, depthM / 2 + 0.05]}>
            {[-spanWA * 0.3, 0, spanWA * 0.3].map((sx, idx) => (
              <group key={`spot-${idx}`} position={[sx, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
                  <meshStandardMaterial color="#2b2b2b" metalness={0.8} />
                </mesh>
                <mesh position={[0, -0.006, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.002, 16]} />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    emissive="#FFFFFF"
                    emissiveIntensity={4.0}
                  />
                </mesh>
                <pointLight
                  color="#FFF8EE"
                  intensity={2.0}
                  distance={4.0}
                  position={[0, -0.05, 0]}
                />
              </group>
            ))}
          </group>
        )}
    </group>
  );
}

export default WardrobeAssembly;
