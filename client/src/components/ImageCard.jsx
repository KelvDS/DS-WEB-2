import { useState, useEffect } from 'react';

export default function ImageCard({ image, onToggleFavorite, onToggleSelection, onClick, favoriteCount, selectionCount, onDownload }) {
  const [isFavorite, setIsFavorite] = useState(!!image.is_favorite);
  const [isSelected, setIsSelected] = useState(!!image.is_selected);
  const isApproved = !!image.is_approved;

  useEffect(() => {
    setIsFavorite(!!image.is_favorite);
    setIsSelected(!!image.is_selected);
  }, [image.is_favorite, image.is_selected]);

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

  return (
    <div 
      className="card relative group overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <img
        src={`/uploads/${image.watermarked_filename}`}
        alt=""
        className="w-full h-64 object-cover rounded-lg select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      />

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center gap-4">
        {isApproved ? (
          <button
            onClick={handleDownload}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 text-white p-3 rounded-full hover:bg-green-700"
            title="Download high-resolution"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={handleFavorite}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-full ${
                isFavorite ? 'bg-gold text-gray-900' : 'bg-gray-800 text-white'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            <button
              onClick={handleSelection}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-full ${
                isSelected ? 'bg-blue text-white' : 'bg-gray-800 text-white'
              }`}
              title={isSelected ? 'Deselect for high-res' : 'Select for high-res'}
            >
              <svg className="w-6 h-6" fill={isSelected ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 bg-opacity-70 backdrop-blur-sm p-2 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex gap-2 z-10">
        {isApproved && (
          <div className="flex flex-col items-center">
            <span className="bg-green-600 text-white p-2 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span>
          </div>
        )}
        {!isApproved && isFavorite && (
          <div className="flex flex-col items-center">
            <span className="bg-gold text-gray-900 p-2 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
            <span className="mt-1 bg-gold text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
              {favoriteCount}
            </span>
          </div>
        )}
        {!isApproved && isSelected && (
          <div className="flex flex-col items-center">
            <span className="bg-blue text-white p-2 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="mt-1 bg-blue text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              {selectionCount}
            </span>
          </div>
        )}
      </div>

      {isApproved && (
        <div className="absolute top-2 left-2 bg-green-600 text-white p-2 rounded-full shadow-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}