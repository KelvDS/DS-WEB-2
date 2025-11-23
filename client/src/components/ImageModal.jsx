import { useState, useEffect } from 'react';

export default function ImageModal({ image, images, onClose, onNavigate, onToggleFavorite, onToggleSelection, favoriteCount, selectionCount, onDownload }) {
  const [isFavorite, setIsFavorite] = useState(!!image.is_favorite);
  const [isSelected, setIsSelected] = useState(!!image.is_selected);
  const isApproved = !!image.is_approved;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsFavorite(!!image.is_favorite);
    setIsSelected(!!image.is_selected);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowLeft') { onNavigate('prev'); return; }
      if (e.key === 'ArrowRight') { onNavigate('next'); return; }
      if (e.key === '+' || e.key === '=') handleZoom(0.2);
      if (e.key === '-' || e.key === '_') handleZoom(-0.2);
      if (e.key === '0') { setScale(1); setPosition({ x: 0, y: 0 }); }
    };

    const handleWheel = (e) => {
      if (e.target.closest('.image-zoom-container')) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        handleZoom(delta);
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyboardSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyboardSave);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyboardSave);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, onNavigate, scale]);

  const handleZoom = (delta) => {
    setScale(prev => {
      const newScale = Math.max(0.5, Math.min(5, prev + delta));
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      setDragStart({ x: distance, y: 0 });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const delta = (distance - dragStart.x) * 0.01;
      handleZoom(delta);
      setDragStart({ x: distance, y: 0 });
    }
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    try {
      await onToggleFavorite(image.id);
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelection = async (e) => {
    e.stopPropagation();
    if (isApproved) {
      alert('This image is already approved for download and cannot be deselected.');
      return;
    }
    try {
      await onToggleSelection(image.id);
      setIsSelected(!isSelected);
    } catch (err) {
      alert(err.message || 'Cannot change selection');
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      await onDownload(image.id);
    } catch (err) {
      alert('Download failed');
    }
  };

  if (!image) return null;

  const currentIndex = images.findIndex(img => img.id === image.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-white text-lg font-semibold">{currentIndex + 1} / {images.length}</div>
            <div className="text-gray-300 text-sm">Zoom: {Math.round(scale * 100)}%</div>
          </div>
          
          <button onClick={onClose} className="text-white hover:text-gold transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {hasPrev && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white p-4 rounded-full transition z-50 backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white p-4 rounded-full transition z-50 backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="relative max-w-6xl max-h-screen p-4 image-zoom-container overflow-hidden" onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
        
        <img src={`/uploads/${image.watermarked_filename}`} alt=""
          className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none rounded-lg shadow-2xl transition-transform"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <button onClick={() => handleZoom(0.2)} className="bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg backdrop-blur-sm transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button onClick={() => handleZoom(-0.2)} className="bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg backdrop-blur-sm transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg backdrop-blur-sm transition text-xs font-bold">
            1:1
          </button>
        </div>

        <div className="absolute bottom-4 right-4 flex gap-3">
          {isApproved ? (
            <button onClick={handleDownload}
              className="p-4 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/50 backdrop-blur-md transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          ) : (
            <>
              <button onClick={handleFavorite}
                className={`p-4 rounded-full transition-all duration-200 backdrop-blur-md ${
                  isFavorite ? 'bg-gold text-gray-900 shadow-lg shadow-gold/50' : 'bg-gray-900/70 text-white hover:bg-gold hover:text-gray-900'
                }`}>
                <svg className="w-7 h-7" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <button onClick={handleSelection}
                className={`p-4 rounded-full transition-all duration-200 backdrop-blur-md ${
                  isSelected ? 'bg-blue text-white shadow-lg shadow-blue/50' : 'bg-gray-900/70 text-white hover:bg-blue'
                }`}>
                <svg className="w-7 h-7" fill={isSelected ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="absolute top-4 right-4 flex gap-3">
          {isApproved && (
            <div className="flex flex-col items-center">
              <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Approved
              </span>
            </div>
          )}
          {!isApproved && isFavorite && (
            <div className="flex flex-col items-center">
              <span className="bg-gold text-gray-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favorite
              </span>
              <span className="mt-1 bg-gold text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                {favoriteCount} total
              </span>
            </div>
          )}
          {!isApproved && isSelected && (
            <div className="flex flex-col items-center">
              <span className="bg-blue text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Selected
              </span>
              <span className="mt-1 bg-blue text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                {selectionCount} total
              </span>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {isApproved ? 'High-Res Available' : 'Protected Preview'}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-50">
        <div className="container mx-auto">
          <div className="flex justify-center items-center gap-6 text-gray-300 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">←</kbd>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">→</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-3 py-1 bg-gray-800 rounded text-xs">ESC</kbd>
              <span>Close</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🖱️ Scroll to zoom</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📱 Pinch to zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}