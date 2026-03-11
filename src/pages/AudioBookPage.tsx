import { useState, useEffect, useRef } from "react";
import { BookAudio, Settings, Play, Pause, Trash2, Plus, Volume2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { getAudioBooks, getAudioPaths, addAudioPath, updateAudioPath, deleteAudioPath, reportAudioBookProgress, getAudioBookStreamUrl } from "@/api/api-audiobook";
import type { AudioBookItem, AudioPath } from "@/api/api-audiobook";
import { formatBytes } from "@/utils/utils";
import { toast } from "sonner";
import DefaultLayout from "@/layouts/DefaultLayout";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioBookPage() {
  const [activeTab, setActiveTab] = useState<"library" | "settings">("library");
  
  // Library State
  const [audioBooks, setAudioBooks] = useState<AudioBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Path Settings State
  const [paths, setPaths] = useState<AudioPath[]>([]);
  const [newPath, setNewPath] = useState("");
  
  // Player State
  const [currentBook, setCurrentBook] = useState<AudioBookItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastReportedTime = useRef<number>(0);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "library") {
        const books = await getAudioBooks();
        setAudioBooks(books);
      } else {
        const p = await getAudioPaths();
        setPaths(p);
      }
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPath = async () => {
    if (!newPath) return;
    try {
      await addAudioPath(newPath);
      setNewPath("");
      fetchData();
      toast.success("Path added");
    } catch (e) {
      toast.error("Failed to add path");
    }
  };

  const handleTogglePath = async (id: number, is_enabled: boolean) => {
    try {
      await updateAudioPath(id, is_enabled);
      fetchData();
    } catch (e) {
      toast.error("Failed to update path");
    }
  };

  const handleDeletePath = async (id: number) => {
    try {
      await deleteAudioPath(id);
      fetchData();
      toast.success("Path deleted");
    } catch (e) {
      toast.error("Failed to delete path");
    }
  };

  const playBook = (book: AudioBookItem) => {
    if (currentBook?.name === book.name) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return;
    }
    
    setCurrentBook(book);
    setCurrentTime(book.progress_time);
    setIsPlaying(true);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = book.progress_time;
        audioRef.current.play().catch(console.error);
      }
    }, 100);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    
    // Report progress every 10 seconds
    if (Math.abs(time - lastReportedTime.current) > 10) {
      lastReportedTime.current = time;
      if (currentBook) {
        reportAudioBookProgress(currentBook.name, time).catch(console.error);
        
        // Update local state so progress bar reflects if paused and revisited
        setAudioBooks(prev => prev.map(b => 
          b.name === currentBook.name ? { ...b, progress_time: time } : b
        ));
      }
    }
  };

  const handleSeek = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setCurrentTime(val[0]);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val[0];
    }
  };

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full bg-background relative pb-24">
        {/* Header Tabs */}
        <div className="flex items-center gap-4 p-4 border-b">
          <Button 
            variant={activeTab === "library" ? "default" : "outline"} 
            onClick={() => setActiveTab("library")}
            className="flex items-center gap-2"
          >
            <BookAudio className="h-4 w-4" /> Library
          </Button>
          <Button 
            variant={activeTab === "settings" ? "default" : "outline"} 
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Paths Config
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading && <div className="text-muted-foreground">Loading...</div>}
          
          {activeTab === "library" && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audioBooks.length === 0 ? (
                <div className="text-muted-foreground">No audio books found.</div>
              ) : (
                audioBooks.map((book) => {
                  const percent = book.total_length > 0 ? (book.progress_time / book.total_length) * 100 : 0;
                  return (
                    <Card key={book.name} className="flex flex-col">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg line-clamp-2" title={book.name}>{book.name}</h3>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={() => playBook(book)}
                          >
                            {currentBook?.name === book.name && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>{formatDuration(book.total_length)}</span>
                          <span>{formatBytes(book.size)}</span>
                        </div>
                        
                        {/* Mini progress bar */}
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-auto">
                          <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "settings" && !loading && (
            <div className="max-w-2xl flex flex-col gap-6">
              <Card>
                <CardContent className="p-4 flex gap-2">
                  <Input 
                    placeholder="Enter absolute directory path (e.g. /data/audiobooks)" 
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                  />
                  <Button onClick={handleAddPath}><Plus className="h-4 w-4 mr-2"/> Add Path</Button>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                {paths.map(path => (
                  <Card key={path.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-mono text-sm truncate" title={path.path}>{path.path}</span>
                        <span className="text-xs text-muted-foreground">Added: {new Date(path.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={path.is_enabled} 
                            onCheckedChange={(val) => handleTogglePath(path.id, val)}
                          />
                          <span className="text-xs text-muted-foreground w-12">{path.is_enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeletePath(path.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {paths.length === 0 && <div className="text-muted-foreground text-center p-8">No paths configured.</div>}
              </div>
            </div>
          )}
        </div>

        {/* Player Component (Fixed at bottom) */}
        {currentBook && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:pl-72">
            <audio
              ref={audioRef}
              src={getAudioBookStreamUrl(currentBook.name + ".mp3")}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => {
                setDuration(e.currentTarget.duration);
                // Also update the book duration in state if backend estimated it poorly
                setAudioBooks(prev => prev.map(b => 
                  b.name === currentBook.name ? { ...b, total_length: e.currentTarget.duration } : b
                ));
              }}
            />
            
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center justify-between w-full md:w-auto md:min-w-[200px]">
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate" title={currentBook.name}>{currentBook.name}</span>
                  <span className="text-xs text-muted-foreground">Playing</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) audioRef.current.pause();
                    else audioRef.current.play();
                  }
                }} className="md:hidden">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
              </div>

              <div className="flex flex-col gap-2 flex-1 w-full">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-12 text-right">{formatDuration(currentTime)}</span>
                  <Slider 
                    value={[currentTime]} 
                    max={duration || currentBook.total_length || 100} 
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12">{formatDuration(duration || currentBook.total_length)}</span>
                </div>
                <div className="flex justify-center items-center gap-4 md:hidden">
                  <Button size="sm" variant="outline" onClick={() => {
                     if (currentBook) reportAudioBookProgress(currentBook.name, currentTime).then(() => toast.success("Progress saved"));
                  }}>
                    <Save className="h-3 w-3 mr-2" /> Save Progress
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 min-w-[150px]">
                <Button size="icon" variant="ghost" onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) audioRef.current.pause();
                    else audioRef.current.play();
                  }
                }}>
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <div className="flex items-center gap-2 flex-1 group">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider 
                    value={volume} 
                    max={1} 
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => {
                   if (currentBook) reportAudioBookProgress(currentBook.name, currentTime).then(() => toast.success("Progress saved"));
                }} title="Save Progress">
                  <Save className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
