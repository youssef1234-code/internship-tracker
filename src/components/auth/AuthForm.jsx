import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFromStore, getAllFromStore } from "@/utils/indexedDB-utils";
import { differenceInDays, parseISO } from "date-fns";
import { addNotification } from "@/utils/notification-utils";

const isUserPro = async (email) => {
  try {
    const profileResult = await getFromStore("studentProfiles", email);
    let totalDurationInDays = 0;

    if (profileResult && profileResult.experiences) {
      const pastProfileInternships = profileResult.experiences.filter(
        (i) => i.type === "internship"
      );

      pastProfileInternships.forEach((experience) => {
        const dateFrom = experience.dateFrom
          ? parseISO(experience.dateFrom)
          : null;
        const dateTo = experience.dateTo ? parseISO(experience.dateTo) : null;

        if (dateFrom && dateTo) {
          const durationInDays = differenceInDays(dateTo, dateFrom);
          totalDurationInDays += Math.max(0, durationInDays);
        }
      });
    }

    const applications = await getAllFromStore("InternshipApplications");

    const completedUserApplications = applications.flatMap((app) =>
      Array.isArray(app.applications)
        ? app.applications
            .filter((a) => a.email === email && a.status === "completed")
            .map((a) => ({ ...a, id: app.id }))
        : []
    );

    completedUserApplications.forEach((application) => {
      const startDate = application.startDate
        ? parseISO(application.startDate)
        : null;
      const endDate = application.endDate
        ? parseISO(application.endDate)
        : null;

      const completionDate = application.completionDate
        ? parseISO(application.completionDate)
        : null;

      if (startDate && (endDate || completionDate)) {
        const finalEndDate = endDate || completionDate;
        const durationInDays = differenceInDays(finalEndDate, startDate);
        totalDurationInDays += Math.max(0, durationInDays);
      }
    });

    console.log(
      "Total internship duration in days (incl. completed applications):",
      totalDurationInDays
    );
    return totalDurationInDays >= 90;
  } catch (error) {
    console.error("Error checking pro status:", error);
    return false;
  }
};

const AuthForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("student");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      if (isRegistering) {
        if (userType === "company") {
          localStorage.setItem("email", email);
          localStorage.setItem("companyName", companyName);
          navigate("/register");
          return;
        }

        if (userType === "student") {
          const userData = {
            email,
            role: userType,
            name: email.split("@")[0],
          };

          localStorage.setItem("email", email);
          localStorage.setItem("userType", userType);

          onLogin(userData);
          navigate("/student/profile");
          return;
        }

        setError("Registration not available for this user type");
        setIsLoading(false);
        return;
      }

      if (userType === "student") {
        const studentProfile = await getFromStore("studentProfiles", email);

        if (!studentProfile) {
          localStorage.setItem("email", email);
          localStorage.setItem("userType", userType);
          const userData = { email, role: userType, name: email.split("@")[0] };
          onLogin(userData);
          navigate("/student/profile");
          setError("Please complete your profile first");
          return;
        } else if (
          !studentProfile.firstName ||
          !studentProfile.lastName ||
          !studentProfile.email ||
          !studentProfile.major ||
          !studentProfile.semester
        ) {
          localStorage.setItem("email", email);
          localStorage.setItem("userType", userType);
          const userData = { email, role: userType, name: email.split("@")[0] };
          onLogin(userData);
          navigate("/student/profile");
          setError("Please complete all required fields in your profile");
          return;
        }

        const isProStudent = await isUserPro(email);
        if (isProStudent) {
          localStorage.setItem("userType", "pro_student");
        } else {
          localStorage.setItem("userType", userType);
        }

        localStorage.setItem("email", email);
        const userData = {
          email,
          role: isProStudent ? "pro_student" : userType,
          name: `${studentProfile.firstName} ${studentProfile.lastName}`,
        };
        onLogin(userData);
        navigate("/internships");
      } else if (userType === "company") {
        const companyProfile = await getFromStore("companyProfiles", email);

        if (!companyProfile) {
          setError("Company not found. Please register first");
          setIsLoading(false);
          return;
        }

        if (
          companyProfile.status == "rejected" ||
          companyProfile.status == "pending"
        ) {
          const msg =
            companyProfile.status == "rejected"
              ? "Your company has been rejected. Please check your email for more details"
              : "Your company has not been approved yet. Please wait for approval from SCAD";
          setError(msg);
          setIsLoading(false);
          return;
        }

        localStorage.setItem("userType", userType);
        localStorage.setItem("email", email);
        localStorage.setItem("companyName", companyProfile.companyName);

        const userData = {
          email,
          role: userType,
          name: companyProfile.companyName,
        };

        onLogin(userData);
        navigate("/company/internships");
      } else {
        localStorage.setItem("userType", userType);
        localStorage.setItem("email", email);

        const userData = {
          email,
          role: userType,
          name: email.split("@")[0],
        };

        onLogin(userData);
        navigate("/scad");
      }

      const startDate = localStorage.getItem("startDate");
      if (startDate) {
        const [day, month, year] = startDate.split("/").map(Number);
        const startDateObj = new Date(year, month - 1, day);
        const currentDate = new Date();
        const daysLeft = differenceInDays(startDateObj, currentDate);

        if (daysLeft > 0 && daysLeft <= 7) {
          const message = {
            global: true,
            userRole: "student",
            message: `Please note that there are ${daysLeft} days left until the new internship cycle`,
          };
          addNotification(message);
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError("An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const formItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.1, duration: 0.5 },
    }),
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <motion.div initial="hidden" animate="visible" variants={cardVariants}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {isRegistering ? "Register" : "Login"} to SCAD System
                </CardTitle>
                <CardDescription>
                  {isRegistering
                    ? "Create a new account to access the SCAD system"
                    : "Enter your credentials to access the SCAD system"}
                </CardDescription>
              </div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/mailbox")}
                  title="Check your mailbox"
                >
                  <Mail className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.div
                className="space-y-2"
                variants={formItemVariants}
                custom={1}
                initial="hidden"
                animate="visible"
              >
                <Label htmlFor="userType">I am a:</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="scad_office">SCAD Office</SelectItem>
                    <SelectItem value="faculty_member">
                      Faculty Member
                    </SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                className="space-y-2"
                variants={formItemVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              >
                {userType == "company" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Enter your company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                )}
              </motion.div>

              <motion.div
                className="space-y-2"
                variants={formItemVariants}
                custom={2}
                initial="hidden"
                animate="visible"
              >
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </motion.div>

              <motion.div
                className="space-y-2"
                variants={formItemVariants}
                custom={3}
                initial="hidden"
                animate="visible"
              >
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </motion.div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <motion.div
                className="w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRegistering ? "Registering..." : "Logging in..."}
                    </>
                  ) : isRegistering ? (
                    "Register"
                  ) : (
                    "Login"
                  )}
                </Button>
              </motion.div>

              <motion.div
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="w-full"
                >
                  {isRegistering
                    ? "Already have an account? Login"
                    : "Don't have an account? Register"}
                </Button>
              </motion.div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthForm;
