import { useState, useEffect } from "react";
import WarningPopup from "@/components/common/WarningPopup";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileText } from "lucide-react";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
} from "@/utils/indexedDB-utils";
import {
  fileToBase64,
  blobToBase64,
  downloadBase64File,
} from "@/utils/file-utils";
import { getAllCourses } from "@/utils/mock-data";

export default function CompanyEvaluation() {
  // State for internships
  const [currentInternshipId, setCurrentInternshipId] = useState(null);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [internships, setInternships] = useState([]);
  const [email, setEmail] = useState(localStorage.getItem("email"));
  // Form states
  const [evaluationForm, setEvaluationForm] = useState({
    company: "",
    rating: "",
    comment: "",
    recommend: false,
  });

  const [reportForm, setReportForm] = useState({
    title: "",
    introduction: "",
    body: "",
  });

  // New appeal state
  const [appealForm, setAppealForm] = useState({
    text: "",
    submitted: false,
  });

  // Course selection states
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState("internships");
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingEvaluationId, setEditingEvaluationId] = useState(null);

  // WarningPopup states
  const [showInternshipSelectionWarning, setShowInternshipSelectionWarning] =
    useState(false);
  const [showEvaluationExistsWarning, setShowEvaluationExistsWarning] =
    useState(false);
  const [showEvaluationAddedSuccess, setShowEvaluationAddedSuccess] =
    useState(false);
  const [showEvaluationUpdatedSuccess, setShowEvaluationUpdatedSuccess] =
    useState(false);
  const [showEvaluationDeletedSuccess, setShowEvaluationDeletedSuccess] =
    useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [showReportDeletedSuccess, setShowReportDeletedSuccess] =
    useState(false);
  const [showPdfError, setShowPdfError] = useState(false);
  const [showPdfGenerationSuccess, setShowPdfGenerationSuccess] =
    useState(false);
  const [showAppealSuccess, setShowAppealSuccess] = useState(false);

  // Mock data for majors and their courses
  const majorCourses = getAllCourses();
  console.log("Mahor Courses", majorCourses);

  const loadAcceptedInternships = async () => {
    try {
      const email = localStorage.getItem("email");
      if (email) {
        console.log("HI!");
        // Get all applications
        const allApplications = await getAllFromStore("InternshipApplications");

        // Get all evaluations to check which internships have been evaluated
        const allEvaluations = await getAllFromStore("InternshipEvaluations");
        const userEvaluations = allEvaluations.filter(
          (ev) => ev.email === email
        );

        // Create a map of evaluated company names for quick lookup
        const evaluatedCompanies = new Set(
          userEvaluations.map((ev) => ev.company)
        );
        let idCounter = 0;

        const userAcceptedInternships = allApplications.flatMap((app) =>
          Array.isArray(app.applications)
            ? app.applications
                .filter((a) => a.email === email && a.status === "completed")
                .map((a, index) => ({
                  ...a,
                  id: a.id || `${Date.now().toString()}-${idCounter++}`,
                  company: a.company.name,
                  position: a.position || "Intern",
                  startDate: a.startDate || null,
                  endDate: a.endDate || null,
                  isEvaluated: evaluatedCompanies.has(a.company.name),
                }))
            : []
        );

        // Update internships state with accepted applications
        const updatedInternships = await Promise.all(
          userAcceptedInternships.map(async (internship) => {
            // Check if this internship has an evaluation by company name and email
            const evaluations = await getAllFromStore("InternshipEvaluations");
            const evaluation = evaluations.find(
              (ev) => ev.company === internship.company && ev.email === email
            );

            if (evaluation) {
              return {
                ...internship,
                hasEvaluation: true,
                isEvaluated: true,
                evaluations: evaluation?.evaluations || [],
                report: evaluation?.report || null,
                reportPdf: evaluation?.reportPdf || null,
                selectedCourses: evaluation?.selectedCourses || [],
              };
            }

            return {
              ...internship,
              hasEvaluation: false,
              isEvaluated: false,
              evaluations: [],
              report: null,
              reportPdf: null,
              selectedCourses: [],
            };
          })
        );
        setInternships(updatedInternships);
      }
    } catch (error) {
      console.error("Error loading accepted internships:", error);
    }
  };

  // Load jsPDF script dynamically
  useEffect(() => {
    loadAcceptedInternships();
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Helper function to get rating color
  const getRatingColor = (rating) => {
    switch (rating) {
      case "1":
        return "text-red-600";
      case "2":
        return "text-orange-600";
      case "3":
        return "text-yellow-600";
      case "4":
        return "text-green-500";
      case "5":
        return "text-green-600";
      default:
        return "text-slate-700";
    }
  };

  // Helper function to get status color
  const getReportStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "flagged":
        return "bg-amber-100 text-amber-800";
      case "pending":
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  // Helper to check if appeal is needed
  const needsAppeal = (report) => {
    return (
      report && (report.status === "rejected" || report.status === "flagged")
    );
  };

  // Replace major selection with profile major mapping
  const getMajorFromProfile = (profileMajor) => {
    const majorMapping = {
      computer_science: "Computer Science",
      business: "Business",
      engineering: "Engineering",
      design: "Design",
      communication: "Communication",
    };
    return majorMapping[profileMajor] || profileMajor;
  };

  const handleCourseToggle = async (courseId) => {
    if (!currentInternshipId) return;

    const currentInternship = getCurrentInternship();
    if (!currentInternship) return;

    // Toggle course selection
    let updatedCourses = [...selectedCourses];
    if (updatedCourses.includes(courseId)) {
      updatedCourses = updatedCourses.filter((id) => id !== courseId);
    } else {
      updatedCourses.push(courseId);
    }
    setSelectedCourses(updatedCourses);

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    let evaluation = allEvaluations.find(
      (ev) => ev.company === currentInternship.company && ev.email === email
    );

    const evaluationData = evaluation || {
      internshipId: currentInternshipId,
      company: currentInternship.company,
      email,
      evaluations: [],
      selectedCourses: [],
    };

    await saveToStore("InternshipEvaluations", {
      ...evaluationData,
      selectedCourses: updatedCourses,
    });

    // Update internship state
    setInternships((prevInternships) =>
      prevInternships.map((internship) =>
        internship.id === currentInternshipId
          ? { ...internship, selectedCourses: updatedCourses }
          : internship
      )
    );
  };

  // Handlers for evaluations
  const handleEvaluationInputChange = (field, value) => {
    if (field === "company") return; // Prevent company field updates
    setEvaluationForm({
      ...evaluationForm,
      [field]: value,
    });
  };

  const handleEvaluationSubmit = async () => {
    if (!currentInternshipId) {
      setShowInternshipSelectionWarning(true);
      return;
    }

    const currentInternship = getCurrentInternship();
    const existingEvaluation = currentInternship?.evaluations?.find(
      (e) => e.company === currentInternship.company
    );

    if (!editingEvaluationId && existingEvaluation) {
      setShowEvaluationExistsWarning(true);
      return;
    }

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    let evaluation = allEvaluations.find(
      (ev) => ev.company === currentInternship.company && ev.email === email
    );

    const evaluationData = evaluation || {
      internshipId: currentInternshipId,
      company: currentInternship.company,
      email,
      evaluations: [],
      selectedCourses: selectedCourses || [],
    };

    const newEvaluationId = editingEvaluationId || Date.now().toString();
    let updatedEvaluations = [...(evaluationData.evaluations || [])];

    if (editingEvaluationId) {
      // Update existing evaluation
      updatedEvaluations = updatedEvaluations.map((evaluation) =>
        evaluation.id === editingEvaluationId
          ? { ...evaluationForm, id: editingEvaluationId }
          : evaluation
      );
    } else {
      // Add new evaluation
      updatedEvaluations = [
        ...updatedEvaluations.filter((e) => e.id !== newEvaluationId),
        {
          ...evaluationForm,
          id: newEvaluationId,
          date: new Date().toISOString(),
        },
      ];
    }

    const updatedEvaluationData = {
      ...evaluationData,
      evaluations: updatedEvaluations,
      hasEvaluation: true,
    };

    // Save to IndexedDB
    await saveToStore("InternshipEvaluations", updatedEvaluationData);

    // Update internships state
    setInternships((prevInternships) =>
      prevInternships.map((internship) =>
        internship.id === currentInternshipId
          ? {
              ...internship,
              evaluations: updatedEvaluations,
              hasEvaluation: true,
            }
          : internship
      )
    );

    // Reset the form and set editing mode
    setEvaluationForm({
      company: currentInternship.company || "",
      rating: "",
      comment: "",
      recommend: false,
    });
    setEditingEvaluationId(newEvaluationId);

    if (editingEvaluationId) {
      setShowEvaluationUpdatedSuccess(true);
    } else {
      setShowEvaluationAddedSuccess(true);
    }
  };

  const handleDeleteEvaluation = async (evalId) => {
    if (currentInternshipId) {
      const currentInternship = getCurrentInternship();
      if (!currentInternship) return;

      // Find evaluation by company name and email
      const allEvaluations = await getAllFromStore("InternshipEvaluations");
      const evaluationData = allEvaluations.find(
        (ev) => ev.company === currentInternship.company && ev.email === email
      );

      if (evaluationData) {
        const updatedEvaluations = evaluationData.evaluations.filter(
          (e) => e.id !== evalId
        );

        // Update the store
        await saveToStore("InternshipEvaluations", {
          ...evaluationData,
          evaluations: updatedEvaluations,
          hasEvaluation: updatedEvaluations.length > 0,
        });

        // Update internships state
        setInternships((prevInternships) =>
          prevInternships.map((internship) =>
            internship.id === currentInternshipId
              ? {
                  ...internship,
                  evaluations: updatedEvaluations,
                  hasEvaluation: updatedEvaluations.length > 0,
                }
              : internship
          )
        );

        setEvaluationForm({
          company: getCurrentInternship()?.company || "",
          rating: "",
          comment: "",
          recommend: false,
        });
        setEditingEvaluationId(null);
        setShowEvaluationDeletedSuccess(true);
      }
    }
  };

  // Handlers for reports
  const handleReportInputChange = (field, value) => {
    setReportForm({
      ...reportForm,
      [field]: value,
    });
  };

  const handleReportSubmit = async () => {
    if (!currentInternshipId) {
      setShowInternshipSelectionWarning(true);
      return;
    }

    const currentInternship = getCurrentInternship();
    if (!currentInternship) return;

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    let evaluation = allEvaluations.find(
      (ev) => ev.company === currentInternship.company && ev.email === email
    );

    const evaluationData = evaluation || {
      internshipId: currentInternshipId,
      company: currentInternship.company,
      email,
      evaluations: [],
      selectedCourses: selectedCourses || [],
    };

    const updatedEvaluationData = {
      ...evaluationData,
      report: {
        ...reportForm,
        date: new Date().toISOString(),
      },
    };

    // Save to IndexedDB
    await saveToStore("InternshipEvaluations", updatedEvaluationData);

    // Update internships state
    setInternships((prevInternships) =>
      prevInternships.map((internship) =>
        internship.id === currentInternshipId
          ? {
              ...internship,
              report: updatedEvaluationData.report,
            }
          : internship
      )
    );

    setShowReportSuccess(true);
    setEditingReportId(null);
  };

  const handleDeleteReport = async () => {
    if (currentInternshipId) {
      const currentInternship = getCurrentInternship();
      if (!currentInternship) return;

      // Find evaluation by company name and email
      const allEvaluations = await getAllFromStore("InternshipEvaluations");
      const evaluationData = allEvaluations.find(
        (ev) => ev.company === currentInternship.company && ev.email === email
      );

      if (evaluationData) {
        // Update the store without the report
        const { report, reportPdf, ...restData } = evaluationData;
        await saveToStore("InternshipEvaluations", restData);

        // Update internships state
        setInternships((prevInternships) =>
          prevInternships.map((internship) =>
            internship.id === currentInternshipId
              ? {
                  ...internship,
                  report: null,
                  reportPdf: null,
                }
              : internship
          )
        );

        setReportForm({
          title: "",
          introduction: "",
          body: "",
        });

        setShowReportDeletedSuccess(true);
      }
    }
  };

  // Handle appeal form changes
  const handleAppealInputChange = (value) => {
    setAppealForm({
      ...appealForm,
      text: value,
    });
  };

  // Submit appeal
  const handleAppealSubmit = async () => {
    if (!currentInternshipId || appealForm.text.trim() === "") {
      return;
    }

    const currentInternship = getCurrentInternship();
    if (!currentInternship?.report) return;

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    let evaluation = allEvaluations.find(
      (ev) => ev.company === currentInternship.company && ev.email === email
    );

    if (evaluation) {
      // Update report with appeal
      const updatedReport = {
        ...evaluation.report,
        appealResponse: appealForm.text,
        appealDate: new Date().toISOString(),
      };

      await saveToStore("InternshipEvaluations", {
        ...evaluation,
        report: updatedReport,
      });

      // Update internships state
      setInternships((prevInternships) =>
        prevInternships.map((internship) =>
          internship.id === currentInternshipId
            ? {
                ...internship,
                report: updatedReport,
              }
            : internship
        )
      );

      setAppealForm({
        text: "",
        submitted: true,
      });

      setShowAppealSuccess(true);
    }
  };

  // Select an existing internship
  const selectInternship = async (id) => {
    const selected = internships.find((i) => i.id === id);
    if (!selected) {
      console.error("Internship not found:", id);
      return;
    }

    setCurrentInternshipId(id);
    setSelectedInternshipId(id);
    setSelectedMajor(selected.major || "");

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    const evaluationData = allEvaluations.find(
      (ev) => ev.company === selected.company && ev.email === email
    );

    if (evaluationData) {
      setSelectedCourses(evaluationData.selectedCourses || []);

      if (evaluationData.report) {
        setReportForm({
          title: evaluationData.report.title || "",
          introduction: evaluationData.report.introduction || "",
          body: evaluationData.report.body || "",
        });

        // Reset appeal form
        setAppealForm({
          text: evaluationData.report.appealResponse || "",
          submitted: !!evaluationData.report.appealResponse,
        });
      } else {
        setReportForm({
          title: "",
          introduction: "",
          body: "",
        });
      }

      // Find existing evaluation for this company
      const existingEvaluation = evaluationData.evaluations?.find(
        (e) => e.company === selected.company
      );

      if (existingEvaluation) {
        setEvaluationForm({
          company: existingEvaluation.company,
          rating: existingEvaluation.rating,
          comment: existingEvaluation.comment || "",
          recommend: existingEvaluation.recommend || false,
        });
        setEditingEvaluationId(existingEvaluation.id);
      } else {
        setEvaluationForm({
          company: selected.company || "",
          rating: "",
          comment: "",
          recommend: false,
        });
        setEditingEvaluationId(null);
      }
    } else {
      // No evaluation data exists yet
      setSelectedCourses([]);
      setReportForm({
        title: "",
        introduction: "",
        body: "",
      });
      setEvaluationForm({
        company: selected.company || "",
        rating: "",
        comment: "",
        recommend: false,
      });
      setEditingEvaluationId(null);

      // Reset appeal form
      setAppealForm({
        text: "",
        submitted: false,
      });
    }

    // Set available courses based on major
    setAvailableCourses(majorCourses[selected.major] || []);
    setActiveTab("evaluations");
  };

  // Download existing PDF
  const downloadExistingPDF = async () => {
    const currentInternship = getCurrentInternship();
    if (!currentInternship) return;

    // Find evaluation by company name and email
    const allEvaluations = await getAllFromStore("InternshipEvaluations");
    const evaluationData = allEvaluations.find(
      (ev) => ev.company === currentInternship.company && ev.email === email
    );

    if (evaluationData?.reportPdf) {
      downloadBase64File({
        base64: evaluationData.reportPdf,
        name: `${getCurrentInternship()?.company}_Report.pdf`,
      });
    } else {
      setShowPdfError(true);
    }
  };

  // Generate PDF for a specific internship
  const generatePDF = async () => {
    if (!currentInternshipId) {
      setShowInternshipSelectionWarning(true);
      return;
    }

    try {
      const currentInternship = getCurrentInternship();
      if (!currentInternship) return;

      // Find evaluation by company name and email
      const allEvaluations = await getAllFromStore("InternshipEvaluations");
      const evaluationData = allEvaluations.find(
        (ev) => ev.company === currentInternship.company && ev.email === email
      );

      const doc = new window.jspdf.jsPDF();
      let yPos = 20;

      // Add title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      const title = reportForm.title || "Internship Report";
      doc.text(title, 105, yPos, { align: "center" });
      yPos += 15;

      // Add company name and title
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      const company = currentInternship.company || "Unknown Company";
      doc.text(`Company: ${company}`, 20, yPos);
      yPos += 10;
      doc.text(`Position: ${currentInternship.position || "N/A"}`, 20, yPos);
      yPos += 15;

      // Add internship duration
      if (currentInternship.startDate) {
        const startDate = new Date(
          currentInternship.startDate
        ).toLocaleDateString();
        const endDate = currentInternship.endDate
          ? new Date(currentInternship.endDate).toLocaleDateString()
          : "Present";
        doc.setFontSize(12);
        doc.text(`Duration: ${startDate} to ${endDate}`, 20, yPos);
        yPos += 10;
      }

      // Add major
      if (currentInternship.major) {
        doc.setFontSize(12);
        doc.text(
          `Major: ${getMajorFromProfile(currentInternship.major)}`,
          20,
          yPos
        );
        yPos += 10;
      }

      // Add date
      doc.setFontSize(12);
      doc.text(
        `Report Generated: ${new Date().toLocaleDateString()}`,
        20,
        yPos
      );
      yPos += 20;

      // Add introduction
      if (reportForm.introduction) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Introduction", 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const introLines = doc.splitTextToSize(reportForm.introduction, 170);
        doc.text(introLines, 20, yPos);
        yPos += introLines.length * 7 + 10;
      }

      // Add report body
      if (reportForm.body) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Report Content", 20, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const bodyLines = doc.splitTextToSize(reportForm.body, 170);
        doc.text(bodyLines, 20, yPos);
        yPos += bodyLines.length * 7 + 10;
      }

      // Add evaluations
      if (currentInternship.evaluations?.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Company Evaluations", 20, yPos);
        yPos += 10;

        currentInternship.evaluations.forEach((evaluation, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Evaluation ${index + 1}: ${evaluation.company}`, 20, yPos);
          yPos += 7;
          doc.setFont("helvetica", "normal");

          doc.text(`Rating: ${evaluation.rating}/5`, 25, yPos);
          yPos += 7;
          doc.text(
            `Recommend: ${evaluation.recommend ? "Yes" : "No"}`,
            25,
            yPos
          );
          yPos += 7;

          if (evaluation.comment) {
            doc.text("Comment:", 25, yPos);
            yPos += 7;
            const commentLines = doc.splitTextToSize(evaluation.comment, 160);
            doc.text(commentLines, 30, yPos);
            yPos += commentLines.length * 7 + 5;
          }
        });
      }

      // Add selected courses
      if (selectedCourses?.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Relevant Courses", 20, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        const selectedCoursesDetails = availableCourses.filter((course) =>
          selectedCourses.includes(course.id)
        );

        selectedCoursesDetails.forEach((course, index) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${index + 1}. ${course.code}: ${course.name}`, 25, yPos);
          yPos += 7;
        });
      }

      // Save PDF as blob
      const pdfBlob = doc.output("blob");
      // Convert blob to base64
      const base64Pdf = await blobToBase64(pdfBlob);

      // Save the PDF base64 to the store
      if (evaluationData) {
        await saveToStore("InternshipEvaluations", {
          ...evaluationData,
          reportPdf: base64Pdf,
          reportGeneratedDate: new Date().toISOString(),
        });
      } else {
        // Create new evaluation data if it doesn't exist
        await saveToStore("InternshipEvaluations", {
          internshipId: currentInternshipId,
          company: currentInternship.company,
          email,
          evaluations: [],
          selectedCourses: selectedCourses || [],
          reportPdf: base64Pdf,
          reportGeneratedDate: new Date().toISOString(),
        });
      }

      // Download the file
      const filename = currentInternship.company
        ? `${currentInternship.company}_Report.pdf`
        : `Internship_Report_${new Date()
            .toLocaleDateString()
            .replace(/\//g, "-")}.pdf`;

      downloadBase64File({
        base64: base64Pdf,
        name: filename,
      });

      // Show success message after PDF generation
      setShowPdfGenerationSuccess(true);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setShowPdfError(true);
    }
  };

  // Get current internship data
  const getCurrentInternship = () => {
    return internships.find((i) => i.id === currentInternshipId) || null;
  };
  // Get current evaluations
  const getCurrentEvaluations = () => {
    const current = getCurrentInternship();
    return current?.evaluations || [];
  };
  console.log(internships.map((internship) => internship.id));
  return (
    <>
      {showInternshipSelectionWarning && (
        <WarningPopup
          title="No Internship Selected"
          description="Please select an internship first"
          type="warning"
          onClose={() => setShowInternshipSelectionWarning(false)}
        />
      )}

      {showEvaluationExistsWarning && (
        <WarningPopup
          title="Evaluation Already Exists"
          description="An evaluation for this company already exists. You can edit it instead."
          type="info"
          onClose={() => setShowEvaluationExistsWarning(false)}
        />
      )}

      {showEvaluationAddedSuccess && (
        <WarningPopup
          title="Success"
          description="Evaluation Added"
          type="success"
          onClose={() => setShowEvaluationAddedSuccess(false)}
        />
      )}

      {showEvaluationUpdatedSuccess && (
        <WarningPopup
          title="Success"
          description="Evaluation Updated"
          type="success"
          onClose={() => setShowEvaluationUpdatedSuccess(false)}
        />
      )}

      {showEvaluationDeletedSuccess && (
        <WarningPopup
          title="Success"
          description="Evaluation Deleted"
          type="success"
          onClose={() => setShowEvaluationDeletedSuccess(false)}
        />
      )}

      {showReportSuccess && (
        <WarningPopup
          title="Success"
          description={
            getCurrentInternship()?.report ? "Report Updated" : "Report Added"
          }
          type="success"
          onClose={() => setShowReportSuccess(false)}
        />
      )}

      {showReportDeletedSuccess && (
        <WarningPopup
          title="Success"
          description="Report Deleted"
          type="success"
          onClose={() => setShowReportDeletedSuccess(false)}
        />
      )}

      {showPdfError && (
        <WarningPopup
          title="PDF Generation Error"
          description="There was an error generating the PDF. Please try again later."
          type="error"
          onClose={() => setShowPdfError(false)}
        />
      )}

      {showPdfGenerationSuccess && (
        <WarningPopup
          title="PDF Generated"
          description="The PDF report has been generated successfully"
          type="success"
          onClose={() => setShowPdfGenerationSuccess(false)}
        />
      )}

      {showAppealSuccess && (
        <WarningPopup
          title="Success"
          description="Appeal submitted successfully"
          type="success"
          onClose={() => setShowAppealSuccess(false)}
        />
      )}

      <Card className="w-full max-w-4xl max-w-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800">
            Internship Report Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="internships">Internships</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="report">Report</TabsTrigger>
            </TabsList>

            {/* Internships Tab */}
            <TabsContent value="internships">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-slate-700">
                      My Completed Internships
                    </h3>
                  </div>

                  {internships.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-lg">
                      <FileText
                        className="mx-auto text-slate-400 mb-3"
                        size={32}
                      />
                      <p className="text-slate-500">
                        No completed internships available for evaluation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {internships.map((internship) => (
                        <Card
                          key={internship.id}
                          className={`border ${
                            selectedInternshipId === internship.id
                              ? "border-blue-400 ring-2 ring-blue-100"
                              : "border-slate-200"
                          } shadow-sm hover:shadow transition-shadow`}
                        >
                          <CardContent className="pt-6 pb-2">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium text-slate-800">
                                  {internship.company} - {internship.position}
                                </h4>
                                <p className="text-sm text-slate-500">
                                  {internship.startDate
                                    ? new Date(
                                        internship.startDate
                                      ).toLocaleDateString()
                                    : "Start Date"}{" "}
                                  to{" "}
                                  {internship.endDate
                                    ? new Date(
                                        internship.endDate
                                      ).toLocaleDateString()
                                    : "Present"}
                                </p>
                                <div className="mt-2">
                                  {internship.isEvaluated ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      Evaluated
                                    </span>
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                                      Not Evaluated
                                    </span>
                                  )}
                                  {internship.report ? (
                                    <>
                                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                        Report:{" "}
                                        {internship.report.title || "Untitled"}
                                      </span>
                                      {internship.report.status && (
                                        <span
                                          className={`ml-2 ${getReportStatusColor(
                                            internship.report.status
                                          )} text-xs px-2 py-1 rounded`}
                                        >
                                          Status:{" "}
                                          {internship.report.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            internship.report.status.slice(1)}
                                        </span>
                                      )}
                                      {internship.report.appealResponse && (
                                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                          Appeal: Submitted
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
                                      No report
                                    </span>
                                  )}
                                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {internship.evaluations?.length || 0}{" "}
                                    Evaluations
                                  </span>
                                  {internship.reportPdf && (
                                    <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                      PDF Available
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex">
                                <Button
                                  variant="outline"
                                  className="mr-2"
                                  onClick={() =>
                                    selectInternship(internship.id)
                                  }
                                >
                                  Select
                                </Button>
                                {internship.reportPdf && (
                                  <Button
                                    variant="secondary"
                                    onClick={() => {
                                      setCurrentInternshipId(internship.id);
                                      downloadExistingPDF();
                                    }}
                                  >
                                    Download PDF
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Evaluations Tab */}
            <TabsContent value="evaluations">
              {!currentInternshipId ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle
                      className="text-amber-500 mr-3 mt-0.5"
                      size={18}
                    />
                    <div>
                      <h4 className="font-medium text-amber-800">
                        No internship selected
                      </h4>
                      <p className="text-amber-700 text-sm">
                        Please select an internship first.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-lg font-medium mb-4 text-slate-700">
                      {editingEvaluationId
                        ? "Update Company Evaluation"
                        : "Add Company Evaluation"}
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <Label
                          htmlFor="company"
                          className="text-sm font-medium mb-1 block"
                        >
                          Company Name
                        </Label>
                        <Input
                          id="company"
                          placeholder="Enter company name"
                          value={evaluationForm.company}
                          onChange={(e) =>
                            handleEvaluationInputChange(
                              "company",
                              e.target.value
                            )
                          }
                          className="mt-1"
                          readOnly
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="rating"
                          className="text-sm font-medium mb-1 block"
                        >
                          Rating (1-5)
                        </Label>
                        <Select
                          value={evaluationForm.rating}
                          onValueChange={(value) =>
                            handleEvaluationInputChange("rating", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Poor</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="comment"
                          className="text-sm font-medium mb-1 block"
                        >
                          Comment
                        </Label>
                        <Textarea
                          id="comment"
                          placeholder="Enter your comment"
                          className="min-h-32 mt-1"
                          value={evaluationForm.comment}
                          onChange={(e) =>
                            handleEvaluationInputChange(
                              "comment",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="recommend"
                          checked={evaluationForm.recommend}
                          onCheckedChange={(checked) =>
                            handleEvaluationInputChange("recommend", checked)
                          }
                        />
                        <Label
                          htmlFor="recommend"
                          className="text-sm font-medium"
                        >
                          I recommend this company to other students
                        </Label>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <Button
                          onClick={handleEvaluationSubmit}
                          className="px-4"
                        >
                          {editingEvaluationId ? "Update" : "Add"} Evaluation
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <h3 className="text-lg font-medium mb-4 text-slate-700">
                      Existing Evaluations
                    </h3>
                    {getCurrentEvaluations().length === 0 ? (
                      <p className="text-slate-500 italic">
                        No evaluations yet.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {getCurrentEvaluations().map((evaluation) => (
                          <Card
                            key={evaluation.id}
                            className="border border-slate-200 shadow-sm hover:shadow transition-shadow"
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-2">
                                <p>
                                  <span className="font-medium text-slate-700">
                                    Company:
                                  </span>{" "}
                                  {evaluation.company}
                                </p>
                                <p>
                                  <span className="font-medium text-slate-700">
                                    Rating:
                                  </span>{" "}
                                  <span
                                    className={getRatingColor(
                                      evaluation.rating
                                    )}
                                  >
                                    {evaluation.rating}/5
                                  </span>
                                </p>
                                <p>
                                  <span className="font-medium text-slate-700">
                                    Comment:
                                  </span>{" "}
                                  {evaluation.comment || "N/A"}
                                </p>
                                <p>
                                  <span className="font-medium text-slate-700">
                                    Recommend:
                                  </span>{" "}
                                  <span
                                    className={
                                      evaluation.recommend
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {evaluation.recommend ? "Yes" : "No"}
                                  </span>
                                </p>
                                {evaluation.date && (
                                  <p className="text-xs text-slate-500">
                                    Added on{" "}
                                    {new Date(
                                      evaluation.date
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-3 pt-2 pb-4">
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteEvaluation(evaluation.id)
                                }
                                className="px-3"
                              >
                                Delete
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              {!currentInternshipId ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle
                      className="text-amber-500 mr-3 mt-0.5"
                      size={18}
                    />
                    <div>
                      <h4 className="font-medium text-amber-800">
                        No internship selected
                      </h4>
                      <p className="text-amber-700 text-sm">
                        Please select an internship first.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                  <h3 className="text-lg font-medium mb-5 text-slate-700">
                    Related Courses for Your Major
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium mb-1 block">
                        Your Major: {getMajorFromProfile(selectedMajor)}
                      </Label>
                    </div>

                    <div className="mt-6 border-t pt-4 border-slate-200">
                      {selectedMajor && availableCourses.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-3 text-slate-600">
                            Available Courses
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableCourses.map((course) => (
                              <div
                                key={course.id}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50"
                              >
                                <Checkbox
                                  id={`course-${course.id}`}
                                  checked={selectedCourses.includes(course.id)}
                                  onCheckedChange={() =>
                                    handleCourseToggle(course.id)
                                  }
                                />
                                <Label
                                  htmlFor={`course-${course.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  <span className="font-medium">
                                    {course.code}:
                                  </span>{" "}
                                  {course.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : selectedMajor ? (
                        <p className="text-slate-500 italic">
                          No courses available for this major.
                        </p>
                      ) : (
                        <p className="text-slate-500 italic">
                          Please select a major to view available courses.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Report Tab */}
            <TabsContent value="report">
              {!currentInternshipId ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle
                      className="text-amber-500 mr-3 mt-0.5"
                      size={18}
                    />
                    <div>
                      <h4 className="font-medium text-amber-800">
                        No internship selected
                      </h4>
                      <p className="text-amber-700 text-sm">
                        Please select an internship first.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Appeal Section */}
                  {getCurrentInternship()?.report &&
                    needsAppeal(getCurrentInternship()?.report) && (
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 mb-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3
                            className={`text-lg font-medium ${
                              getCurrentInternship()?.report?.status ===
                              "rejected"
                                ? "text-red-700"
                                : "text-amber-700"
                            }`}
                          >
                            {getCurrentInternship()?.report?.status ===
                            "rejected"
                              ? "Report Rejected"
                              : "Report Flagged"}
                          </h3>
                        </div>

                        {getCurrentInternship()?.report?.feedback && (
                          <div className="mb-4 bg-slate-50 p-3 rounded border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-700 mb-1">
                              Feedback from reviewer:
                            </h4>
                            <p className="text-slate-700">
                              {getCurrentInternship()?.report?.feedback}
                            </p>
                          </div>
                        )}

                        <div className="mt-4">
                          <Label
                            htmlFor="appeal-text"
                            className="text-sm font-medium mb-1 block"
                          >
                            Submit an Appeal
                          </Label>
                          {!appealForm.submitted ? (
                            <>
                              <Textarea
                                id="appeal-text"
                                placeholder="Write your appeal here. Explain why you think your report should be reconsidered."
                                className="min-h-24 mt-1"
                                value={appealForm.text}
                                onChange={(e) =>
                                  handleAppealInputChange(e.target.value)
                                }
                              />
                              <Button
                                onClick={handleAppealSubmit}
                                className="mt-3"
                                disabled={!appealForm.text.trim()}
                              >
                                Submit Appeal
                              </Button>
                            </>
                          ) : (
                            <div className="bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                              <h4 className="text-sm font-medium text-green-700 mb-1">
                                Appeal Submitted
                              </h4>
                              <p className="text-slate-700">
                                {appealForm.text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-lg font-medium text-slate-700">
                        {getCurrentInternship()?.report
                          ? "Edit Report"
                          : "Create Report"}
                      </h3>
                      {getCurrentInternship()?.report && (
                        <Button
                          variant="destructive"
                          onClick={handleDeleteReport}
                        >
                          Delete Report
                        </Button>
                      )}
                    </div>

                    {getCurrentInternship()?.report?.status && (
                      <div
                        className={`mb-4 p-3 rounded ${getReportStatusColor(
                          getCurrentInternship().report.status
                        )}`}
                      >
                        <p className="font-medium">
                          Status:{" "}
                          {getCurrentInternship()
                            .report.status.charAt(0)
                            .toUpperCase() +
                            getCurrentInternship().report.status.slice(1)}
                        </p>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <Label
                          htmlFor="report-title"
                          className="text-sm font-medium mb-1 block"
                        >
                          Report Title
                        </Label>
                        <Input
                          id="report-title"
                          placeholder="Enter report title"
                          value={reportForm.title}
                          onChange={(e) =>
                            handleReportInputChange("title", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="report-intro"
                          className="text-sm font-medium mb-1 block"
                        >
                          Introduction
                        </Label>
                        <Textarea
                          id="report-intro"
                          placeholder="Write an introduction to your internship experience"
                          className="min-h-24 mt-1"
                          value={reportForm.introduction}
                          onChange={(e) =>
                            handleReportInputChange(
                              "introduction",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="report-body"
                          className="text-sm font-medium mb-1 block"
                        >
                          Report Body
                        </Label>
                        <Textarea
                          id="report-body"
                          placeholder="Write the main content of your report"
                          className="min-h-64 mt-1"
                          value={reportForm.body}
                          onChange={(e) =>
                            handleReportInputChange("body", e.target.value)
                          }
                        />
                      </div>

                      <div className="pt-2">
                        <Button onClick={handleReportSubmit}>
                          {getCurrentInternship()?.report
                            ? "Update Report"
                            : "Save Report"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  {getCurrentInternship()?.report && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                      <h3 className="text-lg font-medium mb-6 text-slate-700 border-b pb-2">
                        Report Preview
                      </h3>
                      <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-semibold text-slate-700 mb-3">
                            {reportForm.title || "Untitled Report"}
                          </h4>

                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-slate-600 mb-2">
                              Introduction
                            </h5>
                            <div className="pl-3 border-l-2 border-slate-300 text-slate-700">
                              {reportForm.introduction ||
                                "No introduction provided."}
                            </div>
                          </div>

                          <div>
                            <h5 className="text-sm font-medium text-slate-600 mb-2">
                              Body
                            </h5>
                            <div className="pl-3 border-l-2 border-slate-300 text-slate-700">
                              {reportForm.body || "No content provided."}
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-semibold text-slate-700 mb-2">
                            Major
                          </h4>
                          <p
                            className={
                              !selectedMajor ? "text-slate-500 italic" : ""
                            }
                          >
                            {selectedMajor
                              ? getMajorFromProfile(selectedMajor)
                              : "Not selected"}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-semibold text-slate-700 mb-2">
                            Evaluations
                          </h4>
                          {getCurrentEvaluations().length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {getCurrentEvaluations().map((evaluation) => (
                                <li key={evaluation.id}>
                                  <span className="font-medium">
                                    {evaluation.company}
                                  </span>{" "}
                                  - Rating:{" "}
                                  <span
                                    className={getRatingColor(
                                      evaluation.rating
                                    )}
                                  >
                                    {evaluation.rating}/5
                                  </span>
                                  , Recommend:{" "}
                                  <span
                                    className={
                                      evaluation.recommend
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {evaluation.recommend ? "Yes" : "No"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 italic">
                              No evaluations added.
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-md">
                          <h4 className="font-semibold text-slate-700 mb-2">
                            Selected Courses
                          </h4>
                          {selectedCourses.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                              {availableCourses
                                .filter((course) =>
                                  selectedCourses.includes(course.id)
                                )
                                .map((course) => (
                                  <li key={course.id}>
                                    <span className="font-medium">
                                      {course.code}:
                                    </span>{" "}
                                    {course.name}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="text-slate-500 italic">
                              No courses selected.
                            </p>
                          )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-200">
                          <div className="flex flex-wrap gap-4">
                            <Button
                              onClick={generatePDF}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {getCurrentInternship()?.reportPdf
                                ? "Update and Download PDF"
                                : "Generate PDF"}
                            </Button>
                            {getCurrentInternship()?.reportPdf && (
                              <Button
                                variant="outline"
                                onClick={downloadExistingPDF}
                              >
                                Download Existing PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
