import React from 'react';
import { HANDLES, LIGHTING, ACCESSORIES } from '../data/config';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';
import { Check } from 'lucide-react';

const StepHardware = () => {
  const { config, actions } = useConfig();
  const { addToast } = useToast();
  const { handle, lighting, selectedAccessories } = config;

  const optionCard = (item, isSelected, onClick) => (
    <button
      key={item.name}
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: 10,
        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        transition: 'all 0.15s',
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        {item.icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
            marginTop: 2,
          }}
        >
          {item.sub}
        </div>
      </div>
    </button>
  );

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}
      className="animate-fade-in"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Hardware & Lighting
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Choose handles and lighting for your wardrobe
          </p>
        </div>

        {/* Handles */}
        <div>
          <div className="section-title">Handles</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {HANDLES.map((h) =>
              optionCard(h, handle.name === h.name, () => {
                actions.setFinish('handle', h);
                addToast(`Handle changed to ${h.name}`, 'success');
              })
            )}
          </div>
        </div>

        {/* Lighting */}
        <div>
          <div className="section-title">Lighting</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {LIGHTING.map((l) =>
              optionCard(l, lighting.name === l.name, () => {
                actions.setFinish('lighting', l);
                addToast(`Lighting changed to ${l.name}`, 'success');
              })
            )}
          </div>
        </div>
      </div>

      {/* Accessories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Accessories
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Add internal accessories to your wardrobe
          </p>
        </div>

        <div>
          <div className="section-title">Internal Add-ons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACCESSORIES.map((acc) => {
              const isSelected = selectedAccessories.has(acc.id);
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    actions.toggleAccessory(acc.id);
                    const isSelected = selectedAccessories.has(acc.id);
                    addToast(isSelected ? `${acc.name} removed` : `${acc.name} added`, 'success');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    {acc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      }}
                    >
                      {acc.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                        marginTop: 2,
                      }}
                    >
                      {acc.desc}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      flexShrink: 0,
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepHardware;
