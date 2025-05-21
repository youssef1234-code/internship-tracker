import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  CheckCircle,
  Award,
  Star,
  Download,
  Play,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";
import MeetConnect from "./MeetConnect";
import VideoPlayback from "./VideoPlayback";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
} from "@/utils/indexedDB-utils";
import WarningPopup from "@/components/common/WarningPopup";
import { addNotification } from "@/utils/notification-utils";
const saveWorkshop = async (workshop) => {
  saveToStore("workshops", workshop);
};

// Job interest to workshop category mapping
const jobInterestToCategories = {
  "Software Engineering": ["technical", "interview", "resume"],
  Marketing: ["branding", "networking", "communication"],
  "Human Resources": ["interview", "soft-skills", "career"],
  Finance: ["finance", "negotiation"],
  Entrepreneurship: ["entrepreneurship", "branding", "networking"],
  "Career Transition": ["career", "networking", "resume"],
  Writing: ["writing", "communication"],
  "Remote Work": ["remote-work", "soft-skills"],
  "Job Search": ["job-search", "resume", "networking"],
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const workshopCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

export default function WorkshopManagementProStudent() {
  const [workshops, setWorkshops] = useState([]);
  const [registeredWorkshops, setRegisteredWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [attendingWorkshop, setAttendingWorkshop] = useState(null);
  const [playingWorkshop, setPlayingWorkshop] = useState(null);
  const [studentName, setStudentName] = useState("Student");
  const [relevantCategories, setRelevantCategories] = useState([]);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showUnrigesteredWarning, setShowUnrigesteredWarning] = useState(false);
  const [showRigesteredWarning, setShowRigesteredWarning] = useState(false);
  const [showRatingError, setShowRatingError] = useState(false);
  const [showUnregisteredWarning, setShowUnregisteredWarning] = useState(false);
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

  const loadData = async () => {
    try {
      const allWorkshops = await getAllFromStore("workshops");
      setWorkshops(allWorkshops);

      const email = localStorage.getItem("email");
      if (email) {
        // Update registered workshops
        setRegisteredWorkshops(
          allWorkshops
            .filter(
              (workshop) =>
                workshop.registeredUsers &&
                workshop.registeredUsers.includes(email)
            )
            .map((workshop) => workshop.id)
        );

        // Load profile
        const profile = await getFromStore("studentProfiles", email);
        console.log("Profile data:", profile);
        if (profile) {
          if (profile.firstName && profile.lastName) {
            setStudentName(`${profile.firstName} ${profile.lastName}`);
          }

          if (profile.interests && profile.interests.length > 0) {
            const interests = profile.interests
              .split(",")
              .map((i) => i.trim().toLowerCase());

            const categoriesSet = new Set();
            interests.forEach((interest) => {
              const matchingKey = Object.keys(jobInterestToCategories).find(
                (key) => key.toLowerCase() === interest
              );
              if (matchingKey) {
                jobInterestToCategories[matchingKey].forEach((cat) =>
                  categoriesSet.add(cat)
                );
              }
            });
            setRelevantCategories(Array.from(categoriesSet));
          } else {
            setRelevantCategories([]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Load workshops from IndexedDB
  useEffect(() => {
    console.log("Loading workshops from IndexedDB...");
    loadData();
  }, []);

  useEffect(() => {
    if (attendingWorkshop) {
      const email = localStorage.getItem("email");
      chatMessages.forEach((chat) => {
        const notification = {
          email: email,
          message: `New message from ${chat.name} at ${chat.time}: "${chat.message}"`,
        };
        addNotification(notification);
      });
    }
  }, [attendingWorkshop]);

  const isWorkshopLive = (workshop) => {
    if (workshop.id === "1") return true;
    const now = new Date();
    const start = parseISO(workshop.startDate);
    const end = parseISO(workshop.endDate);
    return now >= start && now <= end;
  };

  const getFutureWorkshops = () => {
    return workshops.filter(
      (workshop) =>
        new Date(workshop.endDate) > new Date() &&
        workshop.status === "released"
    );
  };

  const getPastWorkshops = () => {
    return workshops.filter(
      (workshop) => new Date(workshop.endDate) <= new Date()
    );
  };

  const getRecommendedWorkshops = () => {
    const futureWorkshops = getFutureWorkshops();
    if (relevantCategories.length === 0) {
      return futureWorkshops;
    }
    return futureWorkshops.filter((workshop) =>
      relevantCategories.includes(workshop.category)
    );
  };

  const handleRegister = async (workshopId) => {
    const workshop = workshops.find((w) => w.id === workshopId);
    const email = localStorage.getItem("email");
    if (new Date(workshop.startDate) > new Date()) {
      // upcoming worksop send a notification for that student
      const notification = {
        message: `You have successfully registered for the workshop "${
          workshop.title
        }" that will be held on ${format(
          new Date(workshop.startDate),
          "PPPP"
        )}`,
        email: email,
      };
      addNotification(notification);
    }

    if (!email) {
      setShowWarningPopup(true);
      return;
    }

    if (workshop && workshop.registeredCount < workshop.capacity) {
      // Check if workshop has a registeredUsers array
      if (!workshop.registeredUsers) {
        workshop.registeredUsers = [];
      }

      // Check if user is already registered
      if (workshop.registeredUsers.includes(email)) {
        setShowWarningPopup(true);
        return;
      }

      const updatedWorkshop = {
        ...workshop,
        registeredCount: workshop.registeredCount + 1,
        registeredUsers: [...workshop.registeredUsers, email],
      };

      try {
        await saveWorkshop(updatedWorkshop);
        setWorkshops((prev) =>
          prev.map((w) => (w.id === workshopId ? updatedWorkshop : w))
        );
        setShowRigesteredWarning(true);
        await loadData(); // refresh component state
      } catch (error) {
        console.error("Error registering for workshop:", error);
        alert("Error registering for workshop. Please try again.");
      }
    }
  };

  const handleUnregister = async (workshopId) => {
    const workshop = workshops.find((w) => w.id === workshopId);
    const email = localStorage.getItem("email");

    if (!email) {
      setShowWarningPopup(true);
      return;
    }

    if (workshop) {
      // Check if workshop has registeredUsers and user is registered
      if (
        !workshop.registeredUsers ||
        !workshop.registeredUsers.includes(email)
      ) {
        setShowUnregisteredWarning(true);
        return;
      }

      const updatedWorkshop = {
        ...workshop,
        registeredCount: workshop.registeredCount - 1,
        registeredUsers: workshop.registeredUsers.filter(
          (user) => user !== email
        ),
      };

      try {
        await saveWorkshop(updatedWorkshop);
        setWorkshops((prev) =>
          prev.map((w) => (w.id === workshopId ? updatedWorkshop : w))
        );
        await loadData(); // refresh component state
      } catch (error) {
        console.error("Error unregistering from workshop:", error);
        alert("Error unregistering from workshop. Please try again.");
      }
    }
  };

  const handleWorkshopClick = (workshopId) => {
    console.log(`Clicked workshop with ID: ${workshopId}`);
  };

  const formatDateTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  const formatDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const hours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const getCategoryColor = (category) => {
    const categories = {
      resume: "bg-blue-500 hover:bg-blue-600",
      interview: "bg-purple-500 hover:bg-purple-600",
      networking: "bg-green-500 hover:bg-green-600",
      leadership: "bg-amber-500 hover:bg-amber-600",
      technical: "bg-red-500 hover:bg-red-600",
      negotiation: "bg-indigo-500 hover:bg-indigo-600",
      career: "bg-teal-500 hover:bg-teal-600",
      communication: "bg-pink-500 hover:bg-pink-600",
      branding: "bg-orange-500 hover:bg-orange-600",
      "soft-skills": "bg-cyan-500 hover:bg-cyan-600",
      "job-search": "bg-lime-500 hover:bg-lime-600",
      writing: "bg-violet-500 hover:bg-violet-600",
      entrepreneurship: "bg-rose-500 hover:bg-rose-600",
      "remote-work": "bg-sky-500 hover:bg-sky-600",
      finance: "bg-emerald-500 hover:bg-emerald-600",
    };
    return categories[category] || "bg-gray-500 hover:bg-gray-600";
  };

  const openRatingDialog = (workshop) => {
    setSelectedWorkshop(workshop);
    setCurrentRating(workshop.userRating || 0);
    setFeedback(workshop.userFeedback || "");
    setIsRatingDialogOpen(true);
  };

  const openCertificateDialog = (workshop) => {
    setSelectedWorkshop(workshop);
    setIsCertificateDialogOpen(true);
  };

  const submitRating = async () => {
    if (!selectedWorkshop) return;

    const updatedWorkshop = {
      ...selectedWorkshop,
      userRating: currentRating,
      userFeedback: feedback,
    };
    try {
      await saveWorkshop(updatedWorkshop);
      setWorkshops((prevWorkshops) =>
        prevWorkshops.map((workshop) =>
          workshop.id === selectedWorkshop.id ? updatedWorkshop : workshop
        )
      );
      setIsRatingDialogOpen(false);
      setCurrentRating(0);
      setFeedback("");
    } catch (error) {
      setShowRatingError(true);
    }
  };

  const downloadCertificate = async () => {
    if (!selectedWorkshop) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add fancy border
    doc.setDrawColor(44, 62, 80);
    doc.setLineWidth(3);
    doc.roundedRect(10, 10, 277, 190, 3, 3);

    // Add inner decorative border
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.roundedRect(20, 20, 257, 170, 3, 3);

    // Add certificate title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(44, 62, 80);
    doc.text("Certificate of Completion", 148.5, 40, { align: "center" });

    // Add decorative line
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.line(90, 45, 207, 45);

    // Add certificate text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("This certifies that", 148.5, 70, { align: "center" });

    // Add student name
    doc.setFont("times", "italic");
    doc.setFontSize(28);
    doc.setTextColor(44, 62, 80);
    doc.text(studentName, 148.5, 90, { align: "center" });

    // Add completion text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("has successfully completed", 148.5, 110, { align: "center" });

    // Add workshop title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(52, 152, 219);
    doc.text(selectedWorkshop.title, 148.5, 125, { align: "center" });

    // Add date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `on ${format(parseISO(selectedWorkshop.endDate), "MMMM d, yyyy")}`,
      148.5,
      145,
      { align: "center" }
    );

    // Add speaker name
    doc.setFontSize(12);
    doc.text("Presented by", 148.5, 165, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(selectedWorkshop.speaker.name, 148.5, 175, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(selectedWorkshop.speaker.title, 148.5, 182, { align: "center" });

    // Add logo/icon (simulated)
    doc.setDrawColor(52, 152, 219);
    doc.setFillColor(52, 152, 219);
    doc.circle(40, 40, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("W", 40, 45, { align: "center" });

    // Add certificate ID
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Certificate ID: ${selectedWorkshop.id}-${Date.now()
        .toString()
        .slice(-8)}`,
      148.5,
      195,
      { align: "center" }
    );

    doc.save(`certificate-${selectedWorkshop.title.replace(/\s+/g, "-")}.pdf`);

    const updatedWorkshop = {
      ...selectedWorkshop,
      certificateIssued: true,
    };
    try {
      await saveWorkshop(updatedWorkshop);
      setWorkshops((prevWorkshops) =>
        prevWorkshops.map((workshop) =>
          workshop.id === selectedWorkshop.id ? updatedWorkshop : workshop
        )
      );
      setIsCertificateDialogOpen(false);
    } catch (error) {
      console.error("Error issuing certificate:", error);
    }
  };

  const renderStarRating = (
    currentRating,
    maxRating = 5,
    interactive = false
  ) => {
    return (
      <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={`star-${index}`}
              className={`h-6 w-6 ${
                starValue <= currentRating
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              } ${interactive ? "cursor-pointer" : ""}`}
              onClick={
                interactive ? () => setCurrentRating(starValue) : undefined
              }
            />
          );
        })}
      </div>
    );
  };

  // Conditional rendering for MeetConnect or VideoPlayback
  if (attendingWorkshop) {
    const workshop = workshops.find((w) => w.id === attendingWorkshop);
    return (
      <MeetConnect
        workshopTitle={workshop.title}
        onLeave={() => setAttendingWorkshop(null)}
      />
    );
  }

  if (playingWorkshop) {
    const workshop = workshops.find((w) => w.id === playingWorkshop);
    return (
      <VideoPlayback
        videoTitle={workshop.title}
        videoUrl={
          workshop.videoUrl || "https://example.com/workshop-recording.mp4"
        }
        onExit={() => setPlayingWorkshop(null)}
      />
    );
  }

  return (
    <>
      {/* ("You are not registered for this workshop"); */}
      {showWarningPopup && (
        <WarningPopup
          title="Authentication Required"
          description="Please log in to register for workshops"
          type="warning"
          onClose={() => setShowWarningPopup(false)}
        />
      )}
      {showUnrigesteredWarning && (
        <WarningPopup
          title="Unregistered"
          description="You are not registered for this workshop!"
          type="warning"
          onClose={() => setShowUnrigesteredWarning(false)}
        />
      )}
      {showRigesteredWarning && (
        <WarningPopup
          title="Successfully Registered"
          description="You have successfully registered for this workshop!"
          type="success"
          onClose={() => setShowRigesteredWarning(false)}
        />
      )}
      {showRatingError && (
        <WarningPopup
          title="Rating Error"
          description="Error submitting workshop rating. Please try again."
          type="error"
          onClose={() => setShowRatingError(false)}
        />
      )}
      {showUnregisteredWarning && (
        <WarningPopup
          title="Not Registered"
          description="You are not registered for this workshop"
          type="info"
          onClose={() => setShowUnregisteredWarning(false)}
        />
      )}
      <motion.div
        className="w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="w-full max-w-full mx-auto">
          <CardHeader>
            <motion.div variants={itemVariants}>
              <CardTitle>Online Career Workshops</CardTitle>
              <CardDescription>
                Discover and register for upcoming career development workshops
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming Workshops</TabsTrigger>
                <TabsTrigger value="past">Past Workshops</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Workshops</TabsTrigger>
                    <TabsTrigger value="registered">
                      Registered Workshops
                    </TabsTrigger>
                    <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {getFutureWorkshops().length > 0 ? (
                        getFutureWorkshops().map((workshop) => (
                          <motion.div
                            key={workshop.id}
                            variants={workshopCardVariants}
                            whileHover="hover"
                            layout
                            onClick={() => handleWorkshopClick(workshop.id)}
                            className="cursor-pointer"
                          >
                            <Card className="h-full">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle>{workshop.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                      {formatDateTime(workshop.startDate)}
                                    </CardDescription>
                                  </div>
                                  <Badge
                                    className={cn(
                                      getCategoryColor(workshop.category)
                                    )}
                                  >
                                    {workshop.category.charAt(0).toUpperCase() +
                                      workshop.category.slice(1)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm mb-3">
                                  {workshop.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(
                                      workshop.startDate,
                                      workshop.endDate
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Users className="h-3 w-3" />
                                    {workshop.registeredCount}/
                                    {workshop.capacity} registered
                                  </Badge>
                                </div>
                                <div className="border-t pt-3 mt-2">
                                  <h4 className="font-medium text-sm mb-1">
                                    Speaker
                                  </h4>
                                  <p className="text-sm font-medium">
                                    {workshop.speaker.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {workshop.speaker.title}
                                  </p>
                                  <p className="text-xs">
                                    {workshop.speaker.bio}
                                  </p>
                                </div>
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="mt-3"
                                >
                                  <AccordionItem value="agenda">
                                    <AccordionTrigger className="text-sm font-medium py-2">
                                      Workshop Agenda
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="text-sm space-y-1">
                                        {workshop.agenda.map((item, index) => (
                                          <li
                                            key={`${workshop.id}-agenda-${index}`}
                                            className="flex items-start gap-2"
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </CardContent>
                              <CardFooter className="pt-2">
                                {registeredWorkshops.includes(workshop.id) ? (
                                  <p className="text-sm text-green-600">
                                    Registered
                                  </p>
                                ) : (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegister(workshop.id);
                                    }}
                                    disabled={
                                      workshop.registeredCount >=
                                      workshop.capacity
                                    }
                                  >
                                    {workshop.registeredCount >=
                                    workshop.capacity
                                      ? "Workshop Full"
                                      : "Register Now"}
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          variants={itemVariants}
                          className="col-span-2 text-center p-8 bg-muted rounded-lg"
                        >
                          <p className="text-lg font-medium text-gray-600">
                            No upcoming workshops scheduled
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Check back later for new workshops
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="registered">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {getFutureWorkshops().filter((workshop) =>
                        registeredWorkshops.includes(workshop.id)
                      ).length > 0 ? (
                        getFutureWorkshops()
                          .filter((workshop) =>
                            registeredWorkshops.includes(workshop.id)
                          )
                          .map((workshop) => (
                            <motion.div
                              key={workshop.id}
                              variants={workshopCardVariants}
                              whileHover="hover"
                              layout
                              onClick={() => handleWorkshopClick(workshop.id)}
                              className="cursor-pointer"
                            >
                              <Card className="h-full">
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle>{workshop.title}</CardTitle>
                                      <CardDescription className="mt-1">
                                        {formatDateTime(workshop.startDate)}
                                      </CardDescription>
                                    </div>
                                    <Badge
                                      className={cn(
                                        getCategoryColor(workshop.category)
                                      )}
                                    >
                                      {workshop.category
                                        .charAt(0)
                                        .toUpperCase() +
                                        workshop.category.slice(1)}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <p className="text-sm mb-3">
                                    {workshop.description}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(
                                        workshop.startDate,
                                        workshop.endDate
                                      )}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      <Users className="h-3 w-3" />
                                      {workshop.registeredCount}/
                                      {workshop.capacity} registered
                                    </Badge>
                                  </div>
                                  <div className="border-t pt-3 mt-2">
                                    <h4 className="font-medium text-sm mb-1">
                                      Speaker
                                    </h4>
                                    <p className="text-sm font-medium">
                                      {workshop.speaker.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {workshop.speaker.title}
                                    </p>
                                    <p className="text-xs">
                                      {workshop.speaker.bio}
                                    </p>
                                  </div>
                                  <Accordion
                                    type="single"
                                    collapsible
                                    className="mt-3"
                                  >
                                    <AccordionItem value="agenda">
                                      <AccordionTrigger className="text-sm font-medium py-2">
                                        Workshop Agenda
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ul className="text-sm space-y-1">
                                          {workshop.agenda.map(
                                            (item, index) => (
                                              <li
                                                key={`${workshop.id}-agenda-${index}`}
                                                className="flex items-start gap-2"
                                              >
                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                                <span>{item}</span>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </CardContent>
                                <CardFooter className="pt-2">
                                  {isWorkshopLive(workshop) ? (
                                    <Button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const updatedWorkshop = {
                                          ...workshop,
                                          hasAttended: true,
                                        };
                                        try {
                                          await saveWorkshop(updatedWorkshop);
                                          setWorkshops((prev) =>
                                            prev.map((w) =>
                                              w.id === workshop.id
                                                ? updatedWorkshop
                                                : w
                                            )
                                          );
                                          setAttendingWorkshop(workshop.id);
                                        } catch (error) {
                                          console.error(
                                            "Error marking attendance:",
                                            error
                                          );
                                        }
                                      }}
                                    >
                                      Join Now
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnregister(workshop.id);
                                      }}
                                    >
                                      Unregister
                                    </Button>
                                  )}
                                </CardFooter>
                              </Card>
                            </motion.div>
                          ))
                      ) : (
                        <motion.div
                          variants={itemVariants}
                          className="col-span-2 text-center p-8 bg-muted rounded-lg"
                        >
                          <p className="text-lg font-medium text-gray-600">
                            No registered workshops
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Register for upcoming workshops to see them here
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="recommended">
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {getRecommendedWorkshops().length > 0 ? (
                        getRecommendedWorkshops().map((workshop) => (
                          <motion.div
                            key={workshop.id}
                            variants={workshopCardVariants}
                            whileHover="hover"
                            layout
                            onClick={() => handleWorkshopClick(workshop.id)}
                            className="cursor-pointer"
                          >
                            <Card className="h-full">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle>{workshop.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                      {formatDateTime(workshop.startDate)}
                                    </CardDescription>
                                  </div>
                                  <Badge
                                    className={cn(
                                      getCategoryColor(workshop.category)
                                    )}
                                  >
                                    {workshop.category.charAt(0).toUpperCase() +
                                      workshop.category.slice(1)}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <p className="text-sm mb-3">
                                  {workshop.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(
                                      workshop.startDate,
                                      workshop.endDate
                                    )}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Users className="h-3 w-3" />
                                    {workshop.registeredCount}/
                                    {workshop.capacity} registered
                                  </Badge>
                                </div>
                                <div className="border-t pt-3 mt-2">
                                  <h4 className="font-medium text-sm mb-1">
                                    Speaker
                                  </h4>
                                  <p className="text-sm font-medium">
                                    {workshop.speaker.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-2">
                                    {workshop.speaker.title}
                                  </p>
                                  <p className="text-xs">
                                    {workshop.speaker.bio}
                                  </p>
                                </div>
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="mt-3"
                                >
                                  <AccordionItem value="agenda">
                                    <AccordionTrigger className="text-sm font-medium py-2">
                                      Workshop Agenda
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="text-sm space-y-1">
                                        {workshop.agenda.map((item, index) => (
                                          <li
                                            key={`${workshop.id}-agenda-${index}`}
                                            className="flex items-start gap-2"
                                          >
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </CardContent>
                              <CardFooter className="pt-2">
                                {registeredWorkshops.includes(workshop.id) ? (
                                  <p className="text-sm text-green-600">
                                    Registered
                                  </p>
                                ) : (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegister(workshop.id);
                                    }}
                                    disabled={
                                      workshop.registeredCount >=
                                      workshop.capacity
                                    }
                                  >
                                    {workshop.registeredCount >=
                                    workshop.capacity
                                      ? "Workshop Full"
                                      : "Register Now"}
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          variants={itemVariants}
                          className="col-span-2 text-center p-8 bg-muted rounded-lg"
                        >
                          <p className="text-lg font-medium text-gray-600">
                            No recommended workshops available
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Update your interests in your profile to see
                            recommendations
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="past">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {getPastWorkshops().length > 0 ? (
                    getPastWorkshops().map((workshop) => (
                      <motion.div
                        key={workshop.id}
                        variants={workshopCardVariants}
                        whileHover="hover"
                        layout
                        onClick={() => handleWorkshopClick(workshop.id)}
                        className="cursor-pointer"
                      >
                        <Card className="h-full bg-gray-50">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center">
                                  {workshop.title}
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    Completed
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {formatDateTime(workshop.startDate)}
                                </CardDescription>
                              </div>
                              <Badge
                                className={cn(
                                  getCategoryColor(workshop.category)
                                )}
                              >
                                {workshop.category.charAt(0).toUpperCase() +
                                  workshop.category.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm mb-3">
                              {workshop.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {formatDuration(
                                  workshop.startDate,
                                  workshop.endDate
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {workshop.registeredCount}/{workshop.capacity}{" "}
                                attended
                              </Badge>
                            </div>
                            <div className="border-t pt-3 mt-2">
                              <h4 className="font-medium text-sm mb-1">
                                Speaker
                              </h4>
                              <p className="text-sm font-medium">
                                {workshop.speaker.name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {workshop.speaker.title}
                              </p>
                              <p className="text-xs">{workshop.speaker.bio}</p>
                            </div>
                            {workshop.userRating > 0 && (
                              <div className="mt-3 border-t pt-3">
                                <h4 className="font-medium text-sm mb-1">
                                  Your Rating
                                </h4>
                                <div className="flex items-center gap-2">
                                  {renderStarRating(workshop.userRating)}
                                </div>
                                {workshop.userFeedback && (
                                  <div className="mt-2">
                                    <p className="text-xs italic">
                                      "{workshop.userFeedback}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="pt-2 flex gap-2 flex-wrap">
                            {/* {workshop.hasAttended && ( */}
                            {true && (
                              <Button
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlayingWorkshop(workshop.id);
                                }}
                              >
                                <Play className="h-4 w-4" />
                                Play Recording
                              </Button>
                            )}
                            {/* {workshop.hasAttended && */}
                            {!workshop.certificateIssued && (
                              <Button
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCertificateDialog(workshop);
                                }}
                              >
                                <Award className="h-4 w-4" />
                                Get Certificate
                              </Button>
                            )}
                            {workshop.certificateIssued && (
                              <Button
                                variant="outline"
                                className="flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCertificateDialog(workshop);
                                }}
                              >
                                <Download className="h-4 w-4" />
                                Download Certificate
                              </Button>
                            )}
                            <Button
                              variant={
                                workshop.userRating > 0 ? "outline" : "default"
                              }
                              className="flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRatingDialog(workshop);
                              }}
                            >
                              <Star className="h-4 w-4" />
                              {workshop.userRating > 0
                                ? "Edit Rating"
                                : "Rate Workshop"}
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      className="col-span-2 text-center p-8 bg-muted rounded-lg"
                    >
                      <p className="text-lg font-medium text-gray-600">
                        No past workshops
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Past workshops will appear here
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Rating Dialog */}
        {selectedWorkshop && (
          <Dialog
            open={isRatingDialogOpen}
            onOpenChange={setIsRatingDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Rate Workshop</DialogTitle>
                <DialogDescription>
                  Share your feedback about "{selectedWorkshop.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <p className="text-sm mb-2">
                    How would you rate this workshop?
                  </p>
                  {renderStarRating(currentRating, 5, true)}
                </div>
                <div>
                  <p className="text-sm mb-2">Your feedback (optional)</p>
                  <Textarea
                    placeholder="Share your thoughts about this workshop..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="h-24"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsRatingDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button disabled={currentRating === 0} onClick={submitRating}>
                  Submit Rating
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Certificate Dialog */}
        {selectedWorkshop && (
          <Dialog
            open={isCertificateDialogOpen}
            onOpenChange={setIsCertificateDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Workshop Certificate</DialogTitle>
                <DialogDescription>
                  Certificate of completion for "{selectedWorkshop.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-white p-6 border rounded-lg text-center">
                  <div className="border-4 border-blue-100 p-6 rounded relative bg-gradient-to-r from-blue-50 to-white">
                    <div className="absolute top-2 left-2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      W
                    </div>
                    <h2 className="font-serif text-3xl mb-2 text-blue-800">
                      Certificate of Completion
                    </h2>
                    <div className="border-t border-b border-blue-200 py-6 my-4">
                      <p className="text-sm text-gray-600">
                        This certifies that
                      </p>
                      <p className="font-bold text-xl my-2 text-blue-700">
                        {studentName}
                      </p>
                      <p className="text-sm text-gray-600">
                        has successfully completed
                      </p>
                      <p className="font-bold text-xl my-2 text-blue-600">
                        {selectedWorkshop.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        on{" "}
                        {format(
                          parseISO(selectedWorkshop.endDate),
                          "MMMM d, yyyy"
                        )}
                      </p>
                    </div>
                    <div className="mt-6 pt-4">
                      <p className="text-xs text-gray-500">Presented by</p>
                      <p className="font-medium">
                        {selectedWorkshop.speaker.name}
                      </p>
                      <p className="text-xs">
                        {selectedWorkshop.speaker.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                      Certificate ID: {selectedWorkshop.id}-
                      {Date.now().toString().slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCertificateDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex items-center gap-1"
                  onClick={downloadCertificate}
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>
    </>
  );
}
