import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Building, Briefcase } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getAllFromStore } from "../../utils/indexedDB-utils";

export default function CompanyApplicationsList({ companyOnly = true }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  const handleApplicationClick = (application) => {
    navigate(`/${userType}/applications/${application.email}`);
  };

  // Get user data from localStorage and fetch internships and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUserType = localStorage.getItem("userType");
        const storedCompanyName = localStorage.getItem("companyName");

        if (storedUserType) {
          setUserType(storedUserType);
        }

        if (storedCompanyName) {
          setCompanyName(storedCompanyName);

          // Fetch all internships and applications
          const allInternships = await getAllFromStore("Internships");
          const allApplications = await getAllFromStore(
            "InternshipApplications"
          );

          // Filter internships by company name
          const companyInternships = allInternships.filter(
            (internship) => internship.company.name === storedCompanyName
          );

          // Get applications only for company's internships
          if (companyInternships.length > 0) {
            const companyInternshipIds = companyInternships.map(
              (internship) => internship.id
            );

            // Filter applications for company's internships and flatten the structure
            const companyApplications = allApplications
              .filter((appItem) =>
                companyInternshipIds.map(String).includes(appItem.id)
              )
              .flatMap((appItem) => {
                const internship = companyInternships.find(
                  (i) => i.id == appItem.id
                );
                return appItem.applications.map((app) => ({
                  ...app,
                  internshipId: appItem.id,
                  internshipTitle: internship
                    ? internship.title
                    : "Unknown Internship",
                }));
              });

            setFilteredApplications(companyApplications);
          } else {
            setFilteredApplications([]);
          }
        }
      } catch (error) {
        console.error("Error in data fetching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const columns = [
    {
      accessor: "email",
      header: "Email",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>{item.email}</span>
        </div>
      ),
    },
    {
      accessor: "internshipTitle",
      header: "Internship",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} />
          <span>{item.internshipTitle}</span>
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

  const filters = [
    {
      key: "internshipTitle",
      label: "Internship",
      options: [
        ...new Set(filteredApplications.map((app) => app.internshipTitle)),
      ].map((title) => ({ label: title, value: title })),
    },
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "finalized" },
        { label: "Rejected", value: "accepted" },
        { label: "Finalized", value: "rejected" },
        { label: "Completed", value: "completed" },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"My Company's Applications"}</CardTitle>
        <CardDescription>
          {
            "Manage and view applications for your company's internship listings"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={filteredApplications}
          columns={columns}
          filters={filters}
          searchFields={["email", "internshipTitle"]}
          isLoading={isLoading}
          onRowClick={handleApplicationClick}
        />
      </CardContent>
    </Card>
  );
}
