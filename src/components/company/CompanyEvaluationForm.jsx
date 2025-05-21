import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  CheckCircle,
  Send,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import WarningPopup from "@/components/common/WarningPopup";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
} from "../../utils/indexedDB-utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function CompanyEvaluationForm() {
  const { id } = useParams(); // Intern email or ID
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [intern, setIntern] = useState(null);
  const [internshipId, setInternshipId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [mainSupervisor, setMainSupervisor] = useState("");
  // Evaluation form fields
  const [overallRating, setOverallRating] = useState("3");
  const [technicalSkills, setTechnicalSkills] = useState("3");
  const [communication, setCommunication] = useState("3");
  const [teamwork, setTeamwork] = useState("3");
  const [punctuality, setPunctuality] = useState("3");
  const [comments, setComments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInternData = async () => {
      try {
        setIsLoading(true);

        if (!id) {
          console.error("No intern ID provided");
          setIsLoading(false);
          return;
        }

        // Get all internship applications
        const allApplicationSets = await getAllFromStore(
          "InternshipApplications"
        );

        // Find the completed intern by email
        let foundIntern = null;
        let foundId = null;

        for (const applicationSet of allApplicationSets) {
          if (Array.isArray(applicationSet.applications)) {
            const matchingIntern = applicationSet.applications.find(
              (app) => app.email === id && app.status === "completed"
            );

            if (matchingIntern) {
              foundIntern = {
                ...matchingIntern,
                internshipId: applicationSet.id,
              };
              foundId = applicationSet.id;

              // If the intern already has an evaluation, pre-fill the form
              if (matchingIntern.evaluation) {
                setOverallRating(
                  matchingIntern.evaluation.overallRating || "3"
                );
                setTechnicalSkills(
                  matchingIntern.evaluation.technicalSkills || "3"
                );
                setCommunication(
                  matchingIntern.evaluation.communication || "3"
                );
                setTeamwork(matchingIntern.evaluation.teamwork || "3");
                setPunctuality(matchingIntern.evaluation.punctuality || "3");
                setComments(matchingIntern.evaluation.comments || "");
                setStrengths(matchingIntern.evaluation.strengths || "");
                setAreasToImprove(
                  matchingIntern.evaluation.areasToImprove || ""
                );
                setMainSupervisor(
                  matchingIntern.evaluation.mainSupervisor || ""
                );
              }

              break;
            }
          }
        }

        setIntern(foundIntern);
        setInternshipId(foundId);
      } catch (error) {
        console.error("Error fetching intern data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comments || !strengths || !areasToImprove || !mainSupervisor) {
      setShowWarning(true);
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current application data
      const currentData = await getFromStore(
        "InternshipApplications",
        internshipId
      );

      if (!currentData || !Array.isArray(currentData.applications)) {
        throw new Error("No application data found");
      }

      // Create the evaluation object
      const evaluation = {
        overallRating,
        technicalSkills,
        communication,
        teamwork,
        punctuality,
        comments,
        strengths,
        areasToImprove,
        mainSupervisor,
        submittedDate: new Date().toISOString(),
      };

      // Update the specific intern with the evaluation
      const updatedApplications = currentData.applications.map((app) => {
        if (app.email === id) {
          return { ...app, evaluation };
        }
        return app;
      });

      // Save back to IndexedDB
      await saveToStore("InternshipApplications", {
        ...currentData,
        applications: updatedApplications,
      });

      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting evaluation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvaluation = async () => {
    try {
      setIsSubmitting(true);

      // Get current application data
      const currentData = await getFromStore(
        "InternshipApplications",
        internshipId
      );

      if (!currentData || !Array.isArray(currentData.applications)) {
        throw new Error("No application data found");
      }

      // Update the specific intern to remove the evaluation
      const updatedApplications = currentData.applications.map((app) => {
        if (app.email === id) {
          // Create a new object without the evaluation property
          const { evaluation, ...appWithoutEvaluation } = app;
          return appWithoutEvaluation;
        }
        return app;
      });

      // Save back to IndexedDB
      await saveToStore("InternshipApplications", {
        ...currentData,
        applications: updatedApplications,
      });

      setShowDeleteSuccess(true);
    } catch (error) {
      console.error("Error deleting evaluation:", error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
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
            <p className="text-lg font-semibold mb-4">
              Intern not found or not completed
            </p>
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
          title="Evaluation Submitted"
          description="Thank you for submitting your evaluation of this intern."
          type="success"
          onClose={() => {
            setShowSuccess(false);
            navigate("/company/interns");
          }}
        />
      )}

      {showDeleteSuccess && (
        <WarningPopup
          title="Evaluation Deleted"
          description="The evaluation has been successfully deleted."
          type="success"
          onClose={() => {
            setShowDeleteSuccess(false);
            navigate("/company/interns");
          }}
        />
      )}

      {showWarning && (
        <WarningPopup
          title="Missing Information"
          description="Please fill in all the required fields before submitting."
          type="warning"
          onClose={() => setShowWarning(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Evaluation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this evaluation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvaluation}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(`/company/interns/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Intern Profile
          </Button>

          {/* Add Delete Button if an evaluation exists */}
          {intern && intern.evaluation && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="mb-4"
            >
              Delete Evaluation
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Intern Evaluation Form</CardTitle>
            <CardDescription>
              Evaluate {intern.name || intern.email}'s performance during the
              internship
            </CardDescription>
          </CardHeader>

          <Separator />

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Performance Ratings</h3>

                <div className="space-y-8">
                  <div>
                    <Label className="text-base">Overall Performance</Label>
                    <RatingScale
                      value={overallRating}
                      onChange={setOverallRating}
                    />
                  </div>

                  <div>
                    <Label className="text-base">Technical Skills</Label>
                    <RatingScale
                      value={technicalSkills}
                      onChange={setTechnicalSkills}
                    />
                  </div>

                  <div>
                    <Label className="text-base">Communication</Label>
                    <RatingScale
                      value={communication}
                      onChange={setCommunication}
                    />
                  </div>

                  <div>
                    <Label className="text-base">Teamwork</Label>
                    <RatingScale value={teamwork} onChange={setTeamwork} />
                  </div>

                  <div>
                    <Label className="text-base">
                      Punctuality & Reliability
                    </Label>
                    <RatingScale
                      value={punctuality}
                      onChange={setPunctuality}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-base">
                    Overall Comments <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Provide general comments about the intern's performance"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strengths" className="text-base">
                    Key Strengths <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="strengths"
                    placeholder="What were the intern's greatest strengths?"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improve" className="text-base">
                    Areas for Improvement{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="improve"
                    placeholder="What areas could the intern improve upon?"
                    value={areasToImprove}
                    onChange={(e) => setAreasToImprove(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor" className="text-base">
                    Main Supervisor
                    <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="improve"
                    placeholder="The Main Supervisor of the intern"
                    value={mainSupervisor}
                    onChange={(e) => setMainSupervisor(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-6 flex justify-between">
              <p className="text-sm text-muted-foreground flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Fields marked with <span className="text-red-500 mx-1">
                  *
                </span>{" "}
                are required
              </p>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Evaluation
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}

const RatingScale = ({ value, onChange }) => {
  return (
    <RadioGroup
      className="flex justify-between mt-4"
      value={value}
      onValueChange={onChange}
    >
      <div className="flex flex-col items-center">
        <RadioGroupItem value="1" id="r1" />
        <Label htmlFor="r1" className="mt-2">
          Poor
        </Label>
      </div>

      <div className="flex flex-col items-center">
        <RadioGroupItem value="2" id="r2" />
        <Label htmlFor="r2" className="mt-2">
          Fair
        </Label>
      </div>

      <div className="flex flex-col items-center">
        <RadioGroupItem value="3" id="r3" />
        <Label htmlFor="r3" className="mt-2">
          Good
        </Label>
      </div>

      <div className="flex flex-col items-center">
        <RadioGroupItem value="4" id="r4" />
        <Label htmlFor="r4" className="mt-2">
          Very Good
        </Label>
      </div>

      <div className="flex flex-col items-center">
        <RadioGroupItem value="5" id="r5" />
        <Label htmlFor="r5" className="mt-2">
          Excellent
        </Label>
      </div>
    </RadioGroup>
  );
};
