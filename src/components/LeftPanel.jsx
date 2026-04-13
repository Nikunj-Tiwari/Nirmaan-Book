import { modules } from '../data/modules';
import { materials } from '../data/materials';
import { validateWidth, calculateUsedWidth } from '../utils/rules';

export const LeftPanel = ({ state, setState, addModule }) => {
  const { usedWidth, remaining, isValid } = validateWidth(state.roomWidth, state.modules);

  const handleMaterialChange = (materialId) => {
    const selected = materials.find((m) => m.id === materialId);
    setState((prev) => ({ ...prev, material: selected }));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Width Dashboard */}
      <div className="flex flex-col gap-2">
        <h2 className="text-[var(--text-secondary)] uppercase text-[10px] font-bold tracking-widest">
          Dimensions
        </h2>
        <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border)] flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-xs text-[var(--text-secondary)]">Used Width:</span>
            <span className="text-xl font-mono text-[var(--accent)]">
              {calculateUsedWidth(state.modules)}
              <small className="text-[10px] ml-1">mm</small>
            </span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs text-[var(--text-secondary)]">Remaining:</span>
            <span
              className={`text-xl font-mono ${remaining < 600 ? 'text-[var(--danger)]' : 'text-emerald-400'}`}
            >
              {remaining}
              <small className="text-[10px] ml-1">mm</small>
            </span>
          </div>

          {/* Visual Bar */}
          <div className="h-1.5 bg-[var(--bg-primary)] rounded-full mt-2 overflow-hidden border border-[var(--border)]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${remaining < 300 ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`}
              style={{ width: `${(calculateUsedWidth(state.modules) / state.roomWidth) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Material Selection */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white/90">Surface Material</h3>
        <select
          value={state.material?.id || ''}
          onChange={(e) => handleMaterialChange(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all cursor-pointer text-white"
        >
          {materials.map((mat) => (
            <option key={mat.id} value={mat.id}>
              {mat.name} ({mat.multiplier}x price)
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-2">
          <div
            className="w-4 h-4 rounded-full border border-white/10 shadow-lg"
            style={{ backgroundColor: state.material?.color }}
          />
          <span className="text-[10px] text-white/40 uppercase font-mono tracking-tight">
            Active Style: {state.material?.color}
          </span>
        </div>
      </div>

      {/* Module Addition Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[var(--test-primary)]">Add Wardrobe Modules</h3>
        <div className="grid grid-cols-1 gap-3">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => addModule(mod)}
              className="flex flex-col gap-1 p-3 text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent)]/50 rounded-lg transition-all group"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium group-hover:text-[var(--accent)] text-[var(--text-primary)]">
                  {mod.name}
                </span>
                <span className="text-[10px] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">
                  {mod.width}mm
                </span>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                ₹ {mod.basePrice.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Shared logic imported from utils/rules
