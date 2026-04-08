import React, { useEffect, useRef, useMemo } from 'react';
import { TYPE_COLORS } from '../data/modules';
import { getElevationLayout } from '../utils/visuals';
import { useConfig } from '../store/ConfigContext';

const StepVisualisation = () => {
  const { config, derived } = useConfig();
  const canvasRef = useRef(null);

  const { totalUnits, finishName, modulesList } = useMemo(() => {
    return {
      totalUnits: derived.totalModules,
      finishName: config.colour.name,
      modulesList: derived.modulesList
    };
  }, [config, derived]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, cw, ch);
    
    // Get Visualization Primitives from Engine
    const { primitives, status } = getElevationLayout(config, cw, ch);

    if (status === 'EMPTY') {
      ctx.fillStyle = '#0f1115';
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '13px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select modules in Step 2 to see technical elevation', cw / 2, ch / 2);
      return;
    }

    // Execute Visualization Primitives (Pure View Logic)
    primitives.forEach(p => {
      // Annotation Circle
      if (p.type === 'annotation') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#4f8cff';
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.index, p.x, p.y + 4);

        // Technical ID label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 8px Inter,sans-serif';
        ctx.fillText(p.id, p.x, p.y + 23);
        return;
      }

      ctx.globalAlpha = p.alpha || 1;
      
      if (p.type === 'rect') {
        if (p.fill) {
          ctx.fillStyle = p.fill;
          ctx.fillRect(p.x, p.y, p.w, p.h);
        }
        if (p.stroke) {
          ctx.strokeStyle = p.stroke;
          ctx.lineWidth = p.lineWidth || 1;
          ctx.strokeRect(p.x, p.y, p.w, p.h);
        }
      } else if (p.type === 'line') {
        ctx.strokeStyle = p.stroke;
        ctx.lineWidth = p.lineWidth || 1;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
      } else if (p.type === 'text') {
        ctx.fillStyle = p.fill;
        ctx.font = p.font;
        ctx.textAlign = p.align || 'left';
        ctx.fillText(p.text, p.x, p.y);
      }
    });

  }, [config]);

  return (
    <div className="flex flex-col gap-16 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
        <div>
          <h2 className="section-title">Design Visualisation</h2>
          <h3 className="text-4xl font-black tracking-tighter mt-4 uppercase text-[var(--text-primary)]">Internal Elevation</h3>
          <p className="text-[var(--text-secondary)] font-medium mt-2 text-sm">Drafted schematic view of specified components and architectural finishes.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-[var(--bg-secondary)] p-5 rounded-lg border border-[var(--border-strong)] flex flex-col min-w-[140px]">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-widest mb-1">Configuration</span>
              <span className="text-lg font-black text-[var(--text-primary)]">{totalUnits} UNITS</span>
           </div>
           <div className="bg-[var(--accent)] p-5 rounded-lg border border-[var(--bg-primary)] flex flex-col min-w-[140px]">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Applied Finish</span>
              <span className="text-lg font-black text-white">{finishName.toUpperCase()}</span>
           </div>
        </div>
      </div>

      <div className="aspect-[21/9] bg-[var(--bg-secondary)] border border-[var(--border-strong)] rounded-xl overflow-hidden flex items-center justify-center p-12 shadow-sm">
        <canvas 
          ref={canvasRef} 
          width={1800} 
          height={750}
          className="max-w-full max-h-full object-contain rounded-2xl"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-wrap gap-3">
           {modulesList.map((mod, i) => (
             <div key={i} className="px-4 py-2 bg-[var(--bg-secondary)] rounded-md border border-[var(--border)] flex items-center gap-3 shadow-sm hover:border-[var(--accent)] transition-all cursor-default">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[mod.type] }} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">{mod.id}</span>
             </div>
           ))}
        </div>
        
        <div className="lg:col-span-4">
           <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] p-8 rounded-xl border border-[var(--border-strong)] flex flex-col gap-5 shadow-xl relative overflow-hidden">
              <span className="text-[11px] text-[var(--accent)] font-black uppercase tracking-[2px]">Architectural Specs</span>
              <p className="text-[12px] font-medium text-[var(--text-secondary)] leading-relaxed uppercase tracking-tight">
                This technical schematic represents the internal structural layout. Material thickness and hardware tolerances are strictly maintained according to product standards.
              </p>
              <div className="h-px bg-[var(--border)] w-full"></div>
              <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                 <span>Viewport Scale</span>
                 <span className="text-white">1 : 6 Realistic</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StepVisualisation;
