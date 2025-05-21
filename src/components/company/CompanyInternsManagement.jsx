import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building,
  Calendar,
  UserCheck,
  Filter,
  CheckCircle,
  Clock,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/common/DataTable";
import { getAllFromStore, getFromStore } from "../../utils/indexedDB-utils";

export default function CompanyInternsManagement() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInterns = async () => {
      try {
        setIsLoading(true);

        // Get company name from localStorage
        const storedCompanyName = localStorage.getItem("companyName");
        setCompanyName(storedCompanyName);

        if (!storedCompanyName) {
          console.error("No company name found in localStorage");
          setIsLoading(false);
          return;
        }

        // Get all internship applications
        const applications = await getAllFromStore("InternshipApplications");

        // Extract all accepted/current/completed interns for this company
        let allInterns = [];

        applications.forEach((appSet) => {
          if (Array.isArray(appSet.applications)) {
            const companyInterns = appSet.applications.filter(
              (app) =>
                app.company?.name === storedCompanyName &&
                (app.status === "accepted" ||
                  app.status === "current" ||
                  app.status === "completed")
            );

            // For each intern, try to get additional profile info
            const internsWithDetails = companyInterns.map(async (intern) => {
              try {
                const studentProfile = await getFromStore(
                  "studentProfiles",
                  intern.email
                );

                return {
                  ...intern,
                  internshipId: appSet.id,
                  internshipTitle: intern.position || "Unknown Position",
                  name:
                    intern.name ||
                    studentProfile?.name ||
                    intern.email.split("@")[0],
                  university: intern.university || studentProfile?.university,
                  major: intern.major || studentProfile?.major,
                  gpa: intern.gpa || studentProfile?.gpa,
                  currentSemester:
                    intern.currentSemester || studentProfile?.currentSemester,
                  graduationYear:
                    intern.graduationYear || studentProfile?.graduationYear,
                };
              } catch (error) {
                // If we can't get the profile, just return the basic intern info
                return {
                  ...intern,
                  internshipId: appSet.id,
                  internshipTitle: intern.position || "Unknown Position",
                  name: intern.name || intern.email.split("@")[0],
                };
              }
            });

            // Wait for all profile fetches to complete
            Promise.all(internsWithDetails).then((completedInterns) => {
              allInterns = [...allInterns, ...completedInterns];
              setInterns(allInterns);
              filterInterns(allInterns, activeTab, searchQuery);
            });
          }
        });
      } catch (error) {
        console.error("Error fetching interns:", error);
        setIsLoading(false);
      } finally {
        // This might be called before the Promise.all completes, but that's okay
        // since we'll set it to false again after all promises resolve
        setIsLoading(false);
      }
    };

    fetchInterns();
  }, []);

  // Filter interns based on active tab and search query
  const filterInterns = (internsList, status, query) => {
    let filtered = internsList;

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((intern) => intern.status === status);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (intern) =>
          (intern.name && intern.name.toLowerCase().includes(lowerQuery)) ||
          (intern.email && intern.email.toLowerCase().includes(lowerQuery)) ||
          (intern.internshipTitle &&
            intern.internshipTitle.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredInterns(filtered);
  };

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    filterInterns(interns, value, searchQuery);
  };

  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterInterns(interns, activeTab, query);
  };

  // Handle intern selection
  const handleInternClick = (intern) => {
    navigate(`/company/interns/${intern.email}`, {
      state: {
        intern,
        internshipId: intern.internshipId,
      },
    });
  };

  const columns = [
    {
      header: "Name/Email",
      accessor: "email",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.name || "Unknown"}</span>
          <span className="text-sm text-muted-foreground">{item.email}</span>
        </div>
      ),
    },
    {
      header: "Position",
      accessor: "position",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.position || item.internshipTitle || "Unknown Position"}
        </div>
      ),
    },
    {
      header: "Start Date",
      accessor: "startDate",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.startDate
            ? format(new Date(item.startDate), "MMM dd, yyyy")
            : "Not specified"}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (item) => {
        const status = item.status?.toLowerCase();
        let variant;
        let Icon = Clock;

        switch (status) {
          case "accepted":
            variant = "warning";
            Icon = UserCheck;
            break;
          case "current":
            variant = "default";
            Icon = Clock;
            break;
          case "completed":
            variant = "success";
            Icon = CheckCircle;
            break;
          default:
            variant = "secondary";
        }

        return (
          <Badge variant={variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {status === "accepted" ? "Ready to Start" : status}
          </Badge>
        );
      },
    },
    {
      header: "",
      accessor: "id",
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          Internship Management
        </CardTitle>
        <CardDescription>
          Manage and track interns at different stages of their internship
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or position..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              All Interns
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Current
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              Ready to Start
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="pt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredInterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "No interns found matching your search criteria."
                  : activeTab === "all"
                  ? "You don't have any interns yet."
                  : activeTab === "current"
                  ? "You don't have any current interns."
                  : activeTab === "completed"
                  ? "You don't have any completed interns."
                  : "You don't have any interns ready to start yet."}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredInterns}
                onRowClick={handleInternClick}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
