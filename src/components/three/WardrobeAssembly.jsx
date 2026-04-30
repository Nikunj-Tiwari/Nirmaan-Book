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
          onHover={onModuleHover}
          onClick={onModuleClick}
        />
      ))}
    </group>
  );
}

export default WardrobeAssembly;
