import React from 'react';
import { useConfig } from '../store/ConfigContext';

const StepProject = () => {
  const { config, actions } = useConfig();
  const { projectInfo } = config;

  const handleChange = (key, value) => {
    actions.setProjectInfo(key, value);
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: '1.5px solid var(--border)',
    background: 'var(--bg-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 8,
  };

  return (
    <div
      className="step-project animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        padding: '24px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--bg-secondary)',
          borderRadius: 16,
          padding: '40px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Project Information
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Let's start by recording the basic details of this wardrobe project.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={labelStyle} htmlFor="proj-name">
              Project Name
            </label>
            <input
              id="proj-name"
              type="text"
              placeholder="e.g. Kapoor Residence Master Bed"
              value={projectInfo.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="proj-type">
              Project Type
            </label>
            <select
              id="proj-type"
              value={projectInfo.type || 'Consultation'}
              onChange={(e) => handleChange('type', e.target.value)}
              style={{ ...inputStyle, appearance: 'auto' }}
            >
              <option value="Consultation">Consultation</option>
              <option value="Design & Build">Design & Build</option>
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="proj-city">
              City
            </label>
            <input
              id="proj-city"
              type="text"
              placeholder="e.g. Mumbai"
              value={projectInfo.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="proj-date">
              Start Date
            </label>
            <input
              id="proj-date"
              type="date"
              value={projectInfo.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepProject;
