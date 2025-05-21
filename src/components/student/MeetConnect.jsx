import { useState, useEffect, useRef } from "react";
import {
  Info,
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  FileText,
  Hand,
  MoreVertical,
  PhoneOff,
  Copy,
  Check,
  Send,
  Download,
} from "lucide-react";
import WarningPopup from "@/components/common/WarningPopup";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MeetConnect({ workshopTitle, onLeave }) {
  // Sample participant data with handRaised property
  const [participants, setParticipants] = useState([
    {
      id: 1,
      name: "Alex Johnson",
      initials: "AJ",
      muted: false,
      videoOff: false,
      handRaised: false,
      isHost: true,
    },
    {
      id: 2,
      name: "Sarah Kim",
      initials: "SK",
      muted: true,
      videoOff: false,
      handRaised: false,
    },
    {
      id: 3,
      name: "Carlos Rodriguez",
      initials: "CR",
      muted: false,
      videoOff: true,
      handRaised: false,
    },
    {
      id: 4,
      name: "James Davis",
      initials: "JD",
      muted: true,
      videoOff: true,
      handRaised: false,
    },
    {
      id: 5,
      name: "You",
      initials: "ME",
      muted: false,
      videoOff: false,
      handRaised: false,
    },
  ]);

  // State for UI controls
  const [activeTab, setActiveTab] = useState("chat");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [meetingTime, setMeetingTime] = useState("00:00:00");
  const [copyState, setCopyState] = useState({ id: false, link: false });
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      name: "Alex Johnson",
      time: "1:15 PM",
      message:
        "Hi everyone! Let's get started with our standup. Please share your progress from yesterday.",
    },
    {
      id: 2,
      name: "Sarah Kim",
      time: "1:16 PM",
      message:
        "I completed the UI design for the dashboard and started working on the mobile responsive layout.",
    },
    {
      id: 3,
      name: "Carlos Rodriguez",
      time: "1:17 PM",
      message:
        "Fixed the authentication bug we found yesterday. Planning to work on the API integration today.",
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [notes, setNotes] = useState("");
  const chatContainerRef = useRef(null);

  const [showCopySuccessPopup, setShowCopySuccessPopup] = useState(false);
  const [showHandRaisePopup, setShowHandRaisePopup] = useState(false);
  const [showNotesDownloadPopup, setShowNotesDownloadPopup] = useState(false);

  // Timer effect for meeting duration
  useEffect(() => {
    const startTime = new Date();
    const timerInterval = setInterval(() => {
      const now = new Date();
      const diff = now - startTime;
      const hours = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setMeetingTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Scroll chat to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Toggle mic function
  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
    setParticipants((prev) =>
      prev.map((p) => (p.id === 5 ? { ...p, muted: !p.muted } : p))
    );
  };

  // Toggle video function
  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    setParticipants((prev) =>
      prev.map((p) => (p.id === 5 ? { ...p, videoOff: !p.videoOff } : p))
    );
  };

  // Copy text to clipboard function
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopySuccessPopup(true);
    });
  };

  // Send chat message
  const sendMessage = () => {
    if (currentMessage.trim()) {
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const newMessage = {
        id: chatMessages.length + 1,
        name: "You",
        time,
        message: currentMessage.trim(),
      };
      setChatMessages([...chatMessages, newMessage]);
      setCurrentMessage("");
    }
  };

  // Handle Enter key for sending message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle hand raise
  const toggleHandRaise = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === 5 ? { ...p, handRaised: !p.handRaised } : p))
    );
    const currentUser = participants.find((p) => p.id === 5);
    setShowHandRaisePopup(true);
  };

  // Find current user
  const currentUser = participants.find((p) => p.id === 5);

  // Download notes function
  const downloadNotes = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
    setShowNotesDownloadPopup(true);
  };

  return (
    <>
      {showCopySuccessPopup && (
        <WarningPopup
          title="Copied to Clipboard"
          description="Text has been copied to clipboard"
          type="success"
          onClose={() => setShowCopySuccessPopup(false)}
        />
      )}

      {showHandRaisePopup && (
        <WarningPopup
          title="Hand Status Changed"
          description={currentUser?.handRaised ? "Hand raised" : "Hand lowered"}
          type="info"
          onClose={() => setShowHandRaisePopup(false)}
        />
      )}

      {showNotesDownloadPopup && (
        <WarningPopup
          title="Notes Downloaded"
          description="Your meeting notes have been downloaded"
          type="success"
          onClose={() => setShowNotesDownloadPopup(false)}
        />
      )}

      <div className="flex flex-col h-full w-full overflow-hidden bg-gray-50">
        {/* Header - Reduced height */}
        <header className="flex justify-between items-center px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center text-blue-600 font-semibold">
            <Video className="mr-1 h-4 w-4" />
            <span className="text-lg">MeetConnect</span>
          </div>
          <div className="flex items-center">
            <div className="text-base font-medium mr-2 truncate max-w-xs">
              {workshopTitle}
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {meetingTime}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Info size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Meeting Information</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Main content - Using flex-1 to fill available space */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Video grid - Using overflow-auto instead of overflow-y-auto */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2 bg-gray-100 overflow-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="bg-gray-900 rounded-lg relative shadow-md overflow-hidden"
                style={{ paddingBottom: "75%" }}
              >
                <div className="absolute inset-0 flex flex-col justify-center items-center text-white">
                  {participant.videoOff ? (
                    <>
                      <Avatar className="w-16 h-16 mb-1">
                        <AvatarFallback className="bg-blue-600 text-xl">
                          {participant.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-xs font-medium">
                        {participant.name}
                        {participant.isHost && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            Host
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src="/api/placeholder/400/320"
                        alt={participant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1 text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded-md">
                        {participant.name}
                        {participant.isHost && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            Host
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Status indicators */}
                <div className="absolute top-1 right-1 flex space-x-1">
                  {participant.muted && (
                    <div className="bg-red-500 text-white p-1 rounded-full">
                      <MicOff size={12} />
                    </div>
                  )}
                  {participant.handRaised && (
                    <div className="bg-yellow-500 text-white p-1 rounded-full">
                      <Hand size={12} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Sidebar - Using min-h-0 to prevent overflow */}
          <div className="w-72 bg-white border-l border-gray-200 flex flex-col min-h-0 flex-shrink-0">
            <Tabs
              defaultValue="chat"
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col flex-1 min-h-0"
            >
              <TabsList className="w-full grid grid-cols-3 h-8 flex-shrink-0">
                <TabsTrigger value="chat" className="text-xs py-1">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="participants" className="text-xs py-1">
                  People ({participants.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs py-1">
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* Use hidden instead of absolute positioning to avoid event issues */}
              <TabsContent
                value="chat"
                className="flex-1 flex flex-col p-0 m-0 min-h-0 overflow-hidden"
              >
                <ScrollArea className="flex-1 p-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="mb-3 group">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm text-gray-800">
                          {msg.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {msg.time}
                        </span>
                      </div>
                      <div
                        className={`p-2 rounded-lg text-sm text-gray-800 leading-relaxed ${
                          msg.name === "You" ? "bg-blue-50" : "bg-gray-50"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="p-2 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center space-x-1">
                    <Textarea
                      placeholder="Message"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-8"
                    />
                    <Button
                      onClick={sendMessage}
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="participants"
                className="flex-1 p-0 m-0 min-h-0 overflow-hidden"
              >
                <ScrollArea className="h-full">
                  <div className="p-1">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-md"
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-600 text-xs">
                            {participant.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex items-center">
                          <span className="font-medium text-sm">
                            {participant.name}
                            {participant.isHost && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                Host
                              </Badge>
                            )}
                          </span>

                          {participant.handRaised && (
                            <Hand size={12} className="ml-1 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex space-x-1">
                          {participant.muted && (
                            <Badge
                              variant="secondary"
                              className="h-5 w-5 p-0 flex items-center justify-center"
                            >
                              <MicOff size={10} />
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                          >
                            <MoreVertical size={10} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="notes"
                className="flex-col p-2 m-0 min-h-0 overflow-hidden"
              >
                <Textarea
                  className="flex-1 mb-2 text-sm"
                  placeholder="Take your meeting notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button
                  onClick={downloadNotes}
                  size="sm"
                  className="w-full py-1 h-8 flex-shrink-0"
                >
                  <Download className="mr-1 h-3 w-3" />
                  <span className="text-xs">Download Notes</span>
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Controls - Reduced padding */}
        <div className="py-2 px-4 bg-white border-t border-gray-200 flex items-center justify-center gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMicMuted ? "destructive" : "outline"}
                    size="sm"
                    className="h-10 w-10 rounded-full"
                    onClick={toggleMic}
                  >
                    {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMicMuted ? "Unmute" : "Mute"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isVideoOff ? "destructive" : "outline"}
                    size="sm"
                    className="h-10 w-10 rounded-full"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isVideoOff ? "Turn on camera" : "Turn off camera"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full"
                  >
                    <Monitor size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share screen</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full"
                  >
                    <FileText size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentUser.handRaised ? "warning" : "outline"}
                    size="sm"
                    className={`h-10 w-10 rounded-full ${
                      currentUser.handRaised
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                        : ""
                    }`}
                    onClick={toggleHandRaise}
                  >
                    <Hand size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {currentUser.handRaised ? "Lower hand" : "Raise hand"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 rounded-full"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>More options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-10 w-10 rounded-full"
                  onClick={onLeave}
                >
                  <PhoneOff size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leave meeting</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Meeting info modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Meeting Information</DialogTitle>
              <DialogDescription>
                Share these details with others you want to invite to the
                meeting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-500">
                  Meeting name
                </label>
                <div className="font-medium">{workshopTitle}</div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-500">
                  Meeting ID
                </label>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    abc-defg-hij
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-7 w-7 p-0"
                    onClick={() => copyToClipboard("abc-defg-hij", "id")}
                  >
                    {copyState.id ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-500">
                  Invitation link
                </label>
                <div className="flex items-center">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">
                    https://meetconnect.app/abc-defg-hij
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-7 w-7 p-0"
                    onClick={() =>
                      copyToClipboard(
                        "https://meetconnect.app/abc-defg-hij",
                        "link"
                      )
                    }
                  >
                    {copyState.link ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:justify-end">
              <Button size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
