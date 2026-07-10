import React, { useState, useRef } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Link, Upload, Image as ImageIcon, X } from 'lucide-react';

const inp = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

/**
 * ImageUploadField
 * Two-tab image input: "Paste URL" | "Upload Image"
 *
 * Props:
 *   value    – current imageUrl string (or '')
 *   onChange – called with new URL string when URL or upload completes
 */
const ImageUploadField = ({ value, onChange }) => {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const handleUrlChange = (e) => onChange(e.target.value);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    setUploadError('');
    setUploading(true);
    setProgress(0);

    const storage = getStorage();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, `catalog-images/${fileName}`);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error('[ImageUploadField] Upload failed:', err);
        setUploadError('Upload failed — ' + err.message);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(100);
      }
    );
  };

  const tabBtn = (id, label, Icon) => (
    <button
      type="button"
      onClick={() => setMode(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        borderRadius: '6px 6px 0 0',
        border: '1.5px solid var(--border)',
        borderBottom: mode === id ? '1.5px solid var(--bg-primary)' : '1.5px solid var(--border)',
        background: mode === id ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
        color: mode === id ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        marginBottom: '-1px',
        position: 'relative',
        zIndex: mode === id ? 1 : 0,
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border)' }}>
        {tabBtn('url', 'Paste URL', Link)}
        {tabBtn('upload', 'Upload Image', Upload)}
      </div>

      {/* Panel */}
      <div
        style={{
          padding: '10px 12px',
          border: '1.5px solid var(--border)',
          borderRadius: '0 6px 6px 6px',
          background: 'var(--bg-primary)',
        }}
      >
        {mode === 'url' ? (
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value || ''}
            onChange={handleUrlChange}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            style={inp}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '10px',
                borderRadius: 8,
                border: '1.5px dashed var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                opacity: uploading ? 0.7 : 1,
              }}
            >
              <ImageIcon size={14} />
              {uploading ? `Uploading… ${progress}%` : 'Choose image file'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {uploading && (
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    background: 'var(--accent)',
                    width: `${progress}%`,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}
            {uploadError && <span style={{ fontSize: 11, color: '#ef4444' }}>{uploadError}</span>}
          </div>
        )}
      </div>

      {/* Live preview */}
      {value && (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={value}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: 140,
              objectFit: 'contain',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove image"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
