import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { PlusCircle, Trash2, Save, Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import WarningPopup from "@/components/common/WarningPopup";
import {
  getFromStore,
  saveToStore,
  getAllFromStore,
} from "../../utils/indexedDB-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const experienceItemVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginBottom: 8,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const buttonHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

const studentProfileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  major: z.string().min(1, { message: "Major is required" }),
  semester: z.string().min(1, { message: "Semester is required" }),
  interests: z.string().optional(),
  bio: z.string().optional(),
});

const saveToIndexedDB = (data) => saveToStore("studentProfiles", data);

const getFromIndexedDB = (email) => getFromStore("studentProfiles", email);

const getStudentsResults = (email) => getFromStore("AssessmentResults", email);

const saveStudentResults = (data) => saveToStore("AssessmentResults", data);

// Function to fetch company views for a student
const getCompanyViews = (email) => getFromStore("companyViews", email);

const StudentProfileForm = ({ ispro_student = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [studentResults, setStudentResults] = useState([]);
  const [companyViews, setCompanyViews] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  const [newExperience, setNewExperience] = useState({
    type: "internship", // internship, job, activity
    company: "",
    title: "",
    dateFrom: "",
    dateTo: "",
    responsibilities: "",
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      major: "",
      semester: "",
      interests: "",
      bio: "",
    },
    resolver: zodResolver(studentProfileSchema),
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        // Get email from localStorage
        const userEmail = localStorage.getItem("email");

        if (userEmail) {
          const isPRO = localStorage.getItem("userType") == "pro_student";
          setIsPro(isPRO);
          if (isPRO) {
            const res = await getStudentsResults(userEmail);
            setStudentResults(res ? res.assessmentResults : []);

            // Fetch company views
            const viewsData = await getCompanyViews(userEmail);
            if (viewsData && viewsData.views) {
              // Sort by latest view
              const sortedViews = [...viewsData.views].sort(
                (a, b) => new Date(b.lastViewed) - new Date(a.lastViewed)
              );
              setCompanyViews(sortedViews);
            }
          }
          // Set the email in the form
          form.setValue("email", userEmail);

          // Try to get profile data from IndexedDB
          const profileData = await getFromIndexedDB(userEmail);

          if (profileData) {
            // Populate form with data from IndexedDB
            form.setValue("firstName", profileData.firstName || "");
            form.setValue("lastName", profileData.lastName || "");
            form.setValue("major", profileData.major || "");
            form.setValue("semester", profileData.semester || "");
            form.setValue("interests", profileData.interests || "");
            form.setValue("bio", profileData.bio || "");

            // Set experiences
            if (
              profileData.experiences &&
              Array.isArray(profileData.experiences)
            ) {
              setExperiences(profileData.experiences);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleAddExperience = () => {
    if (newExperience.company && newExperience.title) {
      setExperiences([...experiences, { ...newExperience, id: Date.now() }]);
      setNewExperience({
        type: "internship",
        company: "",
        title: "",
        dateFrom: "",
        dateTo: "",
        responsibilities: "",
      });
    }
  };

  const handleRemoveExperience = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleToggleChange = async (checked, res) => {
    const userEmail = localStorage.getItem("email");
    const savedRecord = await getStudentsResults(userEmail);
    console.log("savedRecord", savedRecord);
    const target = savedRecord.assessmentResults.find((o) => o.id == res.id);
    if (target) {
      target.showRes = checked;
      saveStudentResults(savedRecord);
      setStudentResults(savedRecord.assessmentResults);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const email = localStorage.getItem("email") || data.email;
      const profileData = {
        ...data,
        email,
        experiences,
        ispro_student,
        updatedAt: new Date().toISOString(),
      };

      await saveToIndexedDB(profileData);

      if (!localStorage.getItem("email")) {
        localStorage.setItem("email", email);
      }

      console.log("Student profile data saved:", profileData);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      setShowErrorPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {showSuccessPopup && (
        <WarningPopup
          title="Profile Updated"
          description="Your profile has been updated successfully!"
          type="success"
          onClose={() => setShowSuccessPopup(false)}
        />
      )}
      {showErrorPopup && (
        <WarningPopup
          title="Update Failed"
          description="Failed to save profile. Please try again."
          type="error"
          onClose={() => setShowErrorPopup(false)}
        />
      )}
      <Card className="w-full max-w-full mx-auto">
        <CardHeader>
          <motion.div
            className="flex justify-between items-center"
            variants={itemVariants}
          >
            <div>
              <CardTitle>Student Profile</CardTitle>
              <CardDescription>
                Update your profile information to help find matching
                internships
              </CardDescription>
            </div>
            {ispro_student && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Badge className="bg-purple-600 hover:bg-purple-700">
                  PRO Student
                </Badge>
              </motion.div>
            )}
          </motion.div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={itemVariants}
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="student@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={itemVariants}
              >
                <FormField
                  control={form.control}
                  name="major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Major <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your major" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="computer_science">
                            Computer Science
                          </SelectItem>
                          <SelectItem value="business">
                            Business Administration
                          </SelectItem>
                          <SelectItem value="engineering">
                            Engineering
                          </SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="communication">
                            Communication
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Semester <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={String(sem)}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Interests</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your job interests separated by commas (e.g., Web Development, Data Analysis, UX Design)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This helps us suggest companies based on your interests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About Me</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a short bio about yourself"
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {isPro && studentResults && (
                <motion.div
                  className="border rounded-lg p-4"
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-medium mb-4">Test Results</h3>
                  <AnimatePresence>
                    {studentResults.length > 0 && (
                      <Accordion type="single" collapsible className="mb-4">
                        {studentResults.map((res) => (
                          <motion.div
                            key={res.id}
                            variants={experienceItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                          >
                            <AccordionItem value={`exp-${res.id}`}>
                              <div className="flex items-center justify-between w-full pr-4 mb-4">
                                <span>{res.title}</span>
                                <Badge variant="default">{res.result}</Badge>
                                <Switch
                                  id={`toggle-${res.id}`}
                                  checked={res.showRes}
                                  onCheckedChange={(checked) =>
                                    handleToggleChange(checked, res)
                                  }
                                />
                              </div>
                            </AccordionItem>
                          </motion.div>
                        ))}
                      </Accordion>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Company Views Section - Only visible for PRO students */}
              {isPro && (
                <motion.div
                  className="border rounded-lg p-4"
                  variants={itemVariants}
                >
                  <h3 className="text-lg font-medium mb-4">Profile Views</h3>
                  <div className="space-y-3">
                    {companyViews.length > 0 ? (
                      companyViews.map((view, index) => (
                        <motion.div
                          key={index}
                          variants={experienceItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="flex justify-between items-center p-3 bg-muted/50 rounded-md"
                        >
                          <div>
                            <p className="font-medium">{view.companyName}</p>
                            <p className="text-xs text-muted-foreground">
                              Last viewed:{" "}
                              {new Date(view.lastViewed).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                              {view.viewCount}{" "}
                              {view.viewCount === 1 ? "view" : "views"}
                            </Badge>
                            <Badge variant="secondary">
                              {new Date(
                                view.firstViewed
                              ).toLocaleDateString() ===
                              new Date(view.lastViewed).toLocaleDateString()
                                ? "New"
                                : "Returning"}
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No companies have viewed your profile yet. Complete your
                        profile to increase visibility.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              <motion.div
                className="border rounded-lg p-4"
                variants={itemVariants}
              >
                <h3 className="text-lg font-medium mb-4">Experience</h3>

                <AnimatePresence>
                  {experiences.length > 0 && (
                    <Accordion type="single" collapsible className="mb-4">
                      {experiences.map((exp, index) => (
                        <motion.div
                          key={exp.id}
                          variants={experienceItemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                        >
                          <AccordionItem value={`item-${exp.id}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <span>
                                  {exp.title} at {exp.company}
                                </span>
                                <Badge
                                  variant={
                                    exp.type === "internship"
                                      ? "default"
                                      : exp.type === "job"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {exp.type}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between">
                                  <p>
                                    <strong>Period:</strong>{" "}
                                    {formatDateRange(exp.dateFrom, exp.dateTo)}
                                  </p>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveExperience(exp.id)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                  </motion.div>
                                </div>
                                <p>
                                  <strong>Responsibilities:</strong>
                                </p>
                                <p className="text-gray-600">
                                  {exp.responsibilities}
                                </p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </motion.div>
                      ))}
                    </Accordion>
                  )}
                </AnimatePresence>

                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-sm font-medium">Add New Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={newExperience.type}
                        onValueChange={(value) =>
                          setNewExperience({ ...newExperience, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="job">Part-time Job</SelectItem>
                          <SelectItem value="activity">
                            College Activity
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        Company/Organization
                      </label>
                      <Input
                        placeholder="Company name"
                        value={newExperience.company}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            company: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Title/Position
                      </label>
                      <Input
                        placeholder="Your title"
                        value={newExperience.title}
                        onChange={(e) =>
                          setNewExperience({
                            ...newExperience,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Date From</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newExperience.dateFrom && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newExperience.dateFrom ? (
                              format(parseISO(newExperience.dateFrom), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              newExperience.dateFrom
                                ? parseISO(newExperience.dateFrom)
                                : undefined
                            }
                            onSelect={(date) =>
                              setNewExperience({
                                ...newExperience,
                                dateFrom: date ? date.toISOString() : "",
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date To</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newExperience.dateTo && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newExperience.dateTo ? (
                              format(parseISO(newExperience.dateTo), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={
                              newExperience.dateTo
                                ? parseISO(newExperience.dateTo)
                                : undefined
                            }
                            onSelect={(date) =>
                              setNewExperience({
                                ...newExperience,
                                dateTo: date ? date.toISOString() : "",
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Responsibilities
                    </label>
                    <Textarea
                      placeholder="Describe your responsibilities"
                      value={newExperience.responsibilities}
                      onChange={(e) =>
                        setNewExperience({
                          ...newExperience,
                          responsibilities: e.target.value,
                        })
                      }
                    />
                  </div>

                  <motion.div
                    variants={buttonHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddExperience}
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" /> Add Experience
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Profile
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Helper function to format date range for display
const formatDateRange = (dateFrom, dateTo) => {
  if (!dateFrom) return "Not specified";

  const formattedFrom = format(parseISO(dateFrom), "MMM yyyy");
  const formattedTo = dateTo ? format(parseISO(dateTo), "MMM yyyy") : "Present";

  return `${formattedFrom} - ${formattedTo}`;
};

export default StudentProfileForm;
