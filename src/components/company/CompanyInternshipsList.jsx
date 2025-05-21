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
} from "../ui/card.tsx";
import { getAllFromStore } from "../../utils/indexedDB-utils";

const getAllApplications = () => getAllFromStore("InternshipApplications");
const getAllInternships = () => getAllFromStore("Internships");

export default function InternshipListing({ companyOnly = true }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState("company");
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [myInternships, setMyInternships] = useState([]);

  const fetchInternships = async () => {
    try {
      const data = await getAllInternships();
      return data; // Set the actual data, not the function
    } catch (error) {
      console.error("Error fetching internships:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const allInternships = await fetchInternships();
        const companyName = localStorage.getItem("companyName");

        if (!companyName) {
          if (isMounted) {
            setIsLoading(false);
            setFilteredInternships([]);
          }
          return;
        }

        const allApps = await getAllApplications();

        // Process internships to include application counts
        const updatedInternships = allInternships.map((internship) => {
          const relatedApps = allApps.filter((app) => app.id == internship.id);
          const size =
            relatedApps && relatedApps.length > 0 && relatedApps[0].applications
              ? relatedApps[0].applications.length
              : 0;
          return { ...internship, size };
        });

        const filtered = updatedInternships.filter(
          (i) => i.company.name === companyName
        );

        setMyInternships(
          filtered.map((i) => {
            return { label: i.title, value: i.title };
          })
        );

        if (isMounted) {
          setFilteredInternships(filtered);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        if (isMounted) {
          setIsLoading(false);
          setFilteredInternships([]);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [companyOnly]);

  const columns = [
    {
      header: "Job Title",
      accessor: "title",
      sortable: true,
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
      header: "Submissions",
      accessor: "size",
      sortable: true,
      render: (item) => (
        <div className="flex items-center">{item.size || 0}</div>
      ),
    },
  ];

  const filters = [
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
    {
      key: "title",
      label: "Internship",
      options: myInternships,
    },
  ];

  const handleInternshipClick = (internship) => {
    navigate(`/company/internships/${internship.id}`);
  };

  return (
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
          searchFields={["title", "skills"]}
          isLoading={isLoading}
          onRowClick={handleInternshipClick}
        />
      </CardContent>
    </Card>
  );
}

