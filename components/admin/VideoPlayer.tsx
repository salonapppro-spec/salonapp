"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  /** e.g. "9/16" for portrait, "16/9" for landscape. Defaults to "9/16". */
  aspectRatio?: string;
}

export function VideoPlayer({ src, aspectRatio = "9/16" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
    showControls();
  }, [showControls]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    showControls();
  }, [showControls]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (progressRef.current) {
      progressRef.current.value = String(v.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    if (progressRef.current) {
      progressRef.current.max = String(v.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
    setCurrentTime(v.currentTime);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-black flex items-center justify-center"
          : "relative w-full rounded-xl overflow-hidden bg-black"
      }
      style={!isFullscreen ? { aspectRatio } : undefined}
      onMouseMove={showControls}
      onTouchStart={showControls}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        className={
          isFullscreen
            ? "w-full h-full object-contain"
            : "absolute inset-0 w-full h-full object-contain"
        }
        playsInline
        onPlay={() => {
          setIsPlaying(true);
          hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
        }}
        onPause={() => {
          setIsPlaying(false);
          setControlsVisible(true);
          if (hideTimer.current) clearTimeout(hideTimer.current);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 px-3 pt-6 pb-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="relative mb-2 h-1 rounded-full bg-white/30">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            defaultValue={0}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-white p-1 rounded hover:bg-white/10 transition-colors"
            aria-label={isPlaying ? "Пауза" : "Пусни"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <span className="text-white/80 text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          <button
            onClick={toggleMute}
            className="text-white p-1 rounded hover:bg-white/10 transition-colors"
            aria-label={isMuted ? "Включи звук" : "Изключи звук"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="text-white p-1 rounded hover:bg-white/10 transition-colors"
            aria-label={isFullscreen ? "Намали" : "Цял екран"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Central play button when paused */}
      {!isPlaying && controlsVisible && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-4">
            <Play size={32} className="text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}
