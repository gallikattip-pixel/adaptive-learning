import React, { useEffect, useRef } from 'react';
import type { YouTubeVideoRecommendation } from '@/types/ml';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { formatSkillName } from '@/lib/mlFormatters';
import { Badge } from '@/components/common/Badge';

export interface YouTubeVideoModalProps {
  video: YouTubeVideoRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const YouTubeVideoModal: React.FC<YouTubeVideoModalProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus close button on modal open
    closeButtonRef.current?.focus();

    // Prevent background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) {
    return null;
  }

  // Ensure embed URL is well-formed with youtube-nocookie.com domain
  const embedUrl = video.embed_url || `https://www.youtube-nocookie.com/embed/${video.video_id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-text/80 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-warm-ivory border border-deep-green/30 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-deep-green/15 bg-white/50">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <Badge variant="yellow">Recommended Video Tutorial</Badge>
              <Badge variant="deepGreen">{video.difficulty}</Badge>
            </div>
            <h2 id="video-modal-title" className="text-base sm:text-lg font-bold text-dark-text line-clamp-1">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold text-dark-text/80">{video.channel_title}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Sparkles size={12} className="text-dark-green" />
                {formatSkillName(video.target_skill)}
              </span>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close video player"
            className="p-1.5 text-dark-text/60 hover:text-dark-text hover:bg-deep-green/10 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-dark-green"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player (Responsive 16:9) */}
        <div className="relative w-full pt-[56.25%] bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>

        {/* Footer info */}
        <div className="p-4 sm:p-5 bg-white/40 border-t border-deep-green/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <p className="text-muted italic flex-1">
            {video.reason}
          </p>

          <a
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-dark-green font-semibold hover:underline whitespace-nowrap"
          >
            <span>Watch on YouTube</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};
