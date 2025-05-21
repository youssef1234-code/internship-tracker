import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Building,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  Clock,
  Award,
  ArrowLeft,
  Download,
  Upload,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence, steps } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import WarningPopup from "@/components/common/WarningPopup";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
} from "../../utils/indexedDB-utils";
import { sendEmail } from "../../utils/email-utils";
import { addNotification } from "../../utils/notification-utils";
const getAllInternships = () => getAllFromStore("Internships");

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const listItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const saveToIndexedDB = (data) => saveToStore("InternshipApplications", data);

const getFromIndexedDB = (id) => getFromStore("InternshipApplications", id);

export default function InternshipDetail() {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [userType, setUserType] = useState(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showApplicationSuccess, setShowApplicationSuccess] = useState(false);
  const [showApplicationError, setShowApplicationError] = useState(false);
  const [showStatusUpdatePopup, setShowStatusUpdatePopup] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");
  // Get user data from localStorage on component mount
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    if (storedUserType) {
      setUserType(storedUserType);
    }
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      const internships = await getAllInternships();
      const mockInternship = internships.find((i) => i.id == id);
      setInternship(mockInternship);
      setIsLoading(false);

      // Fetch real applicants (for company view)
      if (userType === "company") {
        try {
          const applicationData = await getFromIndexedDB(id);

          if (applicationData && Array.isArray(applicationData.applications)) {
            // Map applications to the expected format with additional info
            const applicantsData = await Promise.all(
              applicationData.applications.map(async (app) => {
                // Try to get additional student info
                try {
                  const studentProfile = await getFromStore(
                    "studentProfiles",
                    app.email
                  );

                  return {
                    id: app.email, // Use email as ID
                    name:
                      app.name ||
                      studentProfile?.name ||
                      app.email.split("@")[0],
                    email: app.email,
                    major:
                      app.major || studentProfile?.major || "Not specified",
                    semester:
                      app.currentSemester ||
                      studentProfile?.currentSemester ||
                      "Not specified",
                    appliedDate:
                      app.appliedDate || new Date().toISOString().split("T")[0],
                    status: app.status || "pending",
                    resume:
                      app.documents && app.documents.length > 0
                        ? app.documents[0]
                        : null,
                    documents: app.documents || [],
                    gpa: app.gpa || studentProfile?.gpa,
                    university: app.university || studentProfile?.university,
                  };
                } catch (error) {
                  console.error(
                    "Error fetching student profile for applicant:",
                    error
                  );
                  return {
                    id: app.email,
                    name: app.name || app.email.split("@")[0],
                    email: app.email,
                    appliedDate:
                      app.appliedDate || new Date().toISOString().split("T")[0],
                    status: app.status || "pending",
                    documents: app.documents || [],
                  };
                }
              })
            );

            setApplicants(applicantsData);
          } else {
            setApplicants([]);
          }
        } catch (error) {
          console.error("Error fetching applicant data:", error);
          setApplicants([]);
        }
      }

      if (userType === "student" || userType === "pro_student") {
        const savedData = await getFromIndexedDB(id);
        const currentStudentEmail = localStorage.getItem("email");

        const applications = Array.isArray(savedData?.applications)
          ? savedData.applications
          : [];

        setHasApplied(
          applications.some((app) => app.email === currentStudentEmail)
        );
      }
    }, 1500);
  }, [id, userType]);

  const handleApply = async () => {
    if (!documents) {
      setShowWarningPopup(true);
      return;
    }

    try {
      const savedData = await getFromIndexedDB(id);
      const currentStudentEmail = localStorage.getItem("email");

      // Fetch student profile data for additional information
      const studentProfile = await getFromStore(
        "studentProfiles",
        currentStudentEmail
      );

      // Additional student info to include with application
      const studentInfo = {
        name: studentProfile?.name || "",
        university: studentProfile?.university || "",
        major: studentProfile?.major || "",
        gpa: studentProfile?.gpa || "",
        graduationYear: studentProfile?.graduationYear || "",
        phoneNumber: studentProfile?.phoneNumber || "",
        currentSemester: studentProfile?.currentSemester || "",
        skills: studentProfile?.skills || [],
      };

      // Construct the new application object
      const newApplication = {
        email: currentStudentEmail,
        company: internship.company,
        position: internship.title,
        startDate: internship.startDate,
        appliedDate: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
        status: "pending",
        endDate: internship.endDate,
        documents: documents, // Save the documents as base64
        ...studentInfo, // Include additional student information
      };

      // Merge with existing applications or start a new array
      const applications = Array.isArray(savedData?.applications)
        ? [...savedData.applications, newApplication]
        : [newApplication];

      const obj = { id: id, applications };

      await saveToIndexedDB(obj);

      // Get company email from company profile using company ID
      const companyProfiles = await getAllFromStore("companyProfiles");
      const companyProfile = companyProfiles.find(
        (profile) => profile.id == internship.company.id
      );

      if (companyProfile && companyProfile.email) {
        const studentName =
          studentProfile?.firstName || currentStudentEmail.split("@")[0];
        const applicationDate = new Date().toLocaleDateString();

        // Send email to company
        await sendEmail({
          recipient: companyProfile.email,
          subject: `New Application for ${internship.title}`,
          content: `
            <p>Hello ${internship.company.name},</p>
            <p>A new application has been submitted for the <strong>${internship.title}</strong> position.</p>
            <p><strong>Applicant:</strong> ${studentName}</p>
            <p><strong>Date Applied:</strong> ${applicationDate}</p>
            <p>You can review this application in your company dashboard.</p>
            <p>Best regards,<br>SCAD Internship System</p>
          `,
        });

        // Send notification to company
        await addNotification({
          message: `New application received for ${internship.title} from ${studentName}`,
          email: companyProfile.email,
          link: `/company/applications/${id}`,
          read: false,
        });
      }

      // send a message and an email to the company
      setShowApplicationSuccess(true);
      setHasApplied(true);
    } catch (error) {
      console.error("Application submission failed:", error);
      setShowApplicationError(true);
    }
  };

  const handleDocumentChange = (e) => {
    if (e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Convert each file to base64
      Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                base64: reader.result,
              });
            };
            reader.onerror = (error) => reject(error);
          });
        })
      )
        .then((encodedDocuments) => {
          setDocuments(encodedDocuments);
        })
        .catch((error) => {
          console.error("Error converting files to base64:", error);
        });
    }
  };

  const handleApplicantStatus = (applicantId, newStatus) => {
    setApplicants((prevApplicants) =>
      prevApplicants.map((applicant) =>
        applicant.id === applicantId
          ? { ...applicant, status: newStatus }
          : applicant
      )
    );

    setSelectedApplicant(null);

    setStatusUpdateMessage(`Applicant status has been updated to ${newStatus}`);
    setShowStatusUpdatePopup(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownloadResume = (applicant) => {
    if (applicant.resume && applicant.resume.base64) {
      try {
        const link = window.document.createElement("a");
        link.href = applicant.resume.base64;
        link.download = applicant.resume.name || `${applicant.name}_resume`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading resume:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="max-w-9xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.98, 1.02, 0.98],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
              >
                <p>Loading internship details...</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!internship) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="max-w-9xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-lg font-semibold mb-4">Internship not found</p>
              <Button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      {showWarningPopup && (
        <WarningPopup
          title="Missing Documents"
          description="Please upload your resume or additional documents"
          type="warning"
          onClose={() => setShowWarningPopup(false)}
        />
      )}

      {showApplicationSuccess && (
        <WarningPopup
          title="Application Submitted"
          description={`Your application for ${internship.title} has been submitted successfully.`}
          type="success"
          onClose={() => setShowApplicationSuccess(false)}
        />
      )}

      {showApplicationError && (
        <WarningPopup
          title="Submission Failed"
          description="An error occurred while submitting your application."
          type="error"
          onClose={() => setShowApplicationError(false)}
        />
      )}

      {showStatusUpdatePopup && (
        <WarningPopup
          title="Status Updated"
          description={statusUpdateMessage}
          type="success"
          onClose={() => setShowStatusUpdatePopup(false)}
        />
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="space-y-6 max-w-9xl mx-auto"
      >
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
        </motion.div>

        <Card as={motion.div} variants={fadeIn}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CardTitle className="text-2xl">{internship.title}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <Building className="mr-2 h-4 w-4" />
                  {internship.company.name} · {internship.company.industry}
                </CardDescription>
              </motion.div>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.3,
                }}
                className="flex-shrink-0 h-16 w-16 rounded border bg-background overflow-hidden flex items-center justify-center"
              >
                {imageError ? (
                  <Briefcase className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <img
                    src={internship.company.logo}
                    alt={`${internship.company.name} logo`}
                    className="h-full w-full object-contain"
                    onError={handleImageError}
                  />
                )}
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key details */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{internship.duration}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Compensation</p>
                  <p className="font-medium">
                    {internship.isPaid ? internship.salary : "Unpaid"}
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{internship.location}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Application Deadline
                  </p>
                  <p className="font-medium">
                    {internship.applicationDeadline}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <Separator />

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground">{internship.description}</p>
            </motion.div>

            {/* Responsibilities */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="font-semibold text-lg mb-2">Responsibilities</h3>
              <motion.ul
                variants={container}
                initial="hidden"
                animate="visible"
                className="list-disc pl-5 space-y-1 text-muted-foreground"
              >
                {internship.responsibilities.map((item, index) => (
                  <motion.li
                    key={index}
                    variants={listItem}
                    transition={{ delay: 0.1 * index }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Qualifications */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h3 className="font-semibold text-lg mb-2">Qualifications</h3>
              <motion.ul
                variants={container}
                initial="hidden"
                animate="visible"
                className="list-disc pl-5 space-y-1 text-muted-foreground"
              >
                {internship.qualifications.map((item, index) => (
                  <motion.li
                    key={index}
                    variants={listItem}
                    transition={{ delay: 0.1 * index }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <h3 className="font-semibold text-lg mb-2">Required Skills</h3>
              <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap gap-2"
              >
                {internship.skills.map((skill, index) => (
                  <motion.div
                    key={index}
                    variants={listItem}
                    whileHover={{ scale: 1.05 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <Badge variant="outline">{skill}</Badge>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Company View - Applicants */}
            {userType === "company" && (
              <>
                <Separator />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <h3 className="font-semibold text-lg mb-4">
                    Applicants ({applicants.length})
                  </h3>

                  <AnimatePresence mode="wait">
                    {selectedApplicant ? (
                      <motion.div
                        key="applicant-detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedApplicant(null)}
                          className="mb-2"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to applicants list
                        </Button>

                        <Card>
                          <CardHeader>
                            <CardTitle>{selectedApplicant.name}</CardTitle>
                            <CardDescription>
                              {selectedApplicant.email}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <motion.div
                              variants={container}
                              initial="hidden"
                              animate="visible"
                              className="grid grid-cols-2 gap-4"
                            >
                              <motion.div variants={listItem}>
                                <p className="text-sm text-muted-foreground">
                                  Major
                                </p>
                                <p className="font-medium">
                                  {selectedApplicant.major}
                                </p>
                              </motion.div>
                              <motion.div variants={listItem}>
                                <p className="text-sm text-muted-foreground">
                                  Semester
                                </p>
                                <p className="font-medium">
                                  {selectedApplicant.semester}
                                </p>
                              </motion.div>
                              <motion.div variants={listItem}>
                                <p className="text-sm text-muted-foreground">
                                  Applied Date
                                </p>
                                <p className="font-medium">
                                  {selectedApplicant.appliedDate}
                                </p>
                              </motion.div>
                              <motion.div variants={listItem}>
                                <p className="text-sm text-muted-foreground">
                                  Status
                                </p>
                                <Badge
                                  variant={
                                    selectedApplicant.status === "pending"
                                      ? "secondary"
                                      : selectedApplicant.status === "finalized"
                                      ? "warning"
                                      : selectedApplicant.status === "accepted"
                                      ? "success"
                                      : "destructive"
                                  }
                                >
                                  {selectedApplicant.status}
                                </Badge>
                              </motion.div>
                            </motion.div>

                            <motion.div variants={listItem}>
                              <h4 className="font-medium mb-2">Documents</h4>
                              <Button
                                variant="outline"
                                className="w-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  handleDownloadResume(selectedApplicant)
                                }
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Resume
                              </Button>
                            </motion.div>
                          </CardContent>
                          <CardFooter className="flex flex-wrap gap-2 justify-end">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleApplicantStatus(
                                    selectedApplicant.id,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleApplicantStatus(
                                    selectedApplicant.id,
                                    "finalized"
                                  )
                                }
                              >
                                Finalize
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() =>
                                  handleApplicantStatus(
                                    selectedApplicant.id,
                                    "accepted"
                                  )
                                }
                              >
                                Accept
                              </Button>
                            </motion.div>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="applicants-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {applicants.length === 0 ? (
                          <p className="text-muted-foreground">
                            No applications received yet.
                          </p>
                        ) : (
                          <motion.div
                            variants={container}
                            initial="hidden"
                            animate="visible"
                          >
                            {applicants.map((applicant, index) => (
                              <motion.div
                                key={applicant.id}
                                variants={listItem}
                                whileHover={{
                                  scale: 1.01,
                                  backgroundColor: "rgba(0,0,0,0.02)",
                                }}
                                transition={{ delay: 0.1 * index }}
                                className="flex justify-between items-center p-4 border rounded-md cursor-pointer"
                                onClick={() => setSelectedApplicant(applicant)}
                              >
                                <div>
                                  <p className="font-medium">
                                    {applicant.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {applicant.major}, Semester{" "}
                                    {applicant.semester}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge
                                    variant={
                                      applicant.status === "pending"
                                        ? "secondary"
                                        : applicant.status === "finalized"
                                        ? "warning"
                                        : applicant.status === "accepted"
                                        ? "success"
                                        : "destructive"
                                    }
                                  >
                                    {applicant.status}
                                  </Badge>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </>
            )}
          </CardContent>

          {/* Footer for student/pro_student - Apply functionality */}
          {(userType === "student" || userType === "pro_student") && (
            <CardFooter>
              <AnimatePresence mode="wait">
                {hasApplied ? (
                  <motion.div
                    key="applied"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full text-center py-2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge variant="success" className="px-4 py-1.5">
                        <Award className="mr-2 h-4 w-4" />
                        Applied
                      </Badge>
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-muted-foreground mt-2"
                    >
                      You have already applied for this internship. You can
                      check your application status in "My Applications".
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="apply"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full space-y-4"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="documents">
                        Upload Resume & Additional Documents
                      </Label>
                      <Input
                        id="documents"
                        type="file"
                        onChange={handleDocumentChange}
                        multiple
                        accept=".pdf,.doc,.docx"
                      />
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: PDF, DOC, DOCX. Max size: 5MB per
                        file.
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button onClick={handleApply} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Apply for this Internship
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </>
  );
}
