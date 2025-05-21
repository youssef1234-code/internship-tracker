import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Flag,
  Search,
  XCircle,
  Download,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { getAllFromStore, saveToStore } from "@/utils/indexedDB-utils";
import DataTable from "@/components/common/DataTable";
import { downloadBase64File } from "@/utils/file-utils";
import { addNotification } from "@/utils/notification-utils";
import { getCourseById } from "@/utils/mock-data";

export default function ReportList() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Report viewing states
  const [selectedReport, setSelectedReport] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [appealResponse, setAppealResponse] = useState("");
  const [showAppealSection, setShowAppealSection] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("userType"));

  const statusColors = {
    pending: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    flagged: "bg-amber-100 text-amber-800",
    appealed: "bg-purple-100 text-purple-800",
  };

  // Load all reports from internship evaluations
  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        // Get all internship evaluations
        const evaluations = await getAllFromStore("InternshipEvaluations");
        const users = await getAllFromStore("studentProfiles");
        const studentMap = Object.fromEntries(
          users.map((user) => [user.email, user])
        );
        const allReports = evaluations
          .filter((ev) => ev.report) // Only include evaluations with reports
          .map((ev) => {
            const student = studentMap[ev.email] || {};
            return {
              id: `${ev.internshipId}-report`,
              studentName:
                `${student.firstName} ${student.lastName}` || "Student",
              studentEmail: student.email || "",
              company: ev.company,
              position: ev.position || "Intern",
              startDate: ev.startDate,
              endDate: ev.endDate,
              major: student.major || "Undeclared",
              report: ev.report,
              status: ev.report.status || "pending",
              evaluations: ev.evaluations || [],
              selectedCourses: ev.selectedCourses || [],
              dateSubmitted: ev.report.date || new Date().toISOString(),
              appealMessage: ev.report.appealMessage || "",
              feedback: ev.report.feedback || "",
              appealResponse: ev.report.appealResponse || "",
              internshipId: ev.internshipId,
              reportPdf: ev.reportPdf || null,
            };
          });

        setReports(allReports);
        filterReportsByTab(allReports, activeTab);
      } catch (error) {
        console.error("Error loading reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [activeTab]);

  // Filter reports when the tab changes
  const filterReportsByTab = (allReports, tab) => {
    switch (tab) {
      case "pending":
        setFilteredReports(allReports.filter((r) => r.status === "pending"));
        break;
      case "approved":
        setFilteredReports(allReports.filter((r) => r.status === "approved"));
        break;
      case "rejected":
        setFilteredReports(allReports.filter((r) => r.status === "rejected"));
        break;
      case "flagged":
        setFilteredReports(allReports.filter((r) => r.status === "flagged"));
        break;
      case "appealed":
        setFilteredReports(
          allReports.filter(
            (r) => r.appealMessage && r.appealMessage.length > 0
          )
        );
        break;
      default:
        setFilteredReports(allReports);
    }
  };

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    filterReportsByTab(reports, value);
  };

  // Handle viewing a report
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsReportDialogOpen(true);
    setFeedbackMessage(report.feedback || "");
    setAppealResponse(report.appealResponse || "");
  };

  // Handle searching
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      filterReportsByTab(reports, activeTab);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const searchResults = reports.filter(
      (report) =>
        (report.status === activeTab ||
          activeTab === "all" ||
          (activeTab === "appealed" && report.appealMessage?.length > 0)) &&
        (report.studentName?.toLowerCase().includes(lowerCaseQuery) ||
          report.company?.toLowerCase().includes(lowerCaseQuery) ||
          report.position?.toLowerCase().includes(lowerCaseQuery) ||
          report.report?.title?.toLowerCase().includes(lowerCaseQuery))
    );

    setFilteredReports(searchResults);
  };

  // Handle downloading the report PDF
  const handleDownloadReport = () => {
    if (selectedReport && selectedReport.reportPdf) {
      downloadBase64File({
        base64: selectedReport.reportPdf,
        name: `${selectedReport.studentName}_${selectedReport.company}_report.pdf`,
      });
    }
  };

  // Handle updating report status
  const updateReportStatus = async (status) => {
    try {
      if (!selectedReport) return;

      // Find the evaluation
      const evaluations = await getAllFromStore("InternshipEvaluations");
      const evaluation = evaluations.find(
        (ev) => ev.internshipId === selectedReport.internshipId
      );

      if (evaluation) {
        // Update the report status in the evaluation
        const updatedEvaluation = {
          ...evaluation,
          report: {
            ...evaluation.report,
            status: status,
            feedback: feedbackMessage,
            appealResponse:
              status === "rejected" || status === "flagged"
                ? appealResponse
                : evaluation.report.appealResponse,
          },
        };

        // Update the evaluation in IndexedDB
        await saveToStore("InternshipEvaluations", updatedEvaluation);

        // Send a message to the student regarding the status change
        const message = {
          email: evaluation.email,
          message: `Please note that the Submitted report for your internship at ${evaluation.company} has been ${status}.`,
        };

        addNotification(message);

        // Update local state
        setReports(
          reports.map((r) =>
            r.id === selectedReport.id
              ? {
                  ...r,
                  status: status,
                  feedback: feedbackMessage,
                  appealResponse:
                    status === "rejected" || status === "flagged"
                      ? appealResponse
                      : r.appealResponse,
                }
              : r
          )
        );

        filterReportsByTab(
          reports.map((r) =>
            r.id === selectedReport.id
              ? {
                  ...r,
                  status: status,
                  feedback: feedbackMessage,
                  appealResponse:
                    status === "rejected" || status === "flagged"
                      ? appealResponse
                      : r.appealResponse,
                }
              : r
          ),
          activeTab
        );

        // Close the dialog
        setIsReportDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating report status:", error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Status badge component
  const StatusBadge = ({ status, hasAppeal }) => {
    let color = statusColors[status] || statusColors.pending;
    let icon;
    switch (status) {
      case "approved":
        icon = <CheckCircle className="w-3 h-3 mr-1" />;
        break;
      case "rejected":
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case "flagged":
        icon = <Flag className="w-3 h-3 mr-1" />;
        break;
      default:
        icon = <FileText className="w-3 h-3 mr-1" />;
    }

    return (
      <div className="flex gap-2">
        <span
          className={`px-2 py-1 rounded-full flex items-center text-xs ${color}`}
        >
          {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {hasAppeal && (
          <span
            className={`px-2 py-1 rounded-full flex items-center text-xs ${statusColors.appealed}`}
          >
            <AlertCircle className="w-3 h-3 mr-1" /> Appealed
          </span>
        )}
      </div>
    );
  };
  console.log("role", role);
  // Define columns for DataTable
  const columns = [
    {
      id: "student",
      header: "Student",
      accessor: "studentName",
      render: (item) => (
        <div>
          <div className="font-medium">{item.studentName}</div>
          <div className="text-sm text-muted-foreground">
            {item.studentEmail}
          </div>
        </div>
      ),
    },
    {
      id: "company",
      header: "Company",
      accessor: "company",
      render: (item) => <div>{item.company}</div>,
    },
    {
      id: "position",
      header: "Position",
      accessor: "position",
      render: (item) => <div>{item.position}</div>,
    },
    {
      id: "major",
      header: "Major",
      accessor: "major",
      render: (item) => <div>{item.major}</div>,
    },
    {
      id: "reportTitle",
      header: "Report Title",
      accessor: "report.title",
      render: (item) => <div>{item.report?.title || "Untitled Report"}</div>,
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      render: (item) => (
        <StatusBadge status={item.status} hasAppeal={!!item.appealMessage} />
      ),
    },
    {
      id: "dateSubmitted",
      header: "Submitted",
      accessor: "dateSubmitted",
      render: (item) => <div>{formatDate(item.dateSubmitted)}</div>,
    },
    {
      id: "downloadPdf",
      header: "PDF",
      render: (item) =>
        item.reportPdf && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              downloadBase64File({
                base64: item.reportPdf,
                name: `${item.studentName}_${item.company}_report.pdf`,
              });
            }}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewReport(item)}
        >
          View
        </Button>
      ),
    },
  ];

  const filters = [
    {
      key: "major",
      label: "Major",
      options: [
        { label: "Computer Science", value: "computer_science" },
        { label: "Business Administration", value: "business" },
        { label: "Engineering", value: "engineering" },
        { label: "Design", value: "design" },
        { label: "Communication", value: "communication" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Student Internship Reports</CardTitle>
          <CardDescription>
            Review and manage student internship reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Reports</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
              </TabsList>

              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <DataTable
                data={filteredReports}
                filters={filters}
                columns={columns}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <DataTable
                data={filteredReports}
                filters={filters}
                columns={columns}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              <DataTable
                data={filteredReports}
                filters={filters}
                columns={columns}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <DataTable
                data={filteredReports}
                filters={filters}
                columns={columns}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="flagged" className="space-y-4">
              <DataTable
                data={filteredReports}
                filters={filters}
                columns={columns}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Internship Report Review</DialogTitle>
            <DialogDescription>
              {selectedReport?.company} - {selectedReport?.position}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between">
                <div>
                  <Badge variant="outline">{selectedReport.studentName}</Badge>
                  <Badge variant="outline" className="ml-2">
                    {selectedReport.major}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={selectedReport.status}
                    hasAppeal={!!selectedReport.appealMessage}
                  />
                  {selectedReport.reportPdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReport}
                      title="Download report PDF"
                    >
                      <Download className="h-4 w-4 mr-1" /> Download PDF
                    </Button>
                  )}
                </div>
              </div>
              <div className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold">
                  {selectedReport.report?.title || "Untitled Report"}
                </h3>

                <div className="mt-4">
                  <h4 className="font-medium">Introduction</h4>
                  <p className="mt-1">
                    {selectedReport.report?.introduction ||
                      "No introduction provided."}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium">Report Content</h4>
                  <p className="mt-1">
                    {selectedReport.report?.body || "No content provided."}
                  </p>
                </div>
              </div>
              {/* Courses */}
              <div className="border p-4 rounded-md">
                <h4 className="font-medium">Relevant Courses</h4>
                {selectedReport.selectedCourses?.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2">
                    {selectedReport.selectedCourses.map((courseId, index) => (
                      <li key={index}>
                        Course Name:{" "}
                        {getCourseById(courseId)?.name || "Unknown Course"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    No courses selected
                  </p>
                )}
              </div>
              {/* Appeal message (if any) */}
              {selectedReport.appealMessage && (
                <div className="border border-amber-200 bg-amber-50 p-4 rounded-md">
                  <h4 className="font-medium text-amber-800">Student Appeal</h4>
                  <p className="mt-1">{selectedReport.appealMessage}</p>
                </div>
              )}
              {/* Feedback section */}
              <div>
                <Label htmlFor="feedback">Feedback Message</Label>
                <Textarea
                  id="feedback"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Provide feedback on this report..."
                  className="mt-1"
                />
              </div>
              {/* Appeal response (for rejected/flagged reports) */}
              {(selectedReport.status === "rejected" ||
                selectedReport.status === "flagged" ||
                selectedReport.appealResponse) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-sm mb-2">Appeal Status</h4>
                  {selectedReport.appealResponse ? (
                    <div className="space-y-4">
                      <div className="bg-purple-50 p-4 rounded-md">
                        <p className="text-sm text-purple-900">
                          <span className="font-medium">Appeal Message:</span>{" "}
                          {selectedReport.appealResponse}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No appeal submitted yet.
                    </p>
                  )}
                </div>
              )}

              {role == "faculty_member" && (
                <DialogFooter className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => updateReportStatus("rejected")}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                      onClick={() => updateReportStatus("flagged")}
                      variant="outline"
                      className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    >
                      <Flag className="w-4 h-4 mr-2" /> Flag
                    </Button>
                  </div>
                  <Button
                    onClick={() => updateReportStatus("approved")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
