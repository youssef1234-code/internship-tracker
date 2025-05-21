import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar as CalendarIcon,
  Briefcase,
  CheckCircle,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/common/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { getFromStore, getAllFromStore } from "../../utils/indexedDB-utils";

const getFromIndexedDB = async (email) =>
  getFromStore("studentProfiles", email);

const getInternshipApplications = () =>
  getAllFromStore("InternshipApplications");

export default function StudentInternships() {
  const navigate = useNavigate();
  const [currentInternships, setCurrentInternships] = useState([]);
  const [pastInternships, setPastInternships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });
  const [activeTab, setActiveTab] = useState("current");
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const loadInternshipData = async () => {
      try {
        setIsLoading(true);

        // Get email from localStorage
        const userEmail = localStorage.getItem("email");

        if (!userEmail) {
          console.error("No user email found");
          setIsLoading(false);
          return;
        }

        // Load current internships from InternshipApplications
        const applications = await getInternshipApplications();

        // Get user applications with 'current' status
        const currentUserApplications = applications.flatMap((app) =>
          Array.isArray(app.applications)
            ? app.applications
                .filter((a) => a.email === userEmail && a.status === "current")
                .map((a) => ({ ...a, id: app.id }))
            : []
        );

        // Get user applications with 'completed' status from applications
        const completedUserApplications = applications.flatMap((app) =>
          Array.isArray(app.applications)
            ? app.applications
                .filter(
                  (a) => a.email === userEmail && a.status === "completed"
                )
                .map((a) => ({ ...a, id: app.id }))
            : []
        );
        console.log("completedUserApplications", completedUserApplications);
        // Remove duplicates for current internships
        const uniqueCurrentApplications = removeDuplicates(
          currentUserApplications,
          ["company.name", "position", "startDate"]
        );
        setCurrentInternships(uniqueCurrentApplications);

        // Load past internships from student profile
        const profileData = await getFromIndexedDB(userEmail);
        let pastProfileInternships = [];

        if (
          profileData &&
          profileData.experiences &&
          Array.isArray(profileData.experiences)
        ) {
          pastProfileInternships = profileData.experiences.filter(
            (exp) => exp.type === "internship"
          );
        }

        // Combine past internships from profile and completed applications
        const allPastInternships = [
          ...pastProfileInternships,
          ...completedUserApplications,
        ];

        // Remove duplicates for past internships (this might be tricky as they have different structures)
        // For now, we'll just concatenate them as the removal logic would be complex
        setPastInternships(allPastInternships);

        setActiveTab("all");
      } catch (error) {
        console.error("Error loading internship data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInternshipData();
  }, []);

  // Function to remove duplicates based on specified properties
  const removeDuplicates = (array, propertyPaths) => {
    const seen = new Set();

    return array.filter((item) => {
      // Create a unique identifier for each item based on the specified properties
      const identifier = propertyPaths
        .map((path) => {
          // Handle nested properties using path notation (e.g., 'company.name')
          const parts = path.split(".");
          let value = item;
          for (const part of parts) {
            value = value?.[part];
            if (value === undefined) break;
          }
          return String(value || "");
        })
        .join("|");

      // If we've seen this identifier before, skip this item
      if (seen.has(identifier)) {
        return false;
      }

      // Otherwise, add it to our set and keep this item
      seen.add(identifier);
      return true;
    });
  };

  // Handle clicking on an internship row
  const handleInternshipClick = (internship) => {
    if (internship.status === "current" && internship.id) {
      // Navigate to internship detail page for current internships
      navigate(`/student/internships/${internship.id}`);
    } else if (internship.status === "completed") {
      // Show popup for completed internships
      setSelectedInternship(internship);
      setShowPopup(true);
    }
  };

  // Close popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedInternship(null);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Parse date string to Date object for comparison
  const parseDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  // Handle date range filter change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Reset date filters
  const handleResetFilters = () => {
    setDateRange({ from: null, to: null });
  };

  // Prepare internship data for the DataTable
  const prepareInternshipData = (internship) => {
    // Check if this is from experiences array or from applications
    const isPast = internship.type === "internship"; // From experiences array
    const isCompleted = internship.status === "completed"; // From applications with completed status

    return {
      id: internship.id || (isPast ? internship.id : null),
      title: internship.position || internship.title,
      company: {
        name: internship.company?.name || internship.company,
        logo: internship.company?.logo || null,
      },
      status: isPast || isCompleted ? "completed" : "current",
      startDate: isPast
        ? formatDate(internship.dateFrom)
        : formatDate(internship.startDate),
      startDateRaw: isPast ? internship.dateFrom : internship.startDate,
      endDateRaw: isPast ? internship.dateTo : null,
      responsibilities: internship.responsibilities || "",
      skills: internship.skills || [],
      dateTo: formatDate(internship.endDate),
      // Keep all original data for the popup
      originalData: internship,
    };
  };

  // Define columns for the DataTable
  const columns = useMemo(
    () => [
      {
        id: "title",
        header: "Position",
        accessor: "title",
        render: (item) => <div className="font-medium">{item.title}</div>,
      },
      {
        id: "company",
        header: "Company",
        accessor: "company.name",
        render: (item) => (
          <div className="flex items-center">
            <div className="h-6 w-6 rounded-full flex items-center justify-center mr-2">
              <span className="text-xs font-bold">
                {item.company.name[0].toUpperCase()}
              </span>
            </div>
            {item.company.name}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessor: "status",
        render: (item) => {
          const status = item.status.toLowerCase();
          const isCurrent = status === "current";
          const variant = isCurrent ? "primary" : "secondary";
          const Icon = isCurrent ? Briefcase : CheckCircle;
          const label = isCurrent ? "Current Intern" : "Completed";

          return (
            <Badge variant={variant}>
              <span className="flex items-center">
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </span>
            </Badge>
          );
        },
      },
      {
        id: "startDate",
        header: "Start Date",
        accessor: "startDate",
        render: (item) => (
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            {item.startDate}
          </div>
        ),
      },
    ],
    []
  );

  // Apply date range filter to internships
  const applyDateFilter = (internships) => {
    if (!dateRange.from && !dateRange.to) {
      return internships;
    }

    return internships.filter((internship) => {
      const startDate = parseDate(internship.startDateRaw);
      const endDate = parseDate(internship.endDateRaw);

      if (!startDate) return false;

      // Filter by start date range
      if (dateRange.from && dateRange.to) {
        // Include if either start date or end date falls within range
        // Or if the internship spans the entire range
        const rangeFrom = new Date(dateRange.from);
        const rangeTo = new Date(dateRange.to);

        // Case 1: Start date falls within range
        if (startDate >= rangeFrom && startDate <= rangeTo) {
          return true;
        }

        // Case 2: End date falls within range (if there is an end date)
        if (endDate && endDate >= rangeFrom && endDate <= rangeTo) {
          return true;
        }

        // Case 3: Internship spans the entire range
        if (startDate <= rangeFrom && (!endDate || endDate >= rangeTo)) {
          return true;
        }

        return false;
      } else if (dateRange.from) {
        // Only filter by "from" date
        return startDate >= new Date(dateRange.from);
      } else if (dateRange.to) {
        // Only filter by "to" date
        return startDate <= new Date(dateRange.to);
      }

      return true;
    });
  };

  // Filter and search logic for prepared data
  const getFilteredInternships = () => {
    let results = [];

    // First, prepare and combine the data from the appropriate sources
    if (activeTab === "all" || activeTab === "current") {
      results = [...results, ...currentInternships.map(prepareInternshipData)];
    }

    if (activeTab === "all" || activeTab === "completed") {
      results = [...results, ...pastInternships.map(prepareInternshipData)];
    }

    // Then apply the date range filter
    return applyDateFilter(results);
  };
  const filteredInternships = getFilteredInternships();

  // Date Range Filter UI component (rendered outside of DataTable filters)
  const DateRangeFilterUI = () => (
    <div className="mb-4 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center">
          <Filter className="h-4 w-4 mr-1" />
          Date Range Filter
        </h3>
        {(dateRange.from || dateRange.to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        {/* From Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-1/2 justify-start text-left font-normal"
            >
              {dateRange.from ? format(dateRange.from, "PPP") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) =>
                handleDateRangeChange({ ...dateRange, from: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* To Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-1/2 justify-start text-left font-normal"
            >
              {dateRange.to ? format(dateRange.to, "PPP") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) =>
                handleDateRangeChange({ ...dateRange, to: date })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
  console.log("Selected Internship", selectedInternship);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Internship History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All Internships</TabsTrigger>
              <TabsTrigger value="current">
                <Briefcase className="h-4 w-4 mr-2" />
                Current
              </TabsTrigger>
              <TabsTrigger value="completed">
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
            </TabsList>

            {/* Date Range Filter UI - Added above the tabs content */}
            <DateRangeFilterUI />

            <TabsContent value="all" className="mt-0">
              <DataTable
                data={filteredInternships}
                columns={columns}
                filters={[]} // Empty filters array
                searchFields={["title", "company.name", "skills"]}
                onRowClick={handleInternshipClick}
                isLoading={isLoading}
                tableId="all-internships"
              />
            </TabsContent>

            <TabsContent value="current" className="mt-0">
              <DataTable
                data={applyDateFilter(
                  currentInternships.map(prepareInternshipData)
                )}
                columns={columns}
                filters={[]} // Empty filters array
                searchFields={["title", "company.name", "skills"]}
                onRowClick={handleInternshipClick}
                isLoading={isLoading}
                tableId="current-internships"
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <DataTable
                data={applyDateFilter(
                  pastInternships.map(prepareInternshipData)
                )}
                columns={columns}
                filters={[]} // Empty filters array
                searchFields={["title", "company.name", "skills"]}
                onRowClick={handleInternshipClick}
                isLoading={isLoading}
                tableId="completed-internships"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Animated Popup for Completed Internship Details */}
      <AnimatePresence>
        {showPopup && selectedInternship && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClosePopup}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold">
                      {`${selectedInternship.title} at ${selectedInternship.company.name}`}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClosePopup}
                      className="ml-4"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Duration</h3>
                  <div className="flex items-center text-gray-700">
                    <CalendarIcon className="h-5 w-5 mr-2 " />
                    <span>
                      {selectedInternship.startDate} -{" "}
                      {selectedInternship.dateTo}
                    </span>
                  </div>
                </div>

                {selectedInternship.responsibilities && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Responsibilities
                    </h3>
                    <p className="text-gray-700">
                      {selectedInternship.responsibilities}
                    </p>
                  </div>
                )}

                {selectedInternship.skills &&
                  selectedInternship.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedInternship.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Badge variant="secondary">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Internship Completed
                  </Badge>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
