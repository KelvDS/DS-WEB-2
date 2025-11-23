import { useState, useEffect } from 'react';
import { getClientGalleries, getGalleryImages, toggleFavorite, toggleSelection, requestGallery, requestHighRes, downloadImage } from '../api';
import ImageCard from '../components/ImageCard';
import ImageModal from '../components/ImageModal';

export default function Gallery() {
  const [galleries, setGalleries] = useState([]);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    loadGalleries();
    
    // Auto-refresh every 30 seconds to check for new approvals
    const interval = setInterval(() => {
      if (selectedGallery && !modalImage) {
        loadImages(selectedGallery, true); // silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedGallery, modalImage]);

  const loadGalleries = async () => {
    try {
      const data = await getClientGalleries();
      setGalleries(data);
      if (data.length > 0) {
        setSelectedGallery(data[0].id);
        loadImages(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (galleryId, silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getGalleryImages(galleryId);
      setImages(data);
      
      // Update modal image if it's open
      if (modalImage) {
        const updatedModalImage = data.find(img => img.id === modalImage.id);
        if (updatedModalImage) {
          setModalImage(updatedModalImage);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (selectedGallery) {
      loadImages(selectedGallery);
    }
  };

  const handleToggleFavorite = async (imageId) => {
    try {
      await toggleFavorite(imageId);
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, is_favorite: img.is_favorite ? 0 : 1 } : img
        )
      );
      if (modalImage && modalImage.id === imageId) {
        setModalImage(prev => ({ ...prev, is_favorite: prev.is_favorite ? 0 : 1 }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleToggleSelection = async (imageId) => {
    try {
      await toggleSelection(imageId);
      setImages(prevImages => 
        prevImages.map(img => 
          img.id === imageId ? { ...img, is_selected: img.is_selected ? 0 : 1 } : img
        )
      );
      if (modalImage && modalImage.id === imageId) {
        setModalImage(prev => ({ ...prev, is_selected: prev.is_selected ? 0 : 1 }));
      }
    } catch (err) {
      alert(err.message || 'Cannot change selection');
    }
  };

  const handleDownload = async (imageId) => {
    try {
      await downloadImage(imageId);
    } catch (err) {
      alert('Download failed. Please try again.');
    }
  };

  const handleRequestGallery = async () => {
    try {
      await requestGallery();
      setHasRequested(true);
      alert('Gallery request sent! An admin will assign you a gallery soon.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRequestHighRes = async () => {
    const selectedImages = images.filter(img => img.is_selected && !img.is_approved).map(img => img.id);
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    try {
      await requestHighRes(selectedImages);
      alert(`High-resolution request submitted for ${selectedImages.length} image(s)! You'll be notified when approved.`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImageClick = (image) => {
    setModalImage(image);
  };

  const handleCloseModal = () => {
    setModalImage(null);
  };

  const handleNavigate = (direction) => {
    const currentIndex = images.findIndex(img => img.id === modalImage.id);
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : currentIndex;
    }
    setModalImage(images[newIndex]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center card">
          <h2 className="text-2xl font-bold text-gold mb-4">No Gallery Assigned</h2>
          <p className="text-gray-400 mb-6">
            You don't have a gallery yet. Request one from an admin to get started.
          </p>
          <button onClick={handleRequestGallery} disabled={hasRequested} className="btn-primary disabled:opacity-50">
            {hasRequested ? 'Request Sent' : 'Request Gallery'}
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = images.filter(img => img.is_selected && !img.is_approved).length;
  const favoriteCount = images.filter(img => img.is_favorite).length;
  const approvedCount = images.filter(img => img.is_approved).length;

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">My Gallery</h1>
            <div className="flex gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-bold text-gold">{favoriteCount}</span> favorite{favoriteCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-bold text-blue">{selectedCount}</span> selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-gray-300">
                  <span className="font-bold text-green-600">{approvedCount}</span> approved
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="btn-outline text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              title="Refresh to check for new approvals"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {selectedCount > 0 && (
              <button onClick={handleRequestHighRes} className="btn-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Request High-Res ({selectedCount})
              </button>
            )}
          </div>
        </div>

        {galleries.length > 1 && (
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            {galleries.map(gallery => (
              <button key={gallery.id} onClick={() => { setSelectedGallery(gallery.id); loadImages(gallery.id); }}
                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap ${
                  selectedGallery === gallery.id ? 'bg-gold text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}>
                {gallery.name}
              </button>
            ))}
          </div>
        )}

        {approvedCount > 0 && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-400 font-semibold">You have {approvedCount} approved image{approvedCount !== 1 ? 's' : ''} ready for download!</p>
                <p className="text-green-300 text-sm">Look for the green download button on approved images.</p>
              </div>
            </div>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No images in this gallery yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {images.map(image => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleSelection={handleToggleSelection}
                  onClick={() => handleImageClick(image)}
                  favoriteCount={favoriteCount}
                  selectionCount={selectedCount}
                  onDownload={handleDownload}
                />
              ))}
            </div>
            
            <div className="mt-8 text-center text-gray-400">
              <p>Showing {images.length} image{images.length !== 1 ? 's' : ''}</p>
              <p className="text-xs mt-2">Gallery auto-refreshes every 30 seconds to check for new approvals</p>
            </div>
          </>
        )}
      </div>

      {modalImage && (
        <ImageModal
          image={modalImage}
          images={images}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
          onToggleFavorite={handleToggleFavorite}
          onToggleSelection={handleToggleSelection}
          favoriteCount={favoriteCount}
          selectionCount={selectedCount}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}