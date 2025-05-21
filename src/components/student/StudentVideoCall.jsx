import { useState, useEffect } from "react";
import WarningPopup from "@/components/common/WarningPopup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { Button } from "../ui/button.tsx";
import { Calendar } from "../ui/calendar.tsx";
import { Label } from "../ui/label.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { Separator } from "../ui/separator.tsx";
import { Badge } from "../ui/badge.tsx";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  CalendarIcon,
  ScreenShare,
  MessageSquare,
  X,
  Check,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AppointmentVideoApp() {
  // App state
  const [activeTab, setActiveTab] = useState("schedule");
  const [date, setDate] = useState(new Date());
  const [appointmentDetails, setAppointmentDetails] = useState("");
  const [appointmentType, setAppointmentType] = useState("career");
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      date: new Date(date.getTime() + 86400000),
      time: "14:30",
      type: "career",
      details: "Discuss career options in software development",
      status: "pending",
      with: "Prof. Milad Ghantous",
    },
    {
      id: 2,
      date: new Date(date.getTime() + 172800000),
      time: "10:00",
      type: "report",
      details: "Clarify requirements for report evaluation",
      status: "accepted",
      with: "Mr. Ahmed Mohsen",
    },
  ]);

  // Call state
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callParticipant, setCallParticipant] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLeftCall, setIsLeftCall] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({
    "Prof. Milad Ghantous": true,
    "Mr. Ahmed Mohsen": false,
  });

  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState({
    title: "",
    description: "",
    type: "info",
  });
  const [showCallAcceptedPopup, setShowCallAcceptedPopup] = useState(false);
  const [showCallRejectedPopup, setShowCallRejectedPopup] = useState(false);
  const [showCallEndedPopup, setShowCallEndedPopup] = useState(false);
  const [showAppointmentCreatedPopup, setShowAppointmentCreatedPopup] =
    useState(false);

  // Form handling
  const handleSubmitAppointment = () => {
    const newAppointment = {
      id: appointments.length + 1,
      date: date,
      time: Date.now(),
      type: appointmentType,
      details: appointmentDetails,
      status: "pending",
      with:
        appointmentType === "career"
          ? "Prof. Milad Ghantous"
          : "Mr. Ahmed Mohsen",
    };

    setAppointments([...appointments, newAppointment]);
    setNotificationMessage("Appointment request sent successfully!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Appointment handling
  const handleAppointmentAction = (id, action) => {
    const updatedAppointments = appointments.map((appointment) => {
      if (appointment.id === id) {
        return { ...appointment, status: action };
      }
      return appointment;
    });

    setAppointments(updatedAppointments);

    if (action === "accepted") {
      setNotificationMessage(`Appointment #${id} has been accepted!`);
    } else {
      setNotificationMessage(`Appointment #${id} has been rejected!`);
    }

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Call simulation
  useEffect(() => {
    // Simulate incoming call after 5 seconds
    const timer =
      !inCall && !incomingCall
        ? setTimeout(() => {
          const caller = "Prof. Milad Ghantous";
          setIncomingCall({
            name: caller,
            type: "video",
          });
        }, 5000)
        : null;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeTab, inCall, incomingCall]);

  // Call handling
  const handleAcceptCall = () => {
    setInCall(true);
    setCallParticipant(incomingCall.name);
    setIncomingCall(null);
    setNotificationMessage("Call accepted");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setTimeout(() => {
      setIsLeftCall(false);
      const name = incomingCall.name;
      setNotificationMessage(`${name} has left the call`);
      setShowNotification(true);
    }, 15000)
    setTimeout(() => { setShowNotification(false); }, 18000);
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
    setNotificationMessage("Call rejected");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleEndCall = () => {
    setInCall(false);
    setCallParticipant(null);
    setVideoEnabled(true);
    setMicEnabled(true);
    setScreenSharing(false);
    setNotificationMessage("Call ended");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setIsLeftCall(true);
  };

  const initiateCall = (person) => {
    if (onlineUsers[person]) {
      setInCall(true);
      setCallParticipant(person);
      setTimeout(() => {
        setIsLeftCall(false);
        setNotificationMessage(person + "has left the call");
        setShowNotification(true);
      }, 15000)
      setTimeout(() => { setShowNotification(false); }, 18000);
    } else {
      setNotificationMessage(`${person} is currently offline`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const toggleOnlineStatus = (user) => {
    setOnlineUsers({
      ...onlineUsers,
      [user]: !onlineUsers[user],
    });
  };

  // Generate time slots for the form
  const timeSlots = [];
  for (let i = 9; i <= 17; i++) {
    ["00", "30"].forEach((minutes) => {
      timeSlots.push(`${i}:${minutes}`);
    });
  }

  return (
    <div>
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md z-50">
          {notificationMessage}
        </div>
      )}

      {/* Main interface */}
      {!inCall && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          {/* Schedule tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request New Appointment</CardTitle>
                <CardDescription>
                  Schedule a video call for career guidance or report
                  clarifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Appointment Type</Label>
                  <div className="flex gap-4 mt-2">
                    <Button
                      variant={
                        appointmentType === "career" ? "default" : "outline"
                      }
                      onClick={() => setAppointmentType("career")}
                      className="flex gap-2"
                    >
                      <UserCheck size={16} />
                      Career Guidance
                    </Button>
                    <Button
                      variant={
                        appointmentType === "report" ? "default" : "outline"
                      }
                      onClick={() => setAppointmentType("report")}
                      className="flex gap-2"
                    >
                      <MessageSquare size={16} />
                      Report Clarification
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="flex flex-col max-w-[350px]">
                    <Label htmlFor="date">Date</Label>
                    <div className="flex justify-center mt-2 border rounded-md p-2">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < new Date()}
                        className="w-auto"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Select
                        value={selectedTime}
                        onValueChange={setSelectedTime}
                      >
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="details">Details</Label>
                      <Textarea
                        id="details"
                        placeholder="Please provide details about your appointment request"
                        className="mt-2"
                        value={appointmentDetails}
                        onChange={(e) => setAppointmentDetails(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSubmitAppointment}>
                  Request Appointment
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Appointments tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Appointments</CardTitle>
                <CardDescription>
                  Manage your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p>No appointments scheduled</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              Appointment with {appointment.with}
                            </CardTitle>
                            <Badge
                              className={
                                appointment.status === "accepted"
                                  ? "bg-green-500"
                                  : appointment.status === "rejected"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }
                            >
                              {appointment.status.charAt(0).toUpperCase() +
                                appointment.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <CalendarIcon size={14} />
                            {appointment.date.toLocaleDateString()} at{" "}
                            {appointment.time}
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <p>
                            <strong>Type:</strong>{" "}
                            {appointment.type === "career"
                              ? "Career Guidance"
                              : "Report Clarification"}
                          </p>
                          <p className="mt-1">
                            <strong>Details:</strong> {appointment.details}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <div className="flex items-center">
                            <div className="mr-2 flex items-center">
                              <div
                                className={`w-2 h-2 rounded-full mr-1 ${onlineUsers[appointment.with]
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                                  }`}
                              ></div>
                              <span className="text-sm">
                                {onlineUsers[appointment.with]
                                  ? "Online"
                                  : "Offline"}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {appointment.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment.id,
                                      "accepted"
                                    )
                                  }
                                  className="flex items-center gap-1"
                                >
                                  <Check size={14} />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAppointmentAction(
                                      appointment.id,
                                      "rejected"
                                    )
                                  }
                                  className="flex items-center gap-1 text-red-500"
                                >
                                  <X size={14} />
                                  Reject
                                </Button>
                              </>
                            )}

                            {appointment.status === "accepted" &&
                              onlineUsers[appointment.with] && (
                                <Button
                                  size="sm"
                                  onClick={() => initiateCall(appointment.with)}
                                  className="flex items-center gap-1"
                                >
                                  <Phone size={14} />
                                  Call Now
                                </Button>
                              )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      )}

      {/* Incoming call dialog */}
      <AlertDialog open={!!incomingCall}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Incoming Call</AlertDialogTitle>
            <AlertDialogDescription>
              {incomingCall?.name} is calling you
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex w-full justify-between">
              <AlertDialogCancel
                onClick={handleRejectCall}
                className="bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Decline
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAcceptCall}
                className="bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700"
              >
                <Phone className="mr-2 h-4 w-4" />
                Accept
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active call modal */}
      {inCall && (
        <Card className="w-full max-w-full mx-auto">
          <CardHeader>
            <CardTitle>Call with {callParticipant}</CardTitle>
            <CardDescription>
              Connected {/*Math.floor(Math.random() * 5) + 1*/}1m ago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative bg-slate-800 rounded-md aspect-video flex items-center justify-center">
                {videoEnabled ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center text-white">
                    Your video
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <UserX size={48} />
                    <p className="mt-2">Video off</p>
                  </div>
                )}
              </div>

              {isLeftCall &&
                (<div className="relative bg-slate-900 rounded-md aspect-video flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 rounded-md flex items-center justify-center text-white">
                    {callParticipant}
                  </div>
                </div>)}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${!videoEnabled ? "bg-red-100 text-red-600" : ""
                  }`}
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${!micEnabled ? "bg-red-100 text-red-600" : ""
                  }`}
                onClick={() => setMicEnabled(!micEnabled)}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${screenSharing ? "bg-blue-100 text-blue-600" : ""
                  }`}
                onClick={() => setScreenSharing(!screenSharing)}
              >
                <ScreenShare size={20} />
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff size={20} />
              </Button>
            </div>

            {screenSharing && (
              <div className="mt-4 p-4 border border-dashed rounded-md bg-slate-50 text-center">
                <p className="text-sm text-slate-500">Screen sharing active</p>
                <p className="text-xs text-slate-400">
                  You are sharing your screen
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

