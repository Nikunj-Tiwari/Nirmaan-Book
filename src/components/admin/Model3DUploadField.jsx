import React, { useState, useRef } from 'react';
import { Box, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getImageKitAuthParams } from '../../utils/imagekitAuth';

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
 * Model3DUploadField
 * Allows uploading custom 3D model files (.glb, .gltf, .obj) or pasting a direct URL.
 * Uploads directly to ImageKit under `/models3d/` folder.
 */
const Model3DUploadField = ({ value, onChange }) => {
  const [mode, setMode] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadDone, setUploadDone] = useState(false);
  const fileRef = useRef(null);

  const handleUrlChange = (e) => onChange(e.target.value);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['glb', 'gltf', 'obj'].includes(ext)) {
      setUploadError('Please select a 3D model file (.glb, .gltf, or .obj).');
      return;
    }

    const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
    if (!publicKey) {
      setUploadError('VITE_IMAGEKIT_PUBLIC_KEY is not configured in .env.');
      return;
    }

    setUploadError('');
    setUploadDone(false);
    setUploading(true);
    setProgress(10);

    try {
      const authParams = await getImageKitAuthParams();

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('publicKey', publicKey);
      formData.append('folder', '/models3d');
      formData.append('signature', authParams.signature);
      formData.append('token', authParams.token);
      formData.append('expire', authParams.expire.toString());

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
            } catch {
              // ignore json parse error
            }
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error('Network error — check your connection'));
        xhr.send(formData);
      });

      setProgress(100);
      setUploadDone(true);
      onChange(hostedUrl);
    } catch (err) {
      console.error('[Model3DUploadField] 3D upload failed:', err);
      setUploadError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tabBtn = (id, label) => (
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
        marginBottom: -1.5,
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1.5px solid var(--border)',
          marginBottom: 10,
        }}
      >
        {tabBtn('upload', 'Upload 3D File (.glb, .gltf)')}
        {tabBtn('url', 'Paste 3D Model URL')}
      </div>

      {mode === 'url' ? (
        <div>
          <input
            style={inp}
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder="https://ik.imagekit.io/.../my-module.glb"
          />
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".glb,.gltf,.obj,model/gltf-binary,model/gltf+json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{
              ...inp,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: 'var(--bg-secondary)',
              border: '1.5px dashed var(--border)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              padding: '12px',
            }}
          >
            <Box size={16} color="var(--accent)" />
            {uploading
              ? `Uploading 3D Model… ${progress}%`
              : value
                ? 'Replace 3D Model (.glb)'
                : 'Choose 3D Model file (.glb recommended)'}
          </button>

          <p
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 6,
              marginBottom: 4,
              lineHeight: 1.4,
            }}
          >
            💡 <strong>Tip:</strong> Please upload a <strong>.glb</strong> file (Binary GLTF). A
            single .glb file packages all geometry, buffers, and textures together so it renders
            immediately in 3D. (.gltf files without their companion .bin file cannot load).
          </p>

          {uploadError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#dc2626',
                fontSize: 12,
                marginTop: 6,
              }}
            >
              <AlertCircle size={14} />
              {uploadError}
            </div>
          )}

          {value && !uploadError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: 6,
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                marginTop: 8,
                fontSize: 12,
                color: 'var(--accent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <CheckCircle size={14} color="#16a34a" />
                <span
                  style={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: 280,
                  }}
                >
                  3D Model Attached: {value.split('/').pop()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
                title="Remove 3D model"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Model3DUploadField;
