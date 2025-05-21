import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  Building,
  Star,
  Briefcase,
  FileText,
  Download,
  Book,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { Button } from "../ui/button.tsx";
import { Badge } from "../ui/badge.tsx";
import { Separator } from "../ui/separator.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { Label } from "../ui/label.tsx";
import WarningPopup from "@/components/common/WarningPopup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.tsx";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
} from "../../utils/indexedDB-utils";

// Define motion variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const listItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export default function InternDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [intern, setIntern] = useState(location.state?.intern || null);
  const [internshipId, setInternshipId] = useState(
    location.state?.internshipId || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchInternData = async () => {
      try {
        if (intern) {
          setIsLoading(false);
          return;
        }

        // If no state was passed, fetch the intern data using the ID from URL
        if (!id) {
          setIsLoading(false);
          return;
        }

        // Fetch from IndexedDB
        const applications = await getAllFromStore("InternshipApplications");
        let foundIntern = null;
        let foundInternshipId = null;

        for (const appSet of applications) {
          if (Array.isArray(appSet.applications)) {
            const match = appSet.applications.find((app) => app.email === id);
            if (match) {
              foundIntern = match;
              foundInternshipId = appSet.id;
              break;
            }
          }
        }

        if (foundIntern) {
          setIntern(foundIntern);
          setInternshipId(foundInternshipId);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching intern data:", error);
        setIsLoading(false);
      }
    };

    fetchInternData();
  }, [id, intern]);

  const handleStatusChange = async (status) => {
    try {
      // Get the current applications
      const appData = await getFromStore(
        "InternshipApplications",
        internshipId
      );

      if (!appData || !Array.isArray(appData.applications)) {
        throw new Error("No applications data found");
      }

      // Update the status for this intern
      const updatedApplications = appData.applications.map((app) =>
        app.email === intern.email ? { ...app, status } : app
      );

      // Save back to IndexedDB
      await saveToStore("InternshipApplications", {
        ...appData,
        applications: updatedApplications,
      });

      // Update the local state
      setIntern({ ...intern, status });

      // Show success message
      setSuccessMessage(`Intern status has been updated to ${status}.`);
      setShowSuccess(true);
      setShowStatusDialog(false);
    } catch (error) {
      console.error("Error updating intern status:", error);
    }
  };

  const handleSaveFeedback = async () => {
    try {
      // Get the current applications
      const appData = await getFromStore(
        "InternshipApplications",
        internshipId
      );

      if (!appData || !Array.isArray(appData.applications)) {
        throw new Error("No applications data found");
      }

      // Update the feedback for this intern
      const updatedApplications = appData.applications.map((app) =>
        app.email === intern.email ? { ...app, feedback } : app
      );

      // Save back to IndexedDB
      await saveToStore("InternshipApplications", {
        ...appData,
        applications: updatedApplications,
      });

      // Update the local state
      setIntern({ ...intern, feedback });

      // Show success message
      setSuccessMessage("Feedback has been saved successfully.");
      setShowSuccess(true);
      setShowFeedbackDialog(false);
    } catch (error) {
      console.error("Error saving feedback:", error);
    }
  };

  // Handle document download
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!intern) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg font-semibold mb-4">Intern not found</p>
            <Button onClick={() => navigate("/company/interns")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Interns List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showSuccess && (
        <WarningPopup
          title="Success"
          description={successMessage}
          type="success"
          onClose={() => setShowSuccess(false)}
        />
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-6 max-w-3xl mx-auto"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/company/interns")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Interns List
        </Button>

        <Card
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {intern.name || intern.email.split("@")[0]}
                  <Badge
                    className="ml-3"
                    variant={
                      intern.status === "completed"
                        ? "success"
                        : intern.status === "current"
                        ? "default"
                        : "warning"
                    }
                  >
                    {intern.status === "accepted"
                      ? "Ready to Start"
                      : intern.status}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Mail className="mr-1 h-4 w-4" />
                  {intern.email}
                </CardDescription>
              </div>

              <div className="flex gap-2">
                {intern.status === "completed" && !intern.evaluation && (
                  <Button
                    variant="default"
                    onClick={() =>
                      navigate(`/company/evaluate/${intern.email}`)
                    }
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Evaluate Intern
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setNewStatus(
                      intern.status === "accepted"
                        ? "current"
                        : intern.status === "current"
                        ? "completed"
                        : "current"
                    );
                    setShowStatusDialog(true);
                  }}
                >
                  {intern.status === "accepted"
                    ? "Start Internship"
                    : intern.status === "current"
                    ? "Mark as Completed"
                    : "Reactivate"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">
                    {intern.position || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {intern.startDate
                      ? format(new Date(intern.startDate), "MMM dd, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Application Date
                  </p>
                  <p className="font-medium">
                    {intern.appliedDate
                      ? format(new Date(intern.appliedDate), "MMM dd, yyyy")
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Status Updated
                  </p>
                  <p className="font-medium">
                    {intern.statusUpdatedDate
                      ? format(
                          new Date(intern.statusUpdatedDate),
                          "MMM dd, yyyy"
                        )
                      : "Not recorded"}
                  </p>
                </div>
              </div>

              {intern.currentSemester && (
                <div className="flex items-center">
                  <Book className="mr-2 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Semester
                    </p>
                    <p className="font-medium">{intern.currentSemester}</p>
                  </div>
                </div>
              )}
            </div>

            {intern.documents && intern.documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Documents</h3>
                <div className="space-y-2">
                  {intern.documents.map((doc, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleDocumentDownload(doc)}
                    >
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {doc.name || `Document ${index + 1}`}
                        {doc.size && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({(doc.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>
                      <Download className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Feedback</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFeedback(intern.feedback || "");
                    setShowFeedbackDialog(true);
                  }}
                >
                  {intern.feedback ? "Edit Feedback" : "Add Feedback"}
                </Button>
              </div>

              {intern.feedback ? (
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm">{intern.feedback}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-muted/50 rounded-md">
                  No feedback has been provided yet.
                </div>
              )}
            </div>

            {/* Display evaluation if exists */}
            {intern.evaluation && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Evaluation</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(`/company/evaluate/${intern.email}`)
                      }
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Edit Evaluation
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-md">
                  <div>
                    <p className="text-sm font-medium">Overall Rating</p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(intern.evaluation.overallRating) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Evaluated on</p>
                    <p className="text-sm">
                      {intern.evaluation.submittedDate
                        ? format(
                            new Date(intern.evaluation.submittedDate),
                            "MMM dd, yyyy"
                          )
                        : "Unknown date"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm font-medium">Comments</p>
                    <p className="text-sm mt-1">{intern.evaluation.comments}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Intern Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the intern's status to{" "}
              <span className="font-semibold">
                {newStatus === "current"
                  ? "Current Intern"
                  : newStatus === "completed"
                  ? "Internship Complete"
                  : "Ready to Start"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => handleStatusChange(newStatus)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Intern Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback about the intern's performance and skills
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Write your feedback here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFeedback}>Save Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

