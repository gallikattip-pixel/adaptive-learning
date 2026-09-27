import React, { useState } from 'react';
import type { UnifiedPersonalizedPlan, YouTubeVideoRecommendation } from '@/types/ml';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatSkillName } from '@/lib/mlFormatters';
import { BookOpen, Clock, Sparkles, RefreshCw, ExternalLink, Play, Video } from 'lucide-react';
import { YouTubeVideoModal } from '@/components/student/YouTubeVideoModal';

export interface LearningSectionProps {
  plan: UnifiedPersonalizedPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  onRetryPlan: () => void;
  onStartDiagnostic: () => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  plan,
  isLoadingPlan,
  planError,
  onRetryPlan,
  onStartDiagnostic,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoRecommendation | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const recommendations = plan?.recommendations || [];
  const videoRecommendations = plan?.video_recommendations || [];

  const handleWatchVideo = (video: YouTubeVideoRecommendation) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-deep-green/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow">Model 3 Recommendation Engine</Badge>
            {isLoadingPlan && (
              <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Fetching recommendations...
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-dark-text">
            Recommended Learning Objects
          </h2>
          <p className="text-xs text-muted mt-1">
            Targeted micro-learning content and video tutorials allocated dynamically based on your active prerequisite skill gaps.
          </p>
        </div>

        {plan && (
          <Button variant="outline" size="sm" onClick={onRetryPlan} disabled={isLoadingPlan}>
            <RefreshCw size={14} className={isLoadingPlan ? 'animate-spin' : ''} />
            <span>Recalibrate</span>
          </Button>
        )}
      </div>

      {/* Error state */}
      {planError && (
        <Card className="p-4 bg-amber-50 border-amber-200 text-dark-text flex items-center justify-between">
          <span className="text-xs text-amber-900">
            Unable to retrieve personalized resource recommendations from backend.
          </span>
          <Button variant="outline" size="sm" onClick={onRetryPlan}>
            Retry
          </Button>
        </Card>
      )}

      {/* Section 1: Recommended Video Tutorials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-dark-green" />
          <h3 className="text-lg font-bold text-dark-text">Recommended Video Tutorials</h3>
          <Badge variant="deepGreen">YouTube Learning Layer</Badge>
        </div>

        {isLoadingPlan && !plan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-4 bg-warm-ivory border-deep-green/20 space-y-3">
                <div className="h-32 bg-deep-green/10 rounded-md animate-pulse" />
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-1/2" />
              </Card>
            ))}
          </div>
        ) : videoRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoRecommendations.map((video) => (
              <Card
                key={video.video_id}
                className="p-4 bg-warm-ivory border-deep-green/30 hover:border-deep-green space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Thumbnail Container */}
                  <div
                    className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black/10 cursor-pointer group"
                    onClick={() => handleWatchVideo(video)}
                  >
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-dark-green text-warm-ivory flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={20} className="ml-0.5 fill-warm-ivory" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="yellow">{video.difficulty}</Badge>
                    </div>
                  </div>

                  <div>
                    <h4
                      className="font-bold text-dark-text text-sm leading-snug line-clamp-2 hover:text-dark-green cursor-pointer"
                      onClick={() => handleWatchVideo(video)}
                    >
                      {video.title}
                    </h4>
                    <p className="text-xs text-muted font-medium mt-1">
                      {video.channel_title}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-dark-green font-mono">
                    <Sparkles size={12} />
                    <span>{formatSkillName(video.target_skill)}</span>
                  </div>

                  {video.reason && (
                    <p className="text-[11px] text-muted italic border-l-2 border-deep-green/30 pl-2">
                      {video.reason}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-deep-green/10">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center gap-2"
                    onClick={() => handleWatchVideo(video)}
                  >
                    <Play size={14} className="fill-current" />
                    <span>Watch Tutorial</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-4 bg-warm-ivory/60 border-deep-green/15 text-muted text-xs flex items-center justify-between">
            <span>No video recommendations available right now.</span>
            <span className="font-mono text-[10px] text-dark-text/40">Adaptive Video Layer Ready</span>
          </Card>
        )}
      </div>

      {/* Section 2: Authoritative Documentation & Course Objects */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-dark-green" />
          <h3 className="text-lg font-bold text-dark-text">Official Learning Resources & Guides</h3>
          <Badge variant="yellow">Model 3 Catalog</Badge>
        </div>

        {/* Loading Skeletons */}
        {isLoadingPlan && !plan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 bg-warm-ivory border-deep-green/20 space-y-4">
                <div className="h-4 bg-deep-green/10 rounded-sm animate-pulse w-1/4" />
                <div className="h-5 bg-deep-green/10 rounded-sm animate-pulse w-3/4" />
                <div className="h-3 bg-deep-green/10 rounded-sm animate-pulse w-full" />
              </Card>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => {
              const isBeginner = rec.difficulty === 'BEGINNER' || rec.difficulty === 'EASY';

              return (
                <Card
                  key={rec.resource_id}
                  className="p-6 bg-warm-ivory border-deep-green/30 hover:border-deep-green space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-dark-green bg-dark-green/10 px-2 py-0.5 rounded">
                        {rec.resource_id}
                      </span>
                      <Badge variant={isBeginner ? 'deepGreen' : 'yellow'}>
                        {rec.difficulty}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-dark-text text-base leading-snug">
                      {rec.title}
                    </h3>

                    {rec.concept && (
                      <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                        <Sparkles size={13} className="text-dark-green" />
                        <span>{formatSkillName(rec.concept)}</span>
                      </div>
                    )}

                    {rec.match_reasons && rec.match_reasons.length > 0 && (
                      <div className="space-y-1">
                        {rec.match_reasons.map((reason, idx) => (
                          <p key={idx} className="text-[11px] text-muted italic">
                            • {reason}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-deep-green/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {rec.estimated_minutes ? `${rec.estimated_minutes} mins` : 'Self-paced'}
                      </span>
                      {typeof rec.score === 'number' && (
                        <span className="font-mono font-bold text-dark-green">
                          Match: {Math.round(rec.score * 100)}%
                        </span>
                      )}
                    </div>

                    <Button variant="secondary" size="sm" className="w-full justify-center">
                      <BookOpen size={14} />
                      <span>Open Learning Object</span>
                      <ExternalLink size={12} className="ml-auto opacity-70" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Recommended Learning Objects Available Yet"
            description="Learning resources are automatically allocated by the Model 3 recommendation engine based on your active skill gaps and diagnostic assessments."
            actionLabel="Launch Diagnostic Assessment"
            onAction={onStartDiagnostic}
            statusBadge="Model 3 Allocation Ready"
          />
        )}
      </div>

      {/* Video Player Modal */}
      <YouTubeVideoModal
        video={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
