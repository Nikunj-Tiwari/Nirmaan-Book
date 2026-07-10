import React, { useState, useRef } from 'react';
import { Link, Upload, Image as ImageIcon, X, CheckCircle } from 'lucide-react';

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
 * Upload tab pushes directly to ImageKit CDN — no Firebase Storage, no Blaze plan needed.
 *
 * Prerequisites (.env):
 *   VITE_IMAGEKIT_PUBLIC_KEY   – starts with "public_"
 *   VITE_IMAGEKIT_URL_ENDPOINT – e.g. "https://ik.imagekit.io/nirmaanbook"
 *
 * Note: ImageKit requires signed uploads unless your account allows unsigned.
 * Enable unsigned uploads in ImageKit Dashboard → Settings → Upload API Settings.
 *
 * Props:
 *   value    – current imageUrl string (or '')
 *   onChange – called with new hosted URL on success
 */
const ImageUploadField = ({ value, onChange }) => {
  const [mode, setMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef(null);

  const handleUrlChange = (e) => onChange(e.target.value);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;

    if (!publicKey) {
      setUploadError(
        'VITE_IMAGEKIT_PUBLIC_KEY is not set in .env. Add it and restart the dev server.'
      );
      return;
    }

    setUploadError('');
    setUploadDone(false);
    setUploading(true);
    setProgress(10);

    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('publicKey', publicKey);
      formData.append('folder', '/catalog-images');

      const hostedUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.min(Math.round((evt.loaded / evt.total) * 88) + 10, 98));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText).url);
            } catch {
              reject(new Error('Unexpected response from ImageKit'));
            }
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try {
              const err = JSON.parse(xhr.responseText);
              if (err.message) msg = err.message;
            } catch {} // eslint-disable-line no-empty
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error — check your internet connection'));
        xhr.send(formData);
      });

      setProgress(100);
      setUploadDone(true);
      onChange(hostedUrl);
    } catch (err) {
      console.error('[ImageUploadField] ImageKit upload failed:', err);
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tabBtn = (id, label, Icon) => (
    <button
      type="button"
      onClick={() => {
        setMode(id);
        setUploadError('');
        setUploadDone(false);
        setProgress(0);
      }}
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
          /* ── Paste URL tab ── */
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
          /* ── Upload via ImageKit tab ── */
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
                border: `1.5px dashed ${uploadDone ? '#16a34a' : 'var(--border)'}`,
                background: uploadDone ? '#f0fdf4' : 'var(--bg-secondary)',
                color: uploadDone ? '#16a34a' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                opacity: uploading ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {uploadDone ? (
                <>
                  <CheckCircle size={14} /> Uploaded to ImageKit ✓
                </>
              ) : uploading ? (
                <>
                  <ImageIcon size={14} /> Uploading… {progress}%
                </>
              ) : (
                <>
                  <ImageIcon size={14} /> Choose image file
                </>
              )}
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Progress bar */}
            {(uploading || uploadDone) && (
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
                    background: uploadDone ? '#16a34a' : 'var(--accent)',
                    width: `${progress}%`,
                    transition: 'width 0.2s',
                  }}
                />
              </div>
            )}

            {uploadError && (
              <span style={{ fontSize: 11, color: '#ef4444', lineHeight: 1.4 }}>
                ⚠ {uploadError}
              </span>
            )}

            <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Powered by ImageKit (free CDN). Max 25 MB. JPEG, PNG, WebP, AVIF supported.
            </span>
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
