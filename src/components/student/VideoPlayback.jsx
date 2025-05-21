import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function VideoPlayback({ videoTitle, videoUrl, onExit }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(600); // 10 minutes in seconds
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prevTime + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSliderChange = (value) => {
    setCurrentTime(value[0]);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col z-50"
    >
      <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center">
        <Button variant="ghost" className="text-white p-2" onClick={onExit}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Exit Video
        </Button>
        <h1 className="text-white text-xl ml-4 font-medium">{videoTitle}</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {/* Video simulation area */}
        <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-white text-center">
            {isPlaying ? (
              <p className="text-2xl font-medium mb-4">
                Now Playing: {videoTitle}
              </p>
            ) : (
              <div className="flex flex-col items-center">
                <Play className="h-16 w-16 mb-4" />
                <p className="text-2xl font-medium">
                  Click play to continue watching
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video controls */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-4xl mx-auto">
          <Slider
            defaultValue={[0]}
            max={duration}
            step={1}
            value={[currentTime]}
            onValueChange={handleSliderChange}
            className="mb-4"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={handleStop}
              >
                <Square className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={handleMuteToggle}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div>
              <Button
                onClick={onExit}
                variant="outline"
                size="sm"
                className="text-white bg-transparent border-white hover:bg-white hover:text-black"
              >
                Finish Watching
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
