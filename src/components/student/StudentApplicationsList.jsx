import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DataTable from "../common/DataTable";
import { format } from "date-fns";
import { CalendarIcon, Building, Briefcase } from "lucide-react";
import { getAllFromStore } from "../../utils/indexedDB-utils";

const getAllApplicationsFromIndexedDB = () =>
  getAllFromStore("InternshipApplications");

const StudentApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true);

        // Get the current user's email from localStorage
        const currentUserEmail = localStorage.getItem("email");

        if (!currentUserEmail) {
          console.error("No user email found in localStorage");
          setIsLoading(false);
          return;
        }

        // Get all applications from IndexedDB
        const allApplicationSets = await getAllApplicationsFromIndexedDB();

        // Extract and flatten all applications that match the current user's email
        const userApplications = [];

        allApplicationSets.forEach((appSet) => {
          if (Array.isArray(appSet.applications)) {
            const userApps = appSet.applications.filter(
              (app) => app.email === currentUserEmail
            );
            userApplications.push(...userApps);
          }
        });

        setApplications(userApplications);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load applications:", error);
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status.toLowerCase() === activeTab)
      );
    }
  }, [activeTab, applications]);

  const columns = [
    {
      accessor: "company.name",
      header: "Company",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building size={16} />
          <span>{item.company?.name || "Unknown Company"}</span>
        </div>
      ),
    },
    {
      accessor: "position",
      header: "Position",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} />
          <span>{item.position}</span>
        </div>
      ),
    },
    {
      accessor: "appliedDate",
      header: "Applied Date",
      sortable: true,
      type: "date",
      render: (item) => (
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} />
          <span>{format(new Date(item.appliedDate), "MMM dd, yyyy")}</span>
        </div>
      ),
    },
    {
      accessor: "status",
      header: "Status",
      sortable: true,
      type: "status",
      render: (item) => {
        const status = item.status.toLowerCase();
        let variant;

        switch (status) {
          case "pending":
            variant = "warning";
            break;
          case "finalized":
            variant = "secondary";
            break;
          case "accepted":
            variant = "success";
            break;
          case "rejected":
            variant = "destructive";
            break;
          default:
            variant = "default";
        }

        return <Badge variant={variant}>{item.status}</Badge>;
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                You haven't applied to any internships yet.
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredApplications}
                searchPlaceholder="Search applications..."
                searchKey={["position", "company.name"]}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentApplicationsList;
