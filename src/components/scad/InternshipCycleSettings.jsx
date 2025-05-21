import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Edit2, Save } from "lucide-react";
import WarningPopup from "@/components/common/WarningPopup";
import { cn } from "../../lib/utils.ts";
import { Button } from "../ui/button.tsx";
import { Calendar } from "../ui/calendar.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover.tsx";
import { addNotification } from "@/utils/notification-utils";

const InternshipCycleSettings = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupInfo, setPopupInfo] = useState({
    title: "",
    description: "",
    type: "info",
  });

  // Parse date from string format "d/M/yyyy" to Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day);
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Format date to string format "d/M/yyyy"
  const formatDate = (date) => {
    if (!date) return "";
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  useEffect(() => {
    // Load dates from localStorage
    const storedStartDate = localStorage.getItem("startDate");
    const storedEndDate = localStorage.getItem("endDate");

    // If no dates are stored, set defaults
    if (!storedStartDate || !storedEndDate) {
      const defaultStart = "1/5/2025";
      const defaultEnd = "31/5/2025";

      localStorage.setItem("startDate", defaultStart);
      localStorage.setItem("endDate", defaultEnd);

      setStartDate(parseDate(defaultStart));
      setEndDate(parseDate(defaultEnd));
    } else {
      // Set the stored dates
      setStartDate(parseDate(storedStartDate));
      setEndDate(parseDate(storedEndDate));
    }
  }, []);

  const handleSaveSettings = () => {
    if (!startDate || !endDate) {
      setPopupInfo({
        title: "Error",
        description: "Both start and end dates are required.",
        type: "error",
      });
      setShowPopup(true);
      return;
    }

    if (startDate > endDate) {
      setPopupInfo({
        title: "Error",
        description: "Start date cannot be after end date.",
        type: "error",
      });
      setShowPopup(true);
      return;
    }

    // Format and save dates
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    localStorage.setItem("startDate", formattedStartDate);
    localStorage.setItem("endDate", formattedEndDate);

    // Create notification
    const message = {
      global: true,
      userRole: "student",
      message: `Please note that the internship cycle will start from ${formattedStartDate} until ${formattedEndDate}`,
    };
    addNotification(message);

    // Show success message
    setPopupInfo({
      title: "Settings Updated",
      description: "Internship cycle settings have been updated successfully",
      type: "success",
    });
    setShowPopup(true);
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <>
      {showPopup && (
        <WarningPopup
          title={popupInfo.title}
          description={popupInfo.description}
          type={popupInfo.type}
          onClose={() => setShowPopup(false)}
        />
      )}

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Internship Cycle Settings</CardTitle>
            <CardDescription>
              Manage the current internship cycle dates.
            </CardDescription>
          </div>
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={toggleEditMode}
            className="flex gap-2 items-center"
          >
            {isEditMode ? (
              <>
                <Edit2 className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" /> Edit Dates
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Current Start Date</h3>
                <div className="p-3 border rounded-md bg-muted/30">
                  {startDate ? format(startDate, "PPP") : "Not set"}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Current End Date</h3>
                <div className="p-3 border rounded-md bg-muted/30">
                  {endDate ? format(endDate, "PPP") : "Not set"}
                </div>
              </div>
            </div>

            {isEditMode && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">New Start Date</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">New End Date</h3>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    className="flex gap-2 items-center"
                  >
                    <Save className="h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default InternshipCycleSettings;

