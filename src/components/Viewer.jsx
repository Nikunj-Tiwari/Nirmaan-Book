import React from 'react';
import { useConfig } from '../store/ConfigContext';
import Viewer3D from './Viewer3D';

export const Viewer = () => {
  const { config, derived } = useConfig();
  const { modulesList } = derived;
  const { colour, width, height, depth } = config;

  return (
    <div
      className="viewer-outer-container"
      style={{
        flex: 1,
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 500,
        width: '100%',
        height: '100%',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Viewer3D
        modules={modulesList}
        material={colour} // Current app uses 'colour' for the visual finish
        roomWidth={width}
        roomHeight={height}
        roomDepth={depth}
      />
    </div>
  );
};

export default Viewer;
