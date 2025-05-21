import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { Switch } from "../ui/switch.tsx";
import { differenceInMonths, format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover.tsx";
import { cn } from "../../lib/utils.ts";
import { Calendar } from "../ui/calendar.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { CalendarIcon, Edit, Trash2 } from "lucide-react";
import WarningPopup from "@/components/common/WarningPopup";
import {
  saveToStore,
  getFromStore,
  getAllFromStore,
  deleteFromStore,
} from "../../utils/indexedDB-utils";

const InternshipPosts = () => {
  const [isPaid, setIsPaid] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({
    title: "",
    description: "",
    type: "success",
  });
  const [companyInternships, setCompanyInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      applications: 0,
      applicationDeadline: "",
      location: "",
      isPaid: false,
      salary: "",
      duration: "",
      skills: "",
      industry: "",
      startDate: "",
      endDate: "",
      qualifications: "",
      responsibilities: "",
    },
  });

  useEffect(() => {
    fetchCompanyInternships();
  }, []);

  useEffect(() => {
    if (isEditing && selectedInternship) {
      form.reset({
        title: selectedInternship.title || "",
        description: selectedInternship.description || "",
        applications: selectedInternship.applications || 0,
        isPaid: selectedInternship.isPaid || false,
        salary: selectedInternship.salary || "",
        industry: selectedInternship.industry || "",
        skills: selectedInternship.skills
          ? selectedInternship.skills.join(", ")
          : "",
        qualifications: selectedInternship.qualifications
          ? selectedInternship.qualifications.join(", ")
          : "",
        responsibilities: selectedInternship.responsibilities
          ? selectedInternship.responsibilities.join(", ")
          : "",
      });

      setIsPaid(selectedInternship.isPaid || false);
      setStartDate(selectedInternship.startDate || "");
      setEndDate(selectedInternship.endDate || "");
      setDeadline(selectedInternship.applicationDeadline || "");
    } else if (!isEditing) {
      form.reset({
        title: "",
        description: "",
        applications: 0,
        applicationDeadline: "",
        location: "",
        isPaid: false,
        salary: "",
        duration: "",
        skills: "",
        industry: "",
        startDate: "",
        endDate: "",
        qualifications: "",
        responsibilities: "",
      });

      setIsPaid(false);
      setStartDate("");
      setEndDate("");
      setDeadline("");
      setSelectedInternship(null);
    }
  }, [isEditing, selectedInternship, form]);

  const fetchCompanyInternships = async () => {
    try {
      const allInternships = await getAllFromStore("Internships");
      const companyName = localStorage.getItem("companyName");

      const filtered = allInternships.filter(
        (internship) =>
          internship.company && internship.company.name === companyName
      );

      setCompanyInternships(filtered);
    } catch (error) {
      console.error("Failed to fetch internships:", error);
      showWarningPopup("Error", "Failed to fetch company internships", "error");
    }
  };

  const showWarningPopup = (title, description, type) => {
    setPopupConfig({
      title,
      description,
      type,
    });
    setShowPopup(true);
  };

  const handleSubmit = async (data) => {
    try {
      const allInternships = await getAllFromStore("Internships");
      const allCompanies = await getAllFromStore("companyProfiles");

      const myCompany = allCompanies.find(
        (c) => c.companyName === localStorage.getItem("companyName")
      );

      if (!myCompany) {
        showWarningPopup("Error", "Company profile not found", "error");
        return;
      }

      const companyDetails = {
        id: myCompany.id,
        name: myCompany.companyName,
        industry: myCompany.industry,
        logo: myCompany.logo,
      };

      const skills = data.skills
        ? data.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill !== "")
        : [];
      const qualifications = data.qualifications
        ? data.qualifications
            .split(",")
            .map((qualification) => qualification.trim())
            .filter((qualification) => qualification !== "")
        : [];
      const responsibilities = data.responsibilities
        ? data.responsibilities
            .split(",")
            .map((responsibility) => responsibility.trim())
            .filter((responsibility) => responsibility !== "")
        : [];

      const months = differenceInMonths(parseISO(endDate), parseISO(startDate));
      const durationString = `${months} month${months !== 1 ? "s" : ""}`;

      if (isEditing && selectedInternship) {
        const dataToUpdate = {
          ...selectedInternship,
          title: data.title,
          description: data.description,
          isPaid: isPaid,
          salary: data.salary,
          skills: skills,
          qualifications: qualifications,
          responsibilities: responsibilities,
          industry: data.industry,
          startDate,
          endDate,
          applicationDeadline: deadline,
          duration: durationString,
        };

        await saveToStore("Internships", dataToUpdate);
        showWarningPopup(
          "Success",
          "Internship updated successfully",
          "success"
        );
      } else {
        const newId =
          allInternships.length > 0
            ? Math.max(...allInternships.map((i) => i.id)) + 1
            : 1;

        const dataToStore = {
          id: newId,
          title: data.title,
          company: companyDetails,
          duration: durationString,
          isPaid: isPaid,
          salary: data.salary,
          skills: skills,
          qualifications: qualifications,
          responsibilities: responsibilities,
          industry: data.industry,
          startDate,
          endDate,
          applicationDeadline: deadline,
          applications: 0,
          description: data.description,
        };

        await saveToStore("Internships", dataToStore);
        showWarningPopup(
          "Success",
          "Internship posted successfully",
          "success"
        );
      }

      setIsEditing(false);
      setSelectedInternship(null);
      form.reset();
      setIsPaid(false);
      setStartDate("");
      setEndDate("");
      setDeadline("");
      fetchCompanyInternships();
    } catch (error) {
      console.error("Failed to save internship:", error);
      showWarningPopup("Error", "Failed to save internship", "error");
    }
  };

  const handleEdit = (internship) => {
    setSelectedInternship(internship);
    setIsEditing(true);
  };

  const handleDelete = async (internship) => {
    try {
      if (internship.applications && internship.applications > 0) {
        showWarningPopup(
          "Cannot Delete",
          "This internship has active applications and cannot be deleted.",
          "error"
        );
        return;
      }

      await deleteFromStore("Internships", internship.id);
      showWarningPopup(
        "Deleted",
        "Internship has been deleted successfully",
        "success"
      );
      fetchCompanyInternships();
    } catch (error) {
      console.error("Failed to delete internship:", error);
      showWarningPopup("Error", "Failed to delete internship", "error");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedInternship(null);
    form.reset();
  };

  return (
    <>
      {showPopup && (
        <WarningPopup
          title={popupConfig.title}
          description={popupConfig.description}
          type={popupConfig.type}
          onClose={() => setShowPopup(false)}
        />
      )}

      <div className="space-y-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>My Internship Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {companyInternships.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You haven't posted any internships yet.
              </p>
            ) : (
              <div className="space-y-4">
                {companyInternships.map((internship) => (
                  <Card
                    key={internship.id}
                    className={`p-4 ${
                      selectedInternship?.id === internship.id
                        ? "border-primary"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {internship.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {internship.isPaid
                            ? `Paid - ${internship.salary}`
                            : "Unpaid"}{" "}
                          · {internship.duration}
                        </p>
                        <p className="text-sm mt-1">
                          Applications:{" "}
                          <strong>{internship.applications || 0}</strong> ·
                          Deadline:{" "}
                          <strong>
                            {internship.applicationDeadline
                              ? format(
                                  parseISO(internship.applicationDeadline),
                                  "PPP"
                                )
                              : "Not set"}
                          </strong>
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(internship)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(internship)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              {isEditing
                ? "Edit Internship Post"
                : "Create New Internship Post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Frontend Developer Intern"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tech">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Paid Internship
                        </FormLabel>
                        <FormDescription>
                          Switch on if this is a paid internship position
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={isPaid}
                          onCheckedChange={(checked) => {
                            setIsPaid(checked);
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isPaid && (
                  <FormField
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Salary</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. $1000/month" {...field} />
                        </FormControl>
                        <FormDescription>
                          Specify the expected salary for this internship
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills Required</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the required skills, separated by commas"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        e.g. React, JavaScript, HTML, CSS, Git
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the required qualifications, separated by commas"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        e.g. Bachelor in Computer Science
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internship Responsibilities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the required responsibilities, separated by commas"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        e.g. Handling database backup
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the internship"
                          className="min-h-40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(parseISO(startDate), "PPP")
                        ) : (
                          <span>Pick a start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate ? parseISO(startDate) : undefined}
                        onSelect={(date) =>
                          setStartDate(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(parseISO(endDate), "PPP")
                        ) : (
                          <span>Pick an end date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate ? parseISO(endDate) : undefined}
                        onSelect={(date) =>
                          setEndDate(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Application Deadline
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? (
                          format(parseISO(deadline), "PPP")
                        ) : (
                          <span>Pick an application deadline</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadline ? parseISO(deadline) : undefined}
                        onSelect={(date) =>
                          setDeadline(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <CardFooter className="px-0 flex justify-between">
                  {isEditing && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit">
                    {isEditing ? "Update Internship" : "Create Internship"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default InternshipPosts;

