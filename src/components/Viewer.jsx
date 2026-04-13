import React from 'react';
import { useConfig } from '../store/ConfigContext';
import { Zap } from 'lucide-react';

export const Viewer = () => {
  const { config, derived } = useConfig();
  const { material } = config;
  const { totalModules } = derived;

  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff',
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 450,
      }}
    >
      {/* Subtle background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(#f1f3f5 1px, transparent 1px),
            linear-gradient(90deg, #f1f3f5 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          textAlign: 'center',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            background: '#eff6ff',
            border: '2px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
          }}
        >
          <Zap size={32} />
        </div>

        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: 6,
            }}
          >
            3D Preview Coming Soon
          </h3>
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              maxWidth: 280,
            }}
          >
            Real-time 3D visualization of your wardrobe configuration coming in the next update.
          </p>
        </div>

        {totalModules > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 16px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 12,
              color: '#6b7280',
              fontWeight: 500,
            }}
          >
            {totalModules} module{totalModules !== 1 ? 's' : ''} • {material?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default Viewer;
