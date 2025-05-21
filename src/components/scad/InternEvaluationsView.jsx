import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Search,
  Calendar,
  Star,
  User,
  ChevronRight,
  Mail,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/common/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { getAllFromStore } from "../../utils/indexedDB-utils";

export default function InternEvaluationsView() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [allInterns, setAllInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setIsLoading(true);

        // Get all internship applications
        const applicationSets = await getAllFromStore("InternshipApplications");

        // Extract all completed interns with evaluations
        let evaluatedInterns = [];

        applicationSets.forEach((appSet) => {
          if (Array.isArray(appSet.applications)) {
            const internsWithEvaluations = appSet.applications
              .filter((app) => app.status === "completed" && app.evaluation)
              .map(async (intern) => {
                // Try to get the student profile for additional info
                try {
                  const studentProfile = await getFromStore(
                    "studentProfiles",
                    intern.email
                  );
                  return {
                    ...intern,
                    name:
                      intern.name ||
                      studentProfile?.name ||
                      intern.email.split("@")[0],
                    university:
                      intern.university ||
                      studentProfile?.university ||
                      "Unknown",
                    major: intern.major || studentProfile?.major || "Unknown",
                    companyName: intern.company?.name || "Unknown Company",
                    position: intern.position || "Internship",
                    evaluationDate:
                      intern.evaluation?.submittedDate || "Unknown",
                  };
                } catch (error) {
                  return {
                    ...intern,
                    name: intern.name || intern.email.split("@")[0],
                    companyName: intern.company?.name || "Unknown Company",
                    position: intern.position || "Internship",
                    evaluationDate:
                      intern.evaluation?.submittedDate || "Unknown",
                  };
                }
              });

            // Resolve all promises and add to the evaluated interns list
            Promise.all(internsWithEvaluations).then((resolvedInterns) => {
              evaluatedInterns = [...evaluatedInterns, ...resolvedInterns];
              setAllInterns(evaluatedInterns);
              setFilteredInterns(evaluatedInterns);
              setIsLoading(false);
            });
          }
        });
      } catch (error) {
        console.error("Error fetching evaluations:", error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  // Filter interns based on search query and tab filter
  useEffect(() => {
    if (!allInterns.length) return;

    let filtered = [...allInterns];

    // Apply company filter if not "all"
    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (intern) =>
          intern.companyName.toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (intern) =>
          (intern.name && intern.name.toLowerCase().includes(query)) ||
          (intern.email && intern.email.toLowerCase().includes(query)) ||
          (intern.position && intern.position.toLowerCase().includes(query)) ||
          (intern.companyName &&
            intern.companyName.toLowerCase().includes(query))
      );
    }

    setFilteredInterns(filtered);
  }, [searchQuery, activeFilter, allInterns]);

  // View evaluation details
  const handleViewEvaluation = (intern) => {
    setSelectedIntern(intern);
    setSelectedEvaluation(intern.evaluation);
    setShowEvaluationDialog(true);
  };

  // Get unique company names for filtering
  const companyFilters = useMemo(() => {
    if (!allInterns.length) return [];

    const uniqueCompanies = [
      ...new Set(allInterns.map((intern) => intern.companyName)),
    ];
    return [
      { label: "All Companies", value: "all" },
      ...uniqueCompanies.map((company) => ({
        label: company,
        value: company.toLowerCase(),
      })),
    ];
  }, [allInterns]);

  // Define table columns
  const columns = [
    {
      header: "Student",
      accessor: "name",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.email}</span>
        </div>
      ),
    },
    {
      header: "Company",
      accessor: "companyName",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Building className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.companyName}
        </div>
      ),
    },
    {
      header: "Position",
      accessor: "position",
      sortable: true,
    },
    {
      header: "Evaluation Date",
      accessor: "evaluationDate",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.evaluationDate
            ? format(new Date(item.evaluationDate), "MMM dd, yyyy")
            : "Unknown"}
        </div>
      ),
    },
    {
      header: "Rating",
      accessor: "evaluation.overallRating",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                parseInt(item.evaluation?.overallRating) >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      header: "",
      accessor: "id",
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <>
      {/* Evaluation Detail Dialog */}
      <Dialog
        open={showEvaluationDialog}
        onOpenChange={setShowEvaluationDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Intern Evaluation</span>
              <Badge>{selectedIntern?.companyName}</Badge>
            </DialogTitle>
            <DialogDescription>
              Evaluation for {selectedIntern?.name} ({selectedIntern?.position})
            </DialogDescription>
          </DialogHeader>

          {selectedEvaluation && (
            <div className="space-y-6 mt-4">
              {/* Student and company info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <h3 className="font-medium flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Student
                  </h3>
                  <p className="text-sm mt-1">{selectedIntern?.name}</p>
                </div>
                <div>
                  <h3 className="font-medium flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Company
                  </h3>
                  <p className="text-sm mt-1">{selectedIntern?.companyName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedIntern?.position}
                  </p>
                </div>
              </div>

              {/* Ratings */}
              <div className="space-y-4">
                <h3 className="font-medium">Performance Ratings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overall Rating
                    </p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(selectedEvaluation.overallRating) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Technical Skills
                    </p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(selectedEvaluation.technicalSkills) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Communication
                    </p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(selectedEvaluation.communication) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Teamwork</p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(selectedEvaluation.teamwork) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Punctuality</p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            parseInt(selectedEvaluation.punctuality) >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback sections */}
              <div className="space-y-4 pt-2 border-t">
                <div>
                  <h3 className="font-medium">Overall Comments</h3>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded">
                    {selectedEvaluation.comments || "No comments provided"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Key Strengths</h3>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded">
                    {selectedEvaluation.strengths || "No strengths specified"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Areas for Improvement</h3>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded">
                    {selectedEvaluation.areasToImprove ||
                      "No improvement areas specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Main Supervisor</h3>
                  <p className="text-sm mt-1 bg-muted/50 p-3 rounded">
                    {selectedEvaluation.mainSupervisor ||
                      "No improvement areas specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowEvaluationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Intern Evaluations
          </CardTitle>
          <CardDescription>
            View evaluations submitted by companies for interns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or position..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {companyFilters.length > 1 && (
              <div className="flex items-center space-x-2">
                <Tabs defaultValue="all" onValueChange={setActiveFilter}>
                  <TabsList>
                    <TabsTrigger
                      value="all"
                      className="flex items-center gap-1"
                    >
                      <Filter className="h-4 w-4" />
                      All
                    </TabsTrigger>
                    {companyFilters.slice(1).map((company) => (
                      <TabsTrigger
                        key={company.value}
                        value={company.value}
                        className="flex items-center gap-1"
                      >
                        <Building className="h-4 w-4" />
                        {company.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>

          {/* Evaluations Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredInterns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? "No evaluations found matching your search criteria."
                : "No intern evaluations found."}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredInterns}
              onRowClick={handleViewEvaluation}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
