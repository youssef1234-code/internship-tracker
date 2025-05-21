// src/components/WorkshopsManager.jsx
import { useState, useEffect } from "react";
import WarningPopup from "@/components/common/WarningPopup";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  Save,
  Trash2,
  PlusCircle,
  Edit,
  Clock,
  Users,
  CheckCircle,
  Loader2,
  Send,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  saveToStore,
  getAllFromStore,
  deleteFromStore,
} from "@/utils/indexedDB-utils";

const saveWorkshop = async (workshop) => {
  saveToStore("workshops", workshop);
};

const deleteWorkshop = async (id) => {
  deleteFromStore("workshops", id);
};

// Sample initial workshops (for initialization)
const initialWorkshops = [
  {
    id: "1",
    title: "Resume Building Masterclass",
    description:
      "Learn how to create an effective resume that stands out to employers and highlights your skills.",
    startDate: "2025-05-10T14:00:00.000Z",
    endDate: "2025-05-10T16:00:00.000Z",
    speaker: {
      name: "Emily Rodriguez",
      title: "Senior Recruiter at TechCorp",
      bio: "Emily has over 10 years of experience in tech recruitment and has helped hundreds of students land their dream jobs.",
    },
    category: "resume",
    capacity: 50,
    registeredCount: 32,
    agenda: [
      "Introduction to effective resume structures",
      "How to highlight your skills and experience",
      "Common resume mistakes to avoid",
      "Q&A session",
    ],
    status: "released",
  },
  {
    id: "2",
    title: "Technical Interview Preparation",
    description:
      "Prepare for technical interviews with practice problems, strategies, and feedback from industry professionals.",
    startDate: "2025-05-20T18:00:00.000Z",
    endDate: "2025-05-20T20:30:00.000Z",
    speaker: {
      name: "Michael Chen",
      title: "Software Engineer at CloudTech",
      bio: "Michael has conducted over 500 technical interviews and specializes in helping students prepare for coding challenges.",
    },
    category: "interview",
    capacity: 30,
    registeredCount: 28,
    agenda: [
      "Common technical interview formats",
      "Problem-solving strategies",
      "Live coding practice session",
      "Mock interview demonstrations",
      "Q&A and feedback",
    ],
    status: "released",
  },
  {
    id: "3",
    title: "Networking for Career Success",
    description:
      "Build your professional network and learn how to leverage connections for job opportunities.",
    startDate: "2025-05-25T15:00:00.000Z",
    endDate: "2025-05-25T17:00:00.000Z",
    speaker: {
      name: "Sophia Williams",
      title: "Career Development Specialist",
      bio: "Sophia has helped hundreds of students and professionals expand their networks and find career opportunities through strategic networking.",
    },
    category: "networking",
    capacity: 40,
    registeredCount: 15,
    agenda: [
      "The importance of professional networking",
      "Building your LinkedIn presence",
      "Networking strategies for introverts",
      "Following up after networking events",
      "Interactive networking exercise",
    ],
    status: "draft",
  },
];

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  speakerName: z.string().min(3, { message: "Speaker name is required" }),
  speakerBio: z
    .string()
    .min(5, { message: "Speaker bio must be at least 5 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  capacity: z.string().min(1, { message: "Capacity is required" }),
});

// Animation variants (unchanged)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
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

const workshopCardVariants = {
  hidden: { opacity: 0, iteral: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

const buttonHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export default function WorkshopsManager() {
  const [workshops, setWorkshops] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentWorkshop, setCurrentWorkshop] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [agendaItems, setAgendaItems] = useState([]);
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [isAdmin, setIsAdmin] = useState(true);
  const [showSaveError, setShowSaveError] = useState(false);
  const [showDeleteError, setShowDeleteError] = useState(false);
  const [showToggleError, setShowToggleError] = useState(false);

  // Load workshops from IndexedDB
  useEffect(() => {
    const loadWorkshops = async () => {
      try {
        let storedWorkshops = await getAllFromStore("workshops");
        if (storedWorkshops.length === 0) {
          // Initialize with sample data
          for (const workshop of initialWorkshops) {
            await saveWorkshop(workshop);
          }
          storedWorkshops = initialWorkshops;
        }
        setWorkshops(storedWorkshops);
      } catch (error) {
        console.error("Error loading workshops:", error);
      }
    };
    loadWorkshops();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      speakerName: "",
      speakerTitle: "",
      speakerBio: "",
      category: "",
      capacity: "",
    },
  });

  useEffect(() => {
    if (currentWorkshop && editMode) {
      form.reset({
        title: currentWorkshop.title,
        description: currentWorkshop.description,
        startDate: currentWorkshop.startDate,
        endDate: currentWorkshop.endDate,
        speakerName: currentWorkshop.speaker.name,
        speakerTitle: currentWorkshop.speaker.title,
        speakerBio: currentWorkshop.speaker.bio,
        category: currentWorkshop.category,
        capacity: String(currentWorkshop.capacity),
      });
      setAgendaItems(currentWorkshop.agenda);
    }
  }, [currentWorkshop, editMode]);

  const resetForm = () => {
    form.reset({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      speakerName: "",
      speakerTitle: "",
      speakerBio: "",
      category: "",
      capacity: "",
    });
    setAgendaItems([]);
    setNewAgendaItem("");
    setCurrentWorkshop(null);
    setEditMode(false);
  };

  const handleAddAgendaItem = () => {
    if (newAgendaItem.trim() !== "") {
      setAgendaItems([...agendaItems, newAgendaItem]);
      setNewAgendaItem("");
    }
  };

  const handleRemoveAgendaItem = (index) => {
    const newItems = [...agendaItems];
    newItems.splice(index, 1);
    setAgendaItems(newItems);
  };

  const handleEditWorkshop = (workshop) => {
    setCurrentWorkshop(workshop);
    setAgendaItems(workshop.agenda);
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDeleteWorkshop = async (id) => {
    try {
      await deleteWorkshop(id);
      setWorkshops((prev) => prev.filter((workshop) => workshop.id !== id));
    } catch (error) {
      console.error("Error deleting workshop:", error);
      setShowDeleteError(true);
    }
  };

  const handleToggleStatus = async (workshop) => {
    try {
      const updatedWorkshop = {
        ...workshop,
        status: workshop.status === "released" ? "draft" : "released",
      };
      await saveWorkshop(updatedWorkshop);
      setWorkshops((prev) =>
        prev.map((w) => (w.id === workshop.id ? updatedWorkshop : w))
      );
    } catch (error) {
      console.error("Error toggling workshop status:", error);
      setShowToggleError(true);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const workshopData = {
        id: editMode ? currentWorkshop.id : crypto.randomUUID(),
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        speaker: {
          name: data.speakerName,
          title: data.speakerTitle,
          bio: data.speakerBio,
        },
        category: data.category,
        capacity: parseInt(data.capacity),
        registeredCount: editMode ? currentWorkshop.registeredCount : 0,
        agenda: agendaItems,
        status: editMode ? currentWorkshop.status : "draft",
        userRating: editMode ? currentWorkshop.userRating || 0 : 0,
        userFeedback: editMode ? currentWorkshop.userFeedback || "" : "",
        hasAttended: editMode ? currentWorkshop.hasAttended || false : false,
        certificateIssued: editMode
          ? currentWorkshop.certificateIssued || false
          : false,
      };

      await saveWorkshop(workshopData);
      setWorkshops((prev) =>
        editMode
          ? prev.map((w) => (w.id === workshopData.id ? workshopData : w))
          : [...prev, workshopData]
      );

      setIsSubmitting(false);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving workshop:", error);
      setShowSaveError(true);
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  const formatDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const hours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const getCategoryColor = (category) => {
    const categories = {
      resume: "bg-blue-500 hover:bg-blue-600",
      interview: "bg-purple-500 hover:bg-purple-600",
      networking: "bg-green-500 hover:bg-green-600",
      leadership: "bg-amber-500 hover:bg-amber-600",
      technical: "bg-red-500 hover:bg-red-600",
    };
    return categories[category] || "bg-gray-500 hover:bg-gray-600";
  };

  const getUpcomingWorkshops = () => {
    return workshops.filter(
      (workshop) => new Date(workshop.endDate) > new Date()
    );
  };

  const getPastWorkshops = () => {
    return workshops.filter(
      (workshop) => new Date(workshop.endDate) <= new Date()
    );
  };

  return (
    <>
      {showSaveError && (
        <WarningPopup
          title="Save Error"
          description="Failed to save workshop. Please try again."
          type="error"
          onClose={() => setShowSaveError(false)}
        />
      )}

      {showDeleteError && (
        <WarningPopup
          title="Delete Error"
          description="Failed to delete workshop. Please try again."
          type="error"
          onClose={() => setShowDeleteError(false)}
        />
      )}

      {showToggleError && (
        <WarningPopup
          title="Status Update Error"
          description="Failed to update workshop status. Please try again."
          type="error"
          onClose={() => setShowToggleError(false)}
        />
      )}

      <motion.div
        className="w-full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="w-full max-w-full mx-auto">
          <CardHeader>
            <motion.div
              className="flex justify-between items-center"
              variants={itemVariants}
            >
              <div>
                <CardTitle>Online Career Workshops</CardTitle>
                <CardDescription>
                  Manage career development workshops
                </CardDescription>
              </div>
              {isAdmin && (
                <motion.div
                  variants={buttonHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          resetForm();
                          setEditMode(false);
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" /> Add Workshop
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editMode ? "Edit Workshop" : "Add New Workshop"}
                        </DialogTitle>
                        <DialogDescription>
                          {editMode
                            ? "Update workshop details and information."
                            : "Create a new workshop for students to join."}
                        </DialogDescription>
                      </DialogHeader>

                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-4"
                        >
                          <motion.div variants={itemVariants}>
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Workshop Title</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter workshop title"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Provide a short description of the workshop"
                                      className="min-h-24"
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
                              name="startDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Start Date & Time</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? (
                                            format(
                                              parseISO(field.value),
                                              "PPP p"
                                            )
                                          ) : (
                                            <span>Pick date and time</span>
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={
                                          field.value
                                            ? parseISO(field.value)
                                            : undefined
                                        }
                                        onSelect={(date) => {
                                          if (date) {
                                            const currentDate = field.value
                                              ? parseISO(field.value)
                                              : new Date();
                                            date.setHours(
                                              currentDate.getHours()
                                            );
                                            date.setMinutes(
                                              currentDate.getMinutes()
                                            );
                                            field.onChange(date.toISOString());
                                          }
                                        }}
                                        initialFocus
                                      />
                                      <div className="p-3 border-t">
                                        <Input
                                          type="time"
                                          onChange={(e) => {
                                            const [hours, minutes] =
                                              e.target.value.split(":");
                                            const date = field.value
                                              ? parseISO(field.value)
                                              : new Date();
                                            date.setHours(parseInt(hours));
                                            date.setMinutes(parseInt(minutes));
                                            field.onChange(date.toISOString());
                                          }}
                                          value={
                                            field.value
                                              ? format(
                                                  parseISO(field.value),
                                                  "HH:mm"
                                                )
                                              : ""
                                          }
                                        />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>End Date & Time</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {field.value ? (
                                            format(
                                              parseISO(field.value),
                                              "PPP p"
                                            )
                                          ) : (
                                            <span>Pick date and time</span>
                                          )}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={
                                          field.value
                                            ? parseISO(field.value)
                                            : undefined
                                        }
                                        onSelect={(date) => {
                                          if (date) {
                                            const currentDate = field.value
                                              ? parseISO(field.value)
                                              : new Date();
                                            date.setHours(
                                              currentDate.getHours()
                                            );
                                            date.setMinutes(
                                              currentDate.getMinutes()
                                            );
                                            field.onChange(date.toISOString());
                                          }
                                        }}
                                        initialFocus
                                      />
                                      <div className="p-3 border-t">
                                        <Input
                                          type="time"
                                          onChange={(e) => {
                                            const [hours, minutes] =
                                              e.target.value.split(":");
                                            const date = field.value
                                              ? parseISO(field.value)
                                              : new Date();
                                            date.setHours(parseInt(hours));
                                            date.setMinutes(parseInt(minutes));
                                            field.onChange(date.toISOString());
                                          }}
                                          value={
                                            field.value
                                              ? format(
                                                  parseISO(field.value),
                                                  "HH:mm"
                                                )
                                              : ""
                                          }
                                        />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="resume">
                                        Resume Building
                                      </SelectItem>
                                      <SelectItem value="interview">
                                        Interview Preparation
                                      </SelectItem>
                                      <SelectItem value="networking">
                                        Networking
                                      </SelectItem>
                                      <SelectItem value="leadership">
                                        Leadership
                                      </SelectItem>
                                      <SelectItem value="technical">
                                        Technical Skills
                                      </SelectItem>
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
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Workshop Capacity</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="Maximum number of participants"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <h3 className="text-lg font-medium mb-2">
                              Speaker Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="speakerName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Speaker Name</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Speaker's full name"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="speakerTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Speaker Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Speaker's job title"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="speakerBio"
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Speaker Bio</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Short biography of the speaker"
                                      className="min-h-20"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </motion.div>

                          <motion.div variants={itemVariants}>
                            <div className="border rounded-lg p-4">
                              <h3 className="text-lg font-medium mb-2">
                                Workshop Agenda
                              </h3>
                              <p className="text-sm text-gray-500 mb-4">
                                Add the main topics or activities for this
                                workshop
                              </p>

                              <div className="space-y-4">
                                {agendaItems.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="flex-1 p-2 bg-muted rounded-md">
                                      {item}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveAgendaItem(index)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}

                                <div className="flex items-center gap-2">
                                  <Input
                                    value={newAgendaItem}
                                    onChange={(e) =>
                                      setNewAgendaItem(e.target.value)
                                    }
                                    placeholder="Add an agenda item"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddAgendaItem();
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddAgendaItem}
                                  >
                                    <PlusCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setOpenDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  {editMode
                                    ? "Update Workshop"
                                    : "Create Workshop"}
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )}
            </motion.div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">Upcoming Workshops</TabsTrigger>
                <TabsTrigger value="past">Past Workshops</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {getUpcomingWorkshops().length > 0 ? (
                    getUpcomingWorkshops().map((workshop) => (
                      <motion.div
                        key={workshop.id}
                        variants={workshopCardVariants}
                        whileHover="hover"
                        layout
                      >
                        <Card className="h-full">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {workshop.title}
                                  <Badge
                                    variant={
                                      workshop.status === "released"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {workshop.status.charAt(0).toUpperCase() +
                                      workshop.status.slice(1)}
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {formatDateTime(workshop.startDate)}
                                </CardDescription>
                              </div>
                              <Badge
                                className={cn(
                                  getCategoryColor(workshop.category)
                                )}
                              >
                                {workshop.category.charAt(0).toUpperCase() +
                                  workshop.category.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm mb-3">
                              {workshop.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {formatDuration(
                                  workshop.startDate,
                                  workshop.endDate
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {workshop.registeredCount}/{workshop.capacity}{" "}
                                registered
                              </Badge>
                            </div>
                            <div className="border-t pt-3 mt-2">
                              <h4 className="font-medium text-sm mb-1">
                                Speaker
                              </h4>
                              <p className="text-sm font-medium">
                                {workshop.speaker.name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {workshop.speaker.title}
                              </p>
                              <p className="text-xs">{workshop.speaker.bio}</p>
                            </div>
                            <Accordion
                              type="single"
                              collapsible
                              className="mt-3"
                            >
                              <AccordionItem value="agenda">
                                <AccordionTrigger className="text-sm font-medium py-2">
                                  Workshop Agenda
                                </AccordionTrigger>
                                <AccordionContent>
                                  <ul className="text-sm space-y-1">
                                    {workshop.agenda.map((item, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start gap-2"
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardContent>
                          <CardFooter className="flex flex-wrap justify-between items-center pt-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleToggleStatus(workshop)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {workshop.status === "released"
                                ? "Unpublish"
                                : "Publish"}
                            </Button>
                            {isAdmin && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditWorkshop(workshop)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteWorkshop(workshop.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      className="col-span-2 text-center p-8 bg-muted rounded-lg"
                    >
                      <p className="text-lg font-medium text-gray-600">
                        No upcoming workshops scheduled
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Create a new workshop to get started
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="past">
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {getPastWorkshops().length > 0 ? (
                    getPastWorkshops().map((workshop) => (
                      <motion.div
                        key={workshop.id}
                        variants={workshopCardVariants}
                        whileHover="hover"
                        layout
                      >
                        <Card className="h-full bg-gray-50">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center">
                                  {workshop.title}
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                  >
                                    Completed
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {formatDateTime(workshop.startDate)}
                                </CardDescription>
                              </div>
                              <Badge
                                className={cn(
                                  getCategoryColor(workshop.category)
                                )}
                              >
                                {workshop.category.charAt(0).toUpperCase() +
                                  workshop.category.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm mb-3">
                              {workshop.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {formatDuration(
                                  workshop.startDate,
                                  workshop.endDate
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Users className="h-3 w-3" />
                                {workshop.registeredCount}/{workshop.capacity}{" "}
                                attended
                              </Badge>
                            </div>
                            <div className="border-t pt-3 mt-2">
                              <h4 className="font-medium text-sm mb-1">
                                Speaker
                              </h4>
                              <p className="text-sm font-medium">
                                {workshop.speaker.name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {workshop.speaker.title}
                              </p>
                              <p className="text-xs">{workshop.speaker.bio}</p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex flex-wrap justify-between items-center pt-2">
                            {isAdmin && (
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteWorkshop(workshop.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      className="col-span-2 text-center p-8 bg-muted rounded-lg"
                    >
                      <p className="text-lg font-medium text-gray-600">
                        No past workshops
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Past workshops will appear here
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
