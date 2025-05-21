// components/scad/CompanyApprovalList.jsx
import { useState, useEffect } from "react";
import WarningPopup from "@/components/common/WarningPopup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataTable from "../common/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Search, Filter, Eye, Columns, Download } from "lucide-react";
import { getAllFromStore, saveToStore } from "@/utils/indexedDB-utils";
import { downloadBase64File } from "@/utils/file-utils";
import { sendCompanyApprovalEmail } from "@/utils/email-utils";
import { Input } from "@/components/ui/input";

const CompanyApprovalList = () => {
  const [companies, setCompanies] = useState();
  const [filteredCompanies, setFilteredCompanies] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showApprovalSuccess, setShowApprovalSuccess] = useState(false);
  const [showRejectionSuccess, setShowRejectionSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allcompanies = await getAllFromStore("companyProfiles");
        setCompanies(allcompanies);
        setFilteredCompanies(allcompanies);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!companies) return;

    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter((company) =>
        company.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const columns = [
    {
      header: "Company Name",
      accessor: "companyName",
      sortable: true,
    },
    {
      header: "Industry",
      accessor: "industry",
      sortable: true,
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
          case "approved":
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
      key: "industry",
      label: "Industry",
      options: [
        { label: "Healthcare", value: "Healthcare" },
        { label: "Finance", value: "Finance" },
        { label: "Marketing", value: "Marketing" },
        { label: "Technology", value: "Technology" },
      ],
    },
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
  ];

  const handleRowClick = (company) => {
    setDialogOpen(true);
    setSelectedCompany(company);
  };

  const handleApproval = async (company, approval) => {
    try {
      const updatedCompany = {
        ...company,
        status: approval ? "approved" : "rejected",
      };

      await saveToStore("companyProfiles", updatedCompany);

      await sendCompanyApprovalEmail(updatedCompany, approval);

      const updatedCompanies = await getAllFromStore("companyProfiles");
      setCompanies(updatedCompanies);

      if (approval) {
        setShowApprovalSuccess(true);
      } else {
        setShowRejectionSuccess(true);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating company status:", error);
    }
  };

  const handleDocumentDownload = (document) => {
    downloadBase64File(document);
  };

  return (
    <>
      {showApprovalSuccess && (
        <WarningPopup
          title="Company Approved"
          description="The company has been successfully approved"
          type="success"
          onClose={() => setShowApprovalSuccess(false)}
        />
      )}

      {showRejectionSuccess && (
        <WarningPopup
          title="Company Rejected"
          description="The company application has been rejected"
          type="info"
          onClose={() => setShowRejectionSuccess(false)}
        />
      )}

      <Card className="w-full">
        <div>
          <CardHeader>
            <CardTitle>Company Applications</CardTitle>
            <CardDescription>
              Review and approve companies applying to join SCAD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 mb-4 w-1/4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search companies by name"
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <DataTable
              data={filteredCompanies}
              columns={columns}
              isLoading={isLoading}
              filters={filters}
              onRowClick={handleRowClick}
            ></DataTable>
          </CardContent>
        </div>
        {selectedCompany && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCompany.companyName}</DialogTitle>
                <DialogDescription>
                  Review Applied Company Details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">Company Name:</div>
                  <div>{selectedCompany.companyName}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">Company E-mail:</div>
                  <div>{selectedCompany.email}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">Company Industry:</div>
                  <div>{selectedCompany.industry}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">Company Size:</div>
                  <div>{selectedCompany.companySize}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold">Status:</div>
                  <div>
                    <Badge
                      variant={
                        selectedCompany.status === "approved"
                          ? "success"
                          : selectedCompany.status === "rejected"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {selectedCompany.status}
                    </Badge>
                  </div>
                </div>

                {selectedCompany.documents &&
                  selectedCompany.documents.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Verification Documents
                      </h4>
                      <div className="space-y-2">
                        {selectedCompany.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <span className="text-sm truncate flex-1">
                              {doc.name}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 flex items-center"
                              onClick={() => handleDocumentDownload(doc)}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <DialogFooter className="flex justify-between sm:justify-between mt-4">
                {selectedCompany.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(selectedCompany, false)}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      onClick={() => handleApproval(selectedCompany, true)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </>
                )}
                {selectedCompany.status !== "pending" && (
                  <Button onClick={() => setDialogOpen(false)}>Close</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </>
  );
};

export default CompanyApprovalList;
