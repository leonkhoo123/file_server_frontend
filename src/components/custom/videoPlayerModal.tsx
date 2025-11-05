import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Maximize,
  Zap,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";

interface VideoPlayerModalProps {
  fileId: string;
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  fileId,
  url,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // --- format time helper ---
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // --- Load video when opened ---
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const video = videoRef.current;
      if (video) {
        video.src = url;
        video.play().catch(() => setIsPlaying(false));
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, url]);

  // --- Sync playback state and progress ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(video.duration || 0);
    const handleTimeUpdate = () => {
      if (!video.duration) return;
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // --- Playback controls ---
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play();
  }, [isPlaying]);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (video) video.currentTime += seconds;
  }, []);

  const changeSpeed = useCallback((rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
    }
  }, []);

  // --- Seek by clicking progress bar ---
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = percent * duration;
      setProgress(percent * 100);
    },
    [duration]
  );

  // --- Fullscreen ---
  const handleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else video.requestFullscreen().catch(console.warn);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* --- Video --- */}
      <div className="flex items-center justify-center bg-black h-full">
        <video
          ref={videoRef}
          controls={false}
          autoPlay
          className="max-h-[calc(100vh)] max-w-full object-contain"
        />
      </div>

      {/* --- Time Display --- */}
      <div className="absolute bottom-2 left-1 w-full text-left text-white text-sm select-none">
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="text-gray-400 ml-2">
          (-{formatTime(duration - currentTime)})
        </span>
      </div>

      {/* --- Progress Bar --- */}
      <div
        className="absolute bottom-0 w-full h-2 bg-gray-700 cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-2 bg-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* --- Control Bar --- */}
      <div className="absolute top-1/2 right-0 p-2 bg-transparent rounded-md flex flex-col items-center justify-center w-[100px] space-y-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>



        <Button
          variant="ghost"
          onClick={() => skip(1)}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          1s <SkipForward className="h-4 w-4 ml-1" />
        </Button>

        <Button
          variant="ghost"
          onClick={() => skip(3)}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          3s <SkipForward className="h-4 w-4 ml-1" />
        </Button>



        <Button
          variant="ghost"
          onClick={() => changeSpeed(playbackRate === 2.0 ? 1.0 : 2.0)}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          <Zap className="h-4 w-4 mr-1" />
          {playbackRate === 2.0 ? "x1" : "x2"}
        </Button>

        <div className="text-sm text-white">{playbackRate.toFixed(1)}x</div>

        <Button
          variant="ghost"
          onClick={() => skip(-1)}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          <SkipBack className="h-4 w-4 mr-1" /> 1s
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFullscreen}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          <Maximize className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/80 w-full bg-white/30"
        >
          <RotateCw className="h-5 w-5 rotate-90" />
        </Button>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
