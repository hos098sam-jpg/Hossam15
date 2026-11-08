import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import type { User } from '../types';

export interface VideoJsPlayerProps {
  lessonId?: string;
  initialTitle?: string;
  videoUrl: string;
  user?: User | null;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

export const VideoJsPlayer: React.FC<VideoJsPlayerProps> = ({
  lessonId,
  initialTitle,
  videoUrl,
  user,
  className,
}) => {
  return (
    <VideoPlayer
      videoId={lessonId || 'video-js-player'}
      title={initialTitle || 'مشغل الفيديو'}
      fallbackUrl={videoUrl}
      currentUser={user}
      className={className}
    />
  );
};

export default VideoJsPlayer;
