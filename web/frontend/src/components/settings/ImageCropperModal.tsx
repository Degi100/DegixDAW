// ============================================
// IMAGE CROPPER MODAL - Custom Canvas Implementation
// No external dependencies!
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ImageCropperModalProps {
  imageSrc: string;
  onComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ imageSrc, onComplete, onCancel }: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, size: 200 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageSrc]);

  // Redraw canvas when crop area or scale changes (with RAF for performance)
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      drawCanvas();
    });
    return () => cancelAnimationFrame(rafId);
  }, [cropArea, scale]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (smaller for better performance)
    const maxSize = 400;
    canvas.width = maxSize;
    canvas.height = maxSize;

    // Calculate scaled image dimensions to COVER the canvas
    const imgRatio = img.width / img.height;
    let drawWidth = maxSize * scale;
    let drawHeight = maxSize * scale;

    if (imgRatio > 1) {
      // Landscape: fit height, scale width
      drawHeight = maxSize * scale;
      drawWidth = drawHeight * imgRatio;
    } else {
      // Portrait: fit width, scale height
      drawWidth = maxSize * scale;
      drawHeight = drawWidth / imgRatio;
    }

    // Center image
    const offsetX = (maxSize - drawWidth) / 2;
    const offsetY = (maxSize - drawHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, maxSize, maxSize);

    // Fill background with white (no black borders)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maxSize, maxSize);

    // Draw image
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Draw darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, maxSize, maxSize);

    // Clear crop area (circular)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cropArea.x, cropArea.y, cropArea.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw circle border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cropArea.x, cropArea.y, cropArea.size / 2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if click is inside crop area
    const dx = x - cropArea.x;
    const dy = y - cropArea.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < cropArea.size / 2) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newX = Math.max(cropArea.size / 2, Math.min(canvas.width - cropArea.size / 2, x - dragStart.x));
    const newY = Math.max(cropArea.size / 2, Math.min(canvas.height - cropArea.size / 2, y - dragStart.y));

    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    setIsProcessing(true);
    try {
      // Create temp canvas for cropping
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error('Canvas context not available');

      // Output size 512x512
      const outputSize = 512;
      tempCanvas.width = outputSize;
      tempCanvas.height = outputSize;

      // Calculate source coordinates from original image
      const maxSize = 400;
      const imgRatio = img.width / img.height;
      let drawWidth = maxSize * scale;
      let drawHeight = maxSize * scale;

      if (imgRatio > 1) {
        drawHeight = drawWidth / imgRatio;
      } else {
        drawWidth = drawHeight * imgRatio;
      }

      const offsetX = (maxSize - drawWidth) / 2;
      const offsetY = (maxSize - drawHeight) / 2;

      // Convert canvas coords to image coords
      const scaleX = img.width / drawWidth;
      const scaleY = img.height / drawHeight;

      const srcX = (cropArea.x - offsetX - cropArea.size / 2) * scaleX;
      const srcY = (cropArea.y - offsetY - cropArea.size / 2) * scaleY;
      const srcSize = cropArea.size * scaleX;

      // Draw cropped circular image
      tempCtx.save();
      tempCtx.beginPath();
      tempCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      tempCtx.clip();

      tempCtx.drawImage(
        img,
        Math.max(0, srcX),
        Math.max(0, srcY),
        Math.min(srcSize, img.width),
        Math.min(srcSize, img.height),
        0,
        0,
        outputSize,
        outputSize
      );

      tempCtx.restore();

      // Convert to blob
      tempCanvas.toBlob(
        (blob) => {
          if (blob) {
            onComplete(blob);
          } else {
            alert('Fehler beim Zuschneiden');
          }
          setIsProcessing(false);
        },
        'image/jpeg',
        0.85
      );
    } catch (error) {
      console.error('Crop failed:', error);
      alert('Fehler beim Zuschneiden des Bildes');
      setIsProcessing(false);
    }
  }, [cropArea, scale, onComplete]);

  return createPortal(
    <div className="image-cropper-overlay" onClick={onCancel}>
      <div className="image-cropper-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cropper-header">
          <h2>Profilbild zuschneiden</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="cropper-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />
        </div>

        <div className="cropper-controls">
          <div className="zoom-control">
            <span className="zoom-label">🔍 Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="zoom-slider"
            />
            <span className="zoom-value">{scale.toFixed(1)}x</span>
          </div>
          <div className="size-control">
            <span className="size-label">📐 Größe</span>
            <input
              type="range"
              min={100}
              max={400}
              step={10}
              value={cropArea.size}
              onChange={(e) => setCropArea(prev => ({ ...prev, size: Number(e.target.value) }))}
              className="size-slider"
            />
            <span className="size-value">{cropArea.size}px</span>
          </div>
        </div>

        <div className="cropper-hint">
          <p>🖱️ Ziehe den Kreis • 🔍 Zoome rein/raus • 📐 Ändere die Größe</p>
        </div>

        <div className="cropper-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={isProcessing}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? '⏳ Verarbeite...' : '✓ Fertig'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
