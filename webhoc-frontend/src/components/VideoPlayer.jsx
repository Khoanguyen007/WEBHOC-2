import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';

const VideoPlayer = ({ videoUrl, onTimeUpdate, lastPosition = 0, title = 'Video' }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  // Detect video type
  const getVideoType = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.endsWith('.m3u8')) return 'hls';
    if (url.match(/\.(mp4|webm|ogg)$/i)) return 'html5';
    return null;
  };

  const extractYoutubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?\n]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : false;
  };

  const extractVimeoId = (url) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Resume playback from last position
  useEffect(() => {
    if (videoRef.current && lastPosition > 0) {
      videoRef.current.currentTime = lastPosition;
    }
  }, [lastPosition, videoUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Call parent handler to save progress
      if (onTimeUpdate) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (playerRef.current) {
      if (!isFullscreen) {
        playerRef.current.requestFullscreen?.() ||
          playerRef.current.mozRequestFullScreen?.() ||
          playerRef.current.webkitRequestFullscreen?.() ||
          playerRef.current.msRequestFullscreen?.();
      } else {
        document.exitFullscreen?.() ||
          document.mozCancelFullScreen?.() ||
          document.webkitExitFullscreen?.() ||
          document.msExitFullscreen?.();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const videoType = getVideoType(videoUrl);

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p>Không có video cho bài học này</p>
        </div>
      </div>
    );
  }

  // YouTube embed
  if (videoType === 'youtube') {
    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) {
      return (
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-red-500">
          <AlertCircle className="w-16 h-16" />
        </div>
      );
    }
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?start=${Math.floor(lastPosition)}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Vimeo embed
  if (videoType === 'vimeo') {
    const vimeoId = extractVimeoId(videoUrl);
    if (!vimeoId) {
      return (
        <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-red-500">
          <AlertCircle className="w-16 h-16" />
        </div>
      );
    }
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          width="100%"
          height="100%"
          frameBorder="0"
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // HTML5 video player (for MP4, WebM, OGG, or HLS)
  return (
    <div
      ref={playerRef}
      className="w-full bg-black rounded-lg overflow-hidden group relative"
    >
      <div className="aspect-video relative">
        <video
          ref={videoRef}
          className="w-full h-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setError('Lỗi khi tải video')}
        >
          <source src={videoUrl} type={videoType === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} />
          Trình duyệt của bạn không hỗ trợ video HTML5.
        </video>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Play button overlay */}
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-white/30 hover:bg-white/50 rounded-full p-4 transition-colors">
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white fill-white" />
            ) : (
              <Play className="w-12 h-12 text-white fill-white" />
            )}
          </div>
        </button>

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                setCurrentTime(newTime);
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime;
                }
              }}
              className="w-full h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${
                  (currentTime / duration) * 100
                }%, rgb(55, 65, 81) ${(currentTime / duration) * 100}%, rgb(55, 65, 81) 100%)`
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center space-x-3">
              <button onClick={handlePlayPause} className="hover:opacity-75 transition-opacity">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="hover:opacity-75 transition-opacity">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${
                      (volume * 100) / 1
                    }%, rgb(55, 65, 81) ${(volume * 100) / 1}%, rgb(55, 65, 81) 100%)`
                  }}
                />
              </div>

              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button onClick={toggleFullscreen} className="hover:opacity-75 transition-opacity">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
