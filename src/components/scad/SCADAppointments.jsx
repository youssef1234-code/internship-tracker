import { useState, useEffect } from "react";
import WarningPopup from "@/components/common/WarningPopup";
import {
  getFromStore,
  saveToStore,
  getAllFromStore,
} from "../../utils/indexedDB-utils";
import { addNotification } from "../../utils/notification-utils";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  ScreenShare,
  User,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  VideoOff,
  MessageSquare,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// Import table components from shadcn
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { differenceInDays, parseISO } from "date-fns";

export default function ScadAppointments() {
  const [activeTab, setActiveTab] = useState("schedule");
  const [date, setDate] = useState(new Date());
  const [appointmentDetails, setAppointmentDetails] = useState("");
  const [appointmentType, setAppointmentType] = useState("Career Guidance");
  const [appointmentName, setAppointmentName] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const timeSlots = [];
  for (let i = 9; i <= 17; i++) {
    ["00", "30"].forEach((minutes) => {
      timeSlots.push(`${i}:${minutes}`);
    });
  }
  // State for managing calls and appointments
  const [activeCall, setActiveCall] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isLeftCall, setIsLeftCall] = useState(true);
  const [appointments, setAppointments] = useState([]);

  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState({
    title: "",
    description: "",
    type: "info",
  });
  const [showCallAcceptedPopup, setShowCallAcceptedPopup] = useState(false);
  const [showCallRejectedPopup, setShowCallRejectedPopup] = useState(false);
  const [showCallEndedPopup, setShowCallEndedPopup] = useState(false);
  const [showCreatedAppointment, setCreatedAppointment] = useState(false);
  const [showAppointmentAcceptedPopup, setShowAppointmentAcceptedPopup] =
    useState(false);

  const user_type = localStorage.getItem("userType");
  const email = localStorage.getItem("email");
  const [student, setStudent] = useState(null);
  const displayStore =
    user_type == "scad_office" ? "scadAppointments" : "studentAppointments";
  const sendingStore =
    user_type == "scad_office" ? "studentAppointments" : "scadAppointments";

  useEffect(() => {
    const loadData = async () => {
      const appoint = await getAllFromStore(displayStore);
      console.log(appoint);
      setAppointments(appoint);
      const curr_student = await getFromStore("studentProfiles", email);
      setStudent(curr_student);
    };
    loadData();
  }, []);

  // Simulated incoming call
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeCall && !incomingCall) {
        setIncomingCall({
          name:
            user_type == "scad_office"
              ? "Yousef Mohamed"
              : "Ms. Nourhan Abdelfattah",
        });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeCall, incomingCall]);

  // Functions for call management
  const handleAcceptCall = () => {
    if (incomingCall) {
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setShowCallAcceptedPopup(true);
      setTimeout(() => {
        setIsLeftCall(false);
        const name = incomingCall.name;
        setWarningMessage({
          title: "Call Update",
          description: `${name} has left the call`,
          type: "info",
        });
        setShowWarningPopup(true);
      }, 15000);
    }
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
    setShowCallRejectedPopup(true);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setIsVideoEnabled(true);
    setIsMicEnabled(true);
    setIsScreenSharing(false);
    setShowCallEndedPopup(true);
    setIsLeftCall(true);
  };

  // Functions for appointment management
  const [cnt, setCnt] = useState(0);
  const [identity, setIdentity] = useState(3);
  const handleSubmitAppointment = async () => {
    if (selectedTime === "") {
      setWarningMessage({
        title: "Invalid input",
        description: "Please select a timeslot",
        type: "warning",
      });
      setShowWarningPopup(true);
      return;
    } else if (user_type === "scad_office" && appointmentName === "") {
      setWarningMessage({
        title: "Invalid input",
        description: "Please enter email of the student",
        type: "warning",
      });
      setShowWarningPopup(true);
      return;
    }
    const scadMembers = [
      "Mr. Mohamed Shebl",
      "Ms. Nour Maarouf",
      "Mr. Haytham Elmahdy",
    ];
    const name =
      user_type === "scad_office"
        ? scadMembers[cnt]
        : student.firstName.concat(" ").concat(student.lastName);
    setCnt(cnt === 2 ? 0 : cnt + 1);

    const new_appointment = {
      id: identity,
      name: name,
      email: user_type == "scad_office" ? "" : email,
      purpose: appointmentType,
      date: new Date(date.toDateString().concat(" ").concat(selectedTime)),
      status: "pending",
      online: true,
      directedTo: user_type === "scad_office" ? appointmentName : "",
    };
    if (user_type == "scad_office") {
      const user = await getFromStore("studentProfiles", appointmentName);
      if (!user) {
        setWarningMessage({
          title: "Student not found",
          description: "No Student found with this email",
          type: "error",
        });
        setShowWarningPopup(true);
        return;
      }
      const isPro = await isUserPro(appointmentName);
      if (!isPro) {
        setWarningMessage({
          title: "NOT PRO!",
          description: "Student is not a PRO student",
          type: "error",
        });
        setShowWarningPopup(true);
        return;
      }
    }
    setIdentity(identity + 1);
    setCreatedAppointment(true);
    saveToStore(sendingStore, new_appointment);
  };

  const handleAcceptAppointment = (appointmentId) => {
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: "accepted" }
          : appointment
      )
    );

    const curr_appointment = appointments.find(
      (appointment) => appointment.id === appointmentId
    );
    const new_appointment = { ...curr_appointment, status: "accepted" };
    if (user_type == "scad_office") {
      if (curr_appointment && curr_appointment.email) {
        const notification = {
          message: "Your appointment has been accepted",
          email: curr_appointment.email,
        };
        addNotification(notification);
      }
    } else {
      if (curr_appointment) {
        const notification = {
          message: "Your appointment has been accepted",
          global: true,
          userRole: "scad_office",
        };
        addNotification(notification);
      }
    }
    saveToStore(displayStore, new_appointment);
    setShowAppointmentAcceptedPopup(true);
  };

  const isUserPro = async (email) => {
    try {
      const profileResult = await getFromStore("studentProfiles", email);
      let totalDurationInDays = 0;

      if (profileResult && profileResult.experiences) {
        const pastProfileInternships = profileResult.experiences.filter(
          (i) => i.type === "internship"
        );

        pastProfileInternships.forEach((experience) => {
          const dateFrom = experience.dateFrom
            ? parseISO(experience.dateFrom)
            : null;
          const dateTo = experience.dateTo ? parseISO(experience.dateTo) : null;

          if (dateFrom && dateTo) {
            const durationInDays = differenceInDays(dateTo, dateFrom);
            totalDurationInDays += Math.max(0, durationInDays);
          }
        });
      }

      const applications = await getAllFromStore("InternshipApplications");

      const completedUserApplications = applications.flatMap((app) =>
        Array.isArray(app.applications)
          ? app.applications
              .filter((a) => a.email === email && a.status === "completed")
              .map((a) => ({ ...a, id: app.id }))
          : []
      );

      completedUserApplications.forEach((application) => {
        const startDate = application.startDate
          ? parseISO(application.startDate)
          : null;
        const endDate = application.endDate
          ? parseISO(application.endDate)
          : null;

        const completionDate = application.completionDate
          ? parseISO(application.completionDate)
          : null;

        if (startDate && (endDate || completionDate)) {
          const finalEndDate = endDate || completionDate;
          const durationInDays = differenceInDays(finalEndDate, startDate);
          totalDurationInDays += Math.max(0, durationInDays);
        }
      });

      console.log(
        "Total internship duration in days (incl. completed applications):",
        totalDurationInDays
      );
      return totalDurationInDays >= 90;
    } catch (error) {
      console.error("Error checking pro status:", error);
      return false;
    }
  };

  const handleRejectAppointment = (appointmentId) => {
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: "rejected" }
          : appointment
      )
    );
    const curr_appointment = appointments.find(
      (appointment) => appointment.id === appointmentId
    );
    const new_appointment = { ...curr_appointment, status: "rejected" };
    if (user_type == "scad_office") {
      if (curr_appointment && curr_appointment.email) {
        const notification = {
          message: "Your appointment has been rejected",
          email: curr_appointment.email,
        };
        addNotification(notification);
      }
    } else {
      if (curr_appointment) {
        const notification = {
          message: "Your appointment has been rejected",
          global: true,
          userRole: "scad_office",
        };
        addNotification(notification);
      }
    }
    saveToStore(displayStore, new_appointment);
  };

  const initiateCall = (appointment) => {
    const student = appointment.name;
    if (student) {
      setActiveCall({
        name: student,
      });
      setTimeout(() => {
        setIsLeftCall(false);
        setWarningMessage({
          title: "Call Update",
          description: `${student} has left the call`,
          type: "info",
        });
        setShowWarningPopup(true);
      }, 15000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showWarningPopup && (
        <WarningPopup
          title={warningMessage.title}
          description={warningMessage.description}
          type={warningMessage.type}
          onClose={() => setShowWarningPopup(false)}
        />
      )}

      {showCallAcceptedPopup && (
        <WarningPopup
          title="Call Accepted"
          description="Call accepted"
          type="success"
          onClose={() => setShowCallAcceptedPopup(false)}
        />
      )}

      {showCallRejectedPopup && (
        <WarningPopup
          title="Call Rejected"
          description="Call rejected"
          type="info"
          onClose={() => setShowCallRejectedPopup(false)}
        />
      )}

      {showCallEndedPopup && (
        <WarningPopup
          title="Call Ended"
          description="Call ended"
          type="info"
          onClose={() => setShowCallEndedPopup(false)}
        />
      )}

      {showAppointmentAcceptedPopup && (
        <WarningPopup
          title="Appointment Accepted"
          description="You accepted an appointment"
          type="success"
          onClose={() => setShowAppointmentAcceptedPopup(false)}
        />
      )}

      {showCreatedAppointment && (
        <WarningPopup
          title="Appointment Created"
          description="You created an appointment"
          type="success"
          onClose={() => setCreatedAppointment(false)}
        />
      )}

      {/* Main Content */}
      {!activeCall && (
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 gap-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                            appointmentType === "Career Guidance"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setAppointmentType("Career Guidance")}
                          className="flex gap-2"
                        >
                          <UserCheck size={16} />
                          Career Guidance
                        </Button>
                        <Button
                          variant={
                            appointmentType === "Report Clarification"
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setAppointmentType("Report Clarification")
                          }
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
                        {user_type == "scad_office" && (
                          <div>
                            <Label htmlFor="name">
                              Email<span className="text-red-500">*</span>
                            </Label>
                            <Input
                              required={true}
                              id="name"
                              placeholder="Please enter Email of the student to schedule appointment with"
                              className="mt-2"
                              value={appointmentName}
                              onChange={(e) =>
                                setAppointmentName(e.target.value)
                              }
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="time">
                            Time<span className="text-red-500">*</span>
                          </Label>
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
                            onChange={(e) =>
                              setAppointmentDetails(e.target.value)
                            }
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
                    <CardTitle className="text-2xl font-bold">
                      Appointment Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appointments
                      .filter(
                        (a) =>
                          a.status === "pending" &&
                          ((user_type === "pro_student" &&
                            (a.directedTo === " " || a.directedTo === email)) ||
                            user_type === "scad_office")
                      )
                      .map((appointment) => (
                        <Card key={appointment.id} className="mb-4">
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex flex-col">
                              <CardTitle className="text-lg">
                                {appointment.name}
                                {appointment.online ? (
                                  <span className="ml-2 inline-block">
                                    <Badge>Online</Badge>
                                  </span>
                                ) : (
                                  <span className="ml-2 inline-block">
                                    <Badge>Offline</Badge>
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription className="text-gray-500">
                                {appointment.purpose}
                              </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRejectAppointment(appointment.id)
                                }
                              >
                                <XCircle size={16} className="mr-1" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcceptAppointment(appointment.id)
                                }
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Accept
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock size={16} className="mr-1" />
                              {appointment.date.toDateString()} at{" "}
                              {appointment.date.toLocaleTimeString("en-US")}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      Upcoming Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments
                          .filter((a) => a.status === "accepted")
                          .map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src="/api/placeholder/32/32" />
                                    <AvatarFallback>
                                      {appointment.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {appointment.name}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{appointment.purpose}</TableCell>
                              <TableCell>
                                {appointment.date.toDateString()} at{" "}
                                {appointment.date.toLocaleTimeString("en-US")}
                              </TableCell>
                              <TableCell>
                                <Badge>
                                  {appointment.online ? "Online" : "Offline"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => initiateCall(appointment)}
                                  disabled={
                                    !appointment.online ||
                                    appointment.date > new Date()
                                  }
                                >
                                  <Video size={16} className="mr-1" />
                                  Call Now
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      )}

      {/* Video Call Dialog */}
      {activeCall && (
        <Card className="w-full max-w-full mx-auto">
          <CardHeader>
            <CardTitle>Call with {activeCall.name}</CardTitle>
            <CardDescription>
              Connected {Math.floor(Math.random() * 5) + 1}m ago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative bg-slate-800 rounded-md aspect-video flex items-center justify-center">
                {isVideoEnabled ? (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center text-white">
                    Your video
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <User size={48} />
                    <p className="mt-2">Video off</p>
                  </div>
                )}
              </div>

              {isLeftCall && (
                <div className="relative bg-slate-900 rounded-md aspect-video flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 rounded-md flex items-center justify-center text-white">
                    {activeCall.name}
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${
                  !isVideoEnabled ? "bg-red-100 text-red-600" : ""
                }`}
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${
                  !isMicEnabled ? "bg-red-100 text-red-600" : ""
                }`}
                onClick={() => setIsMicEnabled(!isMicEnabled)}
              >
                {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={`rounded-full ${
                  isScreenSharing ? "bg-blue-100 text-blue-600" : ""
                }`}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
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

            {isScreenSharing && (
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

      {/* Incoming Call Dialog */}
      {incomingCall && (
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
      )}
    </div>
  );
}
