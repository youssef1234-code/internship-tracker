import { useState, useEffect } from "react";
import { Bell, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";

import { Button } from "../ui/button.tsx";
import { Badge } from "../ui/badge.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../ui/dialog.tsx";

import { saveToStore, getAllFromStore } from "@/utils/indexedDB-utils";

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notificationUpdateTrigger, setNotificationUpdateTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotificationAdded = () => {
      setNotificationUpdateTrigger((prev) => prev + 1);
    };

    window.addEventListener("notificationAdded", handleNotificationAdded);

    return () => {
      window.removeEventListener("notificationAdded", handleNotificationAdded);
    };
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Get notifications from IndexedDB
        const storedNotifications = await getAllFromStore("notifications");
        // Filter notifications for the current user
        const userNotifications = storedNotifications
          ? storedNotifications.filter(
              (notification) =>
                notification.email === user?.email ||
                (notification.global &&
                  (notification.userRole === user?.role ||
                    (notification.userRole == "student" &&
                      user?.role == "pro_student")))
            )
          : [];

        // Sort by date (newest first)
        userNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

        setNotifications(userNotifications);

        // Count unread notifications
        setUnreadCount(userNotifications.filter((n) => !n.read).length);
      } catch (error) {
        // If no notifications exist yet, initialize with dummy data for the current user
        initializeDummyNotifications();
      }
    };
    loadNotifications();
  }, [isDialogOpen, notificationUpdateTrigger]);

  // Initialize with dummy data if needed
  const initializeDummyNotifications = async () => {
    const currentDate = new Date().toISOString();
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString();

    let dummyNotifications = [];

    // Create role-specific notifications
    if (user?.role === "student" || user?.role === "pro_student") {
      dummyNotifications = [
        {
          id: "notification-" + Date.now(),
          email: user.email,
          userRole: "student",
          message: "New internship cycle begins in 5 days",
          link: "/internships",
          read: false,
          date: currentDate,
          global: false,
        },
        {
          id: "notification-" + (Date.now() + 1),
          email: user.email,
          userRole: "student",
          message: "Your internship report status has been updated",
          link: "/student/internships",
          read: false,
          date: yesterdayDate,
          global: false,
        },
      ];
    } else if (user?.role === "company") {
      dummyNotifications = [
        {
          id: "notification-" + Date.now(),
          email: user.email,
          userRole: "company",
          message: "New application received for Web Developer position",
          link: "/company/applications",
          read: false,
          date: currentDate,
          global: false,
        },
        {
          id: "notification-" + (Date.now() + 1),
          email: user.email,
          userRole: "company",
          message: "Your company registration has been approved",
          link: "/company",
          read: true,
          date: yesterdayDate,
          global: false,
        },
      ];
    }

    // Save each notification to IndexedDB
    for (const notification of dummyNotifications) {
      await saveToStore("notifications", notification);
    }

    // Update state
    setNotifications(dummyNotifications);
    setUnreadCount(dummyNotifications.filter((n) => !n.read).length);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Find the notification
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;

      // Update the notification
      const updatedNotification = { ...notification, read: true };

      // Save to IndexedDB
      await saveToStore("notifications", updatedNotification);

      // Update state
      const updatedNotifications = notifications.map((n) =>
        n.id === notificationId ? updatedNotification : n
      );

      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }));

      // Save each updated notification to IndexedDB
      for (const notification of updatedNotifications) {
        await saveToStore("notifications", notification);
      }

      // Update state
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Handle notification click - mark as read and navigate if there's a link
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Format date for display
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // If less than 24 hours ago, show relative time
    if (now - date < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }

    // Otherwise show the date
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <>
      {/* Dropdown Menu for quick notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[300px]">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="py-3 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col w-full">
                    <div
                      className={`${
                        notification.read ? "text-gray-500" : "font-medium"
                      }`}
                    >
                      {notification.message}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatNotificationDate(notification.date)}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </ScrollArea>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-center font-medium cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          >
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Notifications Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>All Notifications</span>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              You have {notifications.length} notification
              {notifications.length !== 1 ? "s" : ""} ({unreadCount} unread)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`mb-4 p-3 border rounded-md cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-gray-50 border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div
                      className={`${
                        notification.read
                          ? "text-gray-700"
                          : "font-medium text-gray-900"
                      }`}
                    >
                      {notification.message}
                    </div>
                    {notification.link && (
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatNotificationDate(notification.date)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Notifications;

