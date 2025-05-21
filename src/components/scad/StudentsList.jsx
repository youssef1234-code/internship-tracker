import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  X,
  School,
  Briefcase,
  CheckCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import DataTable from "../common/DataTable";
import { getAllFromStore, getFromStore } from "../../utils/indexedDB-utils";
import { differenceInDays, parseISO, format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const filters = [
  {
    key: "internshipStatus",
    label: "Internship Status",
    options: [
      { label: "Current", value: "current" },
      { label: "Completed", value: "completed" },
      { label: "None", value: "none" },
    ],
  },
];

const getFromIndexedDB = () => getAllFromStore("studentProfiles");

const StudentsList = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [fullProfileOpen, setFullProfileOpen] = useState(false);
  const [studentInternships, setStudentInternships] = useState({
    current: [],
    past: [],
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const allStudents = await getFromIndexedDB();

        const applications = await getAllFromStore("InternshipApplications");

        const enhancedStudents = await Promise.all(
          allStudents.map(async (student) => {
            const hasCurrent = applications.some(
              (app) =>
                Array.isArray(app.applications) &&
                app.applications.some(
                  (a) => a.email === student.email && a.status === "current"
                )
            );

            const hasCompleted =
              applications.some(
                (app) =>
                  Array.isArray(app.applications) &&
                  app.applications.some(
                    (a) => a.email === student.email && a.status === "completed"
                  )
              ) ||
              (student.experiences &&
                student.experiences.some((exp) => exp.type === "internship"));

            let internshipStatus = "none";
            if (hasCurrent) internshipStatus = "current";
            else if (hasCompleted) internshipStatus = "completed";

            return {
              ...student,
              internshipStatus,
            };
          })
        );

        setStudents(enhancedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const columns = [
    {
      header: "FirstName",
      accessor: "firstName",
      sortable: true,
    },
    {
      header: "LastName",
      accessor: "lastName",
      sortable: true,
    },
    {
      header: "Current Semester",
      accessor: "semester",
      sortable: true,
    },
    {
      header: "Major",
      accessor: "major",
      sortable: true,
    },
    {
      header: "Internship Status",
      accessor: "internshipStatus",
      sortable: true,
      render: (student) => {
        if (student.internshipStatus === "current") {
          return (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              Current
            </Badge>
          );
        } else if (student.internshipStatus === "completed") {
          return (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              Completed
            </Badge>
          );
        } else {
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              None
            </Badge>
          );
        }
      },
    },
  ];

  const handleRowClick = async (student) => {
    setDialogOpen(true);
    await isUserPro(student.email).then((isPro) => {
      student.ispro_student = isPro;
      setSelectedStudent(student);
    });
  };

  const handleViewFullProfile = async () => {
    if (!selectedStudent) return;

    try {
      setIsLoading(true);
      setDialogOpen(false);

      const applications = await getAllFromStore("InternshipApplications");

      const currentUserApplications = applications.flatMap((app) =>
        Array.isArray(app.applications)
          ? app.applications
              .filter(
                (a) =>
                  a.email === selectedStudent.email && a.status === "current"
              )
              .map((a) => ({ ...a, id: app.id }))
          : []
      );

      const completedUserApplications = applications.flatMap((app) =>
        Array.isArray(app.applications)
          ? app.applications
              .filter(
                (a) =>
                  a.email === selectedStudent.email && a.status === "completed"
              )
              .map((a) => ({ ...a, id: app.id }))
          : []
      );

      let pastProfileInternships = [];
      if (
        selectedStudent.experiences &&
        Array.isArray(selectedStudent.experiences)
      ) {
        pastProfileInternships = selectedStudent.experiences.filter(
          (exp) => exp.type === "internship"
        );
      }

      const allPastInternships = [
        ...pastProfileInternships,
        ...completedUserApplications,
      ];

      setStudentInternships({
        current: currentUserApplications,
        past: allPastInternships,
      });

      setFullProfileOpen(true);
    } catch (error) {
      console.error("Error fetching internship data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <Card className="w-full">
      <div>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>View Students Data</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={students}
            columns={columns}
            filters={filters}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          ></DataTable>
        </CardContent>
      </div>
      {selectedStudent && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </DialogTitle>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => setDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button> */}
              </div>
              <DialogDescription className="mt-1">
                Student Profile Details
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-2" />

            <div className="py-4 space-y-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">First Name</Label>
                  <p className="font-medium flex items-center gap-2">
                    {selectedStudent.firstName}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Last Name</Label>
                  <p className="font-medium">{selectedStudent.lastName}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <School className="h-3 w-3" />
                      Semester
                    </div>
                  </Label>
                  <p className="font-medium">{selectedStudent.semester}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3" />
                      Major
                    </div>
                  </Label>
                  <p className="font-medium">{selectedStudent.major}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email
                    </div>
                  </Label>
                  <p className="font-medium text-sm break-all">
                    {selectedStudent.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3" />
                      Pro Status
                    </div>
                  </Label>
                  <div>
                    {selectedStudent.ispro_student ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Pro
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                      >
                        Standard
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="mr-2"
              >
                Close
              </Button>
              <Button onClick={handleViewFullProfile}>View Full Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedStudent && (
        <Sheet open={fullProfileOpen} onOpenChange={setFullProfileOpen}>
          <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                {selectedStudent.firstName} {selectedStudent.lastName}'s Profile
              </SheetTitle>
              <SheetDescription>
                Complete student profile information
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="internships">Internships</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-4">
                <div className="p-4 bg-slate-50 rounded-md">
                  <h3 className="text-md font-semibold mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        First Name
                      </Label>
                      <p className="font-medium">{selectedStudent.firstName}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Last Name</Label>
                      <p className="font-medium">{selectedStudent.lastName}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <School className="h-3 w-3" />
                          Semester
                        </div>
                      </Label>
                      <p className="font-medium">{selectedStudent.semester}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3 w-3" />
                          Major
                        </div>
                      </Label>
                      <p className="font-medium">{selectedStudent.major}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Email
                        </div>
                      </Label>
                      <p className="font-medium text-sm break-all">
                        {selectedStudent.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Award className="h-3 w-3" />
                          Pro Status
                        </div>
                      </Label>
                      <div>
                        {selectedStudent.ispro_student ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Pro
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            Standard
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStudent.bio && (
                  <div className="p-4 bg-slate-50 rounded-md">
                    <h3 className="text-md font-semibold mb-2">Bio</h3>
                    <p className="text-gray-700">{selectedStudent.bio}</p>
                  </div>
                )}

                {selectedStudent.interests && (
                  <div className="p-4 bg-slate-50 rounded-md">
                    <h3 className="text-md font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.interests
                        .split(",")
                        .map((interest, index) => (
                          <Badge key={index} variant="outline">
                            {interest.trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="internships" className="mt-4">
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-md">
                    <h3 className="text-md font-semibold mb-4 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Current Internships
                    </h3>

                    {studentInternships.current.length > 0 ? (
                      <div className="divide-y">
                        {studentInternships.current.map((internship, index) => (
                          <div key={index} className="py-3">
                            <div className="font-medium">
                              {internship.position} at{" "}
                              {internship.company?.name}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Started: {formatDate(internship.startDate)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No current internships
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-md">
                    <h3 className="text-md font-semibold mb-4 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Past Internships
                    </h3>

                    {studentInternships.past.length > 0 ? (
                      <div className="divide-y">
                        {studentInternships.past.map((internship, index) => {
                          const title = internship.position || internship.title;
                          const company =
                            internship.company?.name || internship.company;
                          const startDate =
                            internship.startDate || internship.dateFrom;
                          const endDate =
                            internship.endDate ||
                            internship.dateTo ||
                            internship.completionDate;

                          return (
                            <div key={index} className="py-3">
                              <div className="font-medium">
                                {title} at {company}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {formatDate(startDate)} -{" "}
                                  {formatDate(endDate)}
                                </div>
                                {internship.responsibilities && (
                                  <p className="mt-1 text-gray-700">
                                    {internship.responsibilities}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No past internships
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFullProfileOpen(false)}
              >
                Close
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Card>
  );
};

export default StudentsList;
