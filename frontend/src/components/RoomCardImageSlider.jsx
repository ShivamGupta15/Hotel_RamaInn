import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Camera } from 'lucide-react';

export default function RoomCardImageSlider({ images, alt, badge, price, onEnlarge }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images to an array with at least 1 image
  const photoList = Array.isArray(images) && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', height: '260px', overflow: 'hidden', background: '#0a1128' }}>
      {/* Active Photo */}
      <img
        src={photoList[currentIndex]}
        alt={`${alt} - Photo ${currentIndex + 1}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: 'pointer',
          transition: 'transform 0.4s ease, opacity 0.3s ease',
        }}
        onClick={() => onEnlarge && onEnlarge(photoList[currentIndex])}
      />

      {/* Top Left Badge */}
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(10, 17, 40, 0.85)',
            color: '#f6c773',
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 14px',
            borderRadius: '9999px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {badge}
        </span>
      )}

      {/* Top Right Photo Count Indicator */}
      {photoList.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0, 0, 0, 0.65)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '9999px',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Camera size={13} />
          <span>{currentIndex + 1} / {photoList.length}</span>
        </div>
      )}

      {/* Bottom Right Price Pill */}
      {price && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: '#ffffff',
            padding: '8px 14px',
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '16px',
            color: '#0a1128',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          ₹{Number(price).toLocaleString()}
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}> / night</span>
        </div>
      )}

      {/* Left/Right Carousel Controls */}
      {photoList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.88)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 3,
              transition: 'background 0.2s',
            }}
            aria-label="Previous room photo"
          >
            <ChevronLeft size={20} color="#0a1128" />
          </button>

          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.88)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 3,
              transition: 'background 0.2s',
            }}
            aria-label="Next room photo"
          >
            <ChevronRight size={20} color="#0a1128" />
          </button>

          {/* Dots Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '16px',
              display: 'flex',
              gap: '5px',
              zIndex: 2,
            }}
          >
            {photoList.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === currentIndex ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: idx === currentIndex ? '#f6c773' : 'rgba(255, 255, 255, 0.6)',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

