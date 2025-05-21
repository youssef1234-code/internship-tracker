import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Calendar,
  DollarSign,
  Tag,
  ChevronRight,
} from "lucide-react";
import DataTable from "@/components/common/DataTable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import InternshipSuggestions from "./InternshipSuggestions";
import { getAllFromStore } from "../../utils/indexedDB-utils";

const getAllInternships = () => getAllFromStore("Internships");

export default function InternshipListing({ companyOnly = false }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [userType, setUserType] = useState(null);
  const [internships, setInternships] = useState([]);

  // Get user data from localStorage on component mount
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    if (storedUserType) {
      setUserType(storedUserType);
    }

    // Fetch internships data
    const fetchInternships = async () => {
      setIsLoading(true); // Ensure loading state while fetching
      try {
        const data = await getAllInternships();
        setInternships(data);
      } catch (error) {
        console.error("Error fetching internships:", error);
      } finally {
        setIsLoading(false); // Set loading to false when done
      }
    };

    fetchInternships();
  }, []);

  // Filter internships if in company-only mode
  const filteredInternships = companyOnly
    ? internships.filter((internship) => internship.company.id === 101) // Mocking the current company ID
    : internships;

  const columns = [
    {
      header: "Job Title",
      accessor: "title",
      sortable: true,
    },
    {
      header: "Company",
      accessor: "company.name",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Building className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.company.name}
        </div>
      ),
    },
    {
      header: "Duration",
      accessor: "duration",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.duration}
        </div>
      ),
    },
    {
      header: "Compensation",
      accessor: "isPaid",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.isPaid ? item.salary : "Unpaid"}
        </div>
      ),
    },
    {
      header: "Industry",
      accessor: "company.industry",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">
          <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
          {item.company.industry}
        </div>
      ),
    },
    {
      header: "",
      accessor: "id",
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  // If in company mode, add applications count column
  if (userType === "company" && companyOnly) {
    columns.splice(5, 0, {
      header: "Applications",
      accessor: "applications",
      sortable: true,
    });
  }

  const filters = [
    {
      key: "company.industry",
      label: "Industry",
      options: [
        { label: "Technology", value: "Technology" },
        { label: "Marketing", value: "Marketing" },
        { label: "Healthcare", value: "Healthcare" },
        { label: "Finance", value: "Finance" },
      ],
    },
    {
      key: "duration",
      label: "Duration",
      options: [
        { label: "3 months", value: "3 months" },
        { label: "4 months", value: "4 months" },
        { label: "6 months", value: "6 months" },
      ],
    },
    {
      key: "isPaid",
      label: "Compensation",
      options: [
        { label: "Paid", value: true },
        { label: "Unpaid", value: false },
      ],
    },
  ];

  const handleInternshipClick = (internship) => {
    navigate(`/${userType}/internships/${internship.id}`);
  };

  return (
    <>
      {/* Only render suggestions if data is loaded and user is student */}
      {!isLoading &&
        (userType === "student" || userType === "pro_student") &&
        !companyOnly &&
        internships.length > 0 && (
          <div className="mb-8">
            <InternshipSuggestions allInternships={internships} />
          </div>
        )}

      <Card>
        <CardHeader>
          <CardTitle>
            {companyOnly ? "My Company's Internships" : "Available Internships"}
          </CardTitle>
          <CardDescription>
            {companyOnly
              ? "Manage and view applications for your company's internship listings"
              : "Browse and filter through available internship opportunities"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredInternships}
            columns={columns}
            filters={filters}
            searchFields={["title", "company.name", "skills"]}
            onRowClick={handleInternshipClick}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
}
