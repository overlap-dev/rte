import React, { useState, useRef } from 'react';
import { Plugin, EditorAPI, ButtonProps } from '../types';
import { IconWrapper } from '../components/IconWrapper';

/**
 * Extracts the display URL from the raw onImageUpload return value.
 * Strips the "|__aid__:attachmentId" suffix if present.
 */
function getDisplayUrl(raw: string): string {
  if (raw.includes('|__aid__:')) {
    return raw.substring(0, raw.indexOf('|__aid__:'));
  }
  return raw;
}

/**
 * Image-Plugin mit URL-Eingabe und File-Upload
 */
export function createImagePlugin(onImageUpload?: (file: File) => Promise<string>): Plugin {
  return {
    name: 'image',
    type: 'block',
    renderButton: (props: ButtonProps & { editorAPI?: EditorAPI }) => {
      const [showModal, setShowModal] = useState(false);
      // rawUrl stores the full value returned by onImageUpload (may contain |__aid__:)
      const [rawUrl, setRawUrl] = useState('');
      const [imageUrl, setImageUrl] = useState('');
      const [altText, setAltText] = useState('');
      const [isUploading, setIsUploading] = useState(false);
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handleInsertImage = () => {
        if (!props.editorAPI) return;
        
        // Use the raw URL (with |__aid__: if present) — createImageElement will parse it
        const src = (rawUrl || imageUrl).trim();
        
        if (!src) {
          alert('Bitte geben Sie eine Bild-URL ein');
          return;
        }

        props.editorAPI.executeCommand('insertImage', src);

        // Modal schließen
        setShowModal(false);
        setRawUrl('');
        setImageUrl('');
        setAltText('');
      };

      const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onImageUpload) return;

        if (!file.type.startsWith('image/')) {
          alert('Bitte wählen Sie eine Bilddatei aus');
          return;
        }

        setIsUploading(true);

        try {
          const uploadedUrl = await onImageUpload(file);
          // Store the raw return value (may contain |__aid__:attachmentId)
          setRawUrl(uploadedUrl);
          // Display URL strips the metadata suffix
          setImageUrl(getDisplayUrl(uploadedUrl));
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Fehler beim Hochladen des Bildes');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      return (
        <>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={props.disabled}
            className="rte-toolbar-button"
            title="Bild einfügen"
            aria-label="Bild einfügen"
          >
            <IconWrapper icon="mdi:image" width={18} height={18} />
          </button>

          {showModal && (
            <div
              className="rte-image-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowModal(false);
                }
              }}
            >
              <div className="rte-image-modal">
                <div className="rte-image-modal-header">
                  <h3>Bild einfügen</h3>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rte-image-modal-close"
                    aria-label="Schließen"
                  >
                    <IconWrapper icon="mdi:close" width={20} height={20} />
                  </button>
                </div>

                <div className="rte-image-modal-content">
                  {onImageUpload && (
                    <div className="rte-image-upload-section">
                      <label className="rte-image-upload-label">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                        <div className="rte-image-upload-button">
                          {isUploading ? (
                            <>
                              <IconWrapper icon="mdi:loading" width={24} height={24} className="rte-spin" />
                              <span>Wird hochgeladen...</span>
                            </>
                          ) : (
                            <>
                              <IconWrapper icon="mdi:upload" width={24} height={24} />
                              <span>Datei auswählen</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="rte-image-url-section">
                    <label>
                      Bild-URL
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          // Clear raw URL when user manually edits
                          setRawUrl('');
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="rte-image-url-input"
                      />
                    </label>
                  </div>

                  <div className="rte-image-alt-section">
                    <label>
                      Alt-Text (optional)
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Bildbeschreibung"
                        className="rte-image-alt-input"
                      />
                    </label>
                  </div>

                  {imageUrl && (
                    <div className="rte-image-preview">
                      <img src={imageUrl} alt={altText || 'Preview'} />
                    </div>
                  )}
                </div>

                <div className="rte-image-modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rte-image-modal-cancel"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertImage}
                    disabled={!imageUrl.trim() || isUploading}
                    className="rte-image-modal-insert"
                  >
                    Einfügen
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    },
    execute: (editor: EditorAPI) => {
      // Wird über renderButton gehandhabt
    },
    canExecute: () => true,
  };
}

