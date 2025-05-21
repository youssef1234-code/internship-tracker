import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building,
  Calendar,
  DollarSign,
  Tag,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  Book,
  School,
  Download,
  User,
  Award,
  CheckCircle,
  X,
  AlertCircle,
  Clock,
  Briefcase,
  GraduationCap,
  FileText,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import DataTable from "@/components/common/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import WarningPopup from "@/components/common/WarningPopup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAllFromStore,
  getFromStore,
  saveToStore,
} from "../../utils/indexedDB-utils";

const getAllApplications = () => getAllFromStore("InternshipApplications");

// Function to track company views of a student profile
const recordCompanyView = async (studentEmail, companyName) => {
  try {
    if (!studentEmail || !companyName) return;

    // Get existing company views for this student
    let companyViews = await getFromStore("companyViews", studentEmail);

    // If no record exists yet, create a new one
    if (!companyViews) {
      companyViews = {
        email: studentEmail,
        views: [],
      };
    }

    // Check if this company has already viewed the profile
    const existingViewIndex = companyViews.views.findIndex(
      (v) => v.companyName === companyName
    );

    if (existingViewIndex >= 0) {
      // Update the timestamp if company already viewed
      companyViews.views[existingViewIndex].lastViewed =
        new Date().toISOString();
      companyViews.views[existingViewIndex].viewCount += 1;
    } else {
      // Add new company view
      companyViews.views.push({
        companyName: companyName,
        firstViewed: new Date().toISOString(),
        lastViewed: new Date().toISOString(),
        viewCount: 1,
      });
    }

    // Save updated views to IndexedDB
    await saveToStore("companyViews", companyViews);
  } catch (error) {
    console.error("Error recording company view:", error);
  }
};

export default function CompanyApplicationView() {
  const { id } = useParams(); // This will be the applicant's email
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [applicant, setApplicant] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [showStatusUpdatePopup, setShowStatusUpdatePopup] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [statusAction, setStatusAction] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        setIsLoading(true);

        if (!id) {
          console.error("No applicant ID provided");
          setIsLoading(false);
          return;
        }

        // Get the current user's company name
        const companyName = localStorage.getItem("companyName");
        if (!companyName) {
          console.error("No company name found in localStorage");
          setIsLoading(false);
          return;
        }

        // Record this company's view of the student profile
        await recordCompanyView(id, companyName);

        // Get all internship applications
        const allApplicationSets = await getAllApplications();

        // Find the application matching this applicant's email and company
        let foundApplicant = null;
        let foundId = null;

        for (const applicationSet of allApplicationSets) {
          if (Array.isArray(applicationSet.applications)) {
            const matchingApp = applicationSet.applications.find(
              (app) => app.email === id && app.company?.name === companyName
            );

            if (matchingApp) {
              foundApplicant = {
                ...matchingApp,
                internshipId: applicationSet.id,
              };
              foundId = applicationSet.id;
              break;
            }
          }
        }

        if (foundApplicant) {
          // Get full student profile for additional information
          try {
            const studentProfile = await getFromStore("studentProfiles", id);
            if (studentProfile) {
              // Merge additional information from student profile if not already present
              foundApplicant = {
                ...foundApplicant,
                name: foundApplicant.name || studentProfile.name,
                university:
                  foundApplicant.university || studentProfile.university,
                major: foundApplicant.major || studentProfile.major,
                gpa: foundApplicant.gpa || studentProfile.gpa,
                graduationYear:
                  foundApplicant.graduationYear ||
                  studentProfile.graduationYear,
                phoneNumber:
                  foundApplicant.phoneNumber || studentProfile.phoneNumber,
                bio: studentProfile.bio || "",
                skills: studentProfile.skills || [],
                experiences: studentProfile.experiences || [],
                currentSemester: studentProfile.currentSemester || "",
              };
            }
          } catch (error) {
            console.error("Error fetching student profile:", error);
          }

          setApplicant(foundApplicant);
          setApplicationId(foundId);
        }
      } catch (error) {
        console.error("Error fetching application data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicantData();
  }, [id]);

  // Function to handle document download
  const handleDocumentDownload = (doc) => {
    if (!doc || !doc.base64) {
      console.error("No document data available");
      return;
    }

    try {
      // Create an anchor element and simulate click to download
      const link = window.document.createElement("a");
      link.href = doc.base64;
      link.download = doc.name || "document";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      // Get current applications data
      const currentApplications = await getFromStore(
        "InternshipApplications",
        applicationId
      );

      if (
        !currentApplications ||
        !Array.isArray(currentApplications.applications)
      ) {
        throw new Error("No applications found");
      }

      // Update the status for this specific applicant
      const updatedApplications = currentApplications.applications.map(
        (app) => {
          if (app.email === id) {
            return {
              ...app,
              status,
              statusUpdatedDate: new Date().toISOString(),
            };
          }
          return app;
        }
      );

      // Save back to IndexedDB
      await saveToStore("InternshipApplications", {
        ...currentApplications,
        applications: updatedApplications,
      });

      // Update local state
      setApplicant({
        ...applicant,
        status,
        statusUpdatedDate: new Date().toISOString(),
      });

      // Show success message
      setStatusUpdateMessage(`Applicant status has been updated to ${status}`);
      setShowStatusUpdatePopup(true);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const confirmStatusChange = (action) => {
    let status = "";
    let actionDescription = "";

    switch (action) {
      case "finalize":
        status = "finalized";
        actionDescription = "Finalize";
        break;
      case "accept":
        status = "accepted";
        actionDescription = "Accept";
        break;
      case "reject":
        status = "rejected";
        actionDescription = "Reject";
        break;
      case "current":
        status = "current";
        actionDescription = "mark as Current Intern";
        break;
      case "complete":
        status = "completed";
        actionDescription = "mark as Completed";
        break;
      default:
        status = "pending";
        actionDescription = "Reset to Pending";
    }

    setNewStatus(status);
    setStatusAction(actionDescription);
    setShowConfirmDialog(true);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.98, 1.02, 0.98],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
              >
                <p>Loading applicant details...</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!applicant) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-lg font-semibold mb-4">Applicant not found</p>
              <Button onClick={() => navigate("/company/applications")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      {showStatusUpdatePopup && (
        <WarningPopup
          title="Status Updated"
          description={statusUpdateMessage}
          type="success"
          onClose={() => setShowStatusUpdatePopup(false)}
        />
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to {statusAction.toLowerCase()} this
              applicant?
              {newStatus === "rejected" && (
                <p className="mt-2 text-red-500">
                  This action will remove the applicant from consideration.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={newStatus === "rejected" ? "destructive" : "default"}
              onClick={() => handleStatusUpdate(newStatus)}
            >
              {statusAction}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/company/applications")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  {applicant.name || applicant.email}
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Mail className="mr-2 h-4 w-4" />
                  {applicant.email}
                </CardDescription>
              </div>
              <Badge
                variant={
                  applicant.status === "pending"
                    ? "warning"
                    : applicant.status === "finalized"
                    ? "secondary"
                    : applicant.status === "accepted" ||
                      applicant.status === "current"
                    ? "success"
                    : applicant.status === "completed"
                    ? "default"
                    : "destructive"
                }
                className="text-sm px-3 py-1"
              >
                {applicant.status === "current"
                  ? "Current Intern"
                  : applicant.status === "completed"
                  ? "Completed"
                  : applicant.status}
              </Badge>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">
                    {applicant.position || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Applied Date</p>
                  <p className="font-medium">
                    {applicant.appliedDate
                      ? new Date(applicant.appliedDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Not recorded"}
                  </p>
                </div>
              </div>

              {applicant.major && (
                <div className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Major</p>
                    <p className="font-medium">{applicant.major}</p>
                  </div>
                </div>
              )}

              {applicant.university && (
                <div className="flex items-center">
                  <School className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">University</p>
                    <p className="font-medium">{applicant.university}</p>
                  </div>
                </div>
              )}

              {applicant.gpa && (
                <div className="flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">GPA</p>
                    <p className="font-medium">{applicant.gpa}</p>
                  </div>
                </div>
              )}

              {applicant.graduationYear && (
                <div className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Graduation Year
                    </p>
                    <p className="font-medium">{applicant.graduationYear}</p>
                  </div>
                </div>
              )}

              {applicant.phoneNumber && (
                <div className="flex items-center">
                  <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{applicant.phoneNumber}</p>
                  </div>
                </div>
              )}

              {applicant.currentSemester && (
                <div className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Semester
                    </p>
                    <p className="font-medium">{applicant.currentSemester}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Applicant Bio */}
            {applicant.bio && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">About the Applicant</h3>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm">{applicant.bio}</p>
                </div>
              </div>
            )}

            {/* Skills Section */}
            {applicant.skills && applicant.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(applicant.skills)
                    ? applicant.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-muted px-3 py-1 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))
                    : typeof applicant.skills === "string" &&
                      applicant.skills.split(",").map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-muted px-3 py-1 rounded-full text-xs"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                </div>
              </div>
            )}

            {/* Documents section - now with download functionality */}
            {applicant.documents && applicant.documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Documents</h3>
                <div className="space-y-2">
                  {applicant.documents.map((doc, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleDocumentDownload(doc)}
                    >
                      <span className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {doc.name || `Document ${idx + 1}`}
                        {doc.size && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({(doc.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </span>
                      <Download className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {applicant.experiences && applicant.experiences.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Experience</h3>
                <div className="space-y-4">
                  {applicant.experiences.map((exp, idx) => (
                    <div key={idx} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {exp.title || "Position"}
                        </h4>
                        <Badge variant="outline">
                          {exp.type || "Experience"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exp.company || exp.organization || "Organization"}
                      </p>
                      {(exp.dateFrom || exp.dateTo) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.dateFrom &&
                            new Date(exp.dateFrom).toLocaleDateString()}
                          {exp.dateTo &&
                            ` - ${new Date(exp.dateTo).toLocaleDateString()}`}
                        </p>
                      )}
                      {exp.responsibilities && (
                        <p className="text-sm mt-2">{exp.responsibilities}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes or additional information */}
            {applicant.notes && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Additional Notes</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">{applicant.notes}</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-wrap gap-3 justify-end border-t pt-6">
            {/* Status action buttons - vary based on current status */}
            {applicant.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => confirmStatusChange("reject")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => confirmStatusChange("finalize")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Finalize
                </Button>
                <Button onClick={() => confirmStatusChange("accept")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </>
            )}

            {applicant.status === "finalized" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => confirmStatusChange("reject")}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => confirmStatusChange("accept")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </>
            )}

            {applicant.status === "accepted" && (
              <>
                <Button onClick={() => confirmStatusChange("current")}>
                  <Award className="mr-2 h-4 w-4" />
                  Start Internship
                </Button>
              </>
            )}

            {applicant.status === "current" && (
              <>
                <Button onClick={() => confirmStatusChange("complete")}>
                  <Award className="mr-2 h-4 w-4" />
                  Complete Internship
                </Button>
              </>
            )}

            {applicant.status === "completed" && (
              <Button
                variant="outline"
                onClick={() => navigate(`/company/interns/${applicant.email}`)}
              >
                <User className="mr-2 h-4 w-4" />
                View Full Intern Profile
              </Button>
            )}

            {applicant.status === "rejected" && (
              <Button
                variant="outline"
                onClick={() => confirmStatusChange("pending")}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Reconsider Applicant
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}
