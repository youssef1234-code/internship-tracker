import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  User,
  LogOut,
  Briefcase,
  FileText,
  FileQuestion,
  LayoutDashboard,
  Building,
  Users,
  BarChart2,
  Calendar,
  Video,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Notifications from "@/components/notifications/Notifications";
import logo from "@/assets/logo.svg";

const AppLayout = ({ user, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get navigation links based on user role
  const getNavLinks = () => {
    switch (user?.role) {
      case "company":
        return [
          {
            to: "/company/post",
            label: "Create Job Post",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            to: "/company/internships",
            label: "My Internships",
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            to: "/company/applications",
            label: "Applications",
            icon: <Users className="h-5 w-5" />,
          },
          {
            to: "/company/interns",
            label: "Current Interns",
            icon: <User className="h-5 w-5" />,
          },
          {
            to: "/internships",
            label: "Browse All Internships",
            icon: <Briefcase className="h-5 w-5" />,
          },
        ];
      case "scad_office":
      case "faculty_member":
        return [
          {
            to: "/scad",
            label: "Dashboard",
            icon: <LayoutDashboard className="h-5 w-5" />,
          },
          {
            to: "/scad/companies",
            label: "Company Approvals",
            icon: <Building className="h-5 w-5" />,
          },
          {
            to: "/scad/students",
            label: "Students",
            icon: <Users className="h-5 w-5" />,
          },
          {
            to: "/scad/reports",
            label: "Reports",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            to: "/scad/workshops",
            label: "Workshops",
            icon: <Video className="h-5 w-5" />,
          },
          {
            to: "/scad/cycle",
            label: "Cycle Settings",
            icon: <Calendar className="h-5 w-5" />,
          },
          {
            to: "/internships",
            label: "Browse Internships",
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            to: "/appointment",
            label: "Appointments",
            icon: <Calendar className="h-5 w-5" />,
          },
          {
            to: "/scad/intern-evaluations",
            label: "Intern Evaluations",
            icon: <Star className="h-5 w-5" />,
          },
        ];
      case "student":
      case "pro_student":
        return [
          // {
          //   to: "/student",
          //   label: "Dashboard",
          //   icon: <LayoutDashboard className="h-5 w-5" />,
          // },
          {
            to: "/student/profile",
            label: "My Profile",
            icon: <User className="h-5 w-5" />,
          },
          {
            to: "/student/Help",
            label: "Help",
            icon: <FileQuestion className="h-5 w-5" />,
          },
          {
            to: "/internships",
            label: "Browse Internships",
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            to: "/student/applications",
            label: "My Applications",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            to: "/student/internships",
            label: "My Internships",
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            to: "/student/CompanyEvaluation",
            label: "Company Evaluation",
            icon: <User className="h-5 w-5" />,
          },
        ];
      default:
        return [];
    }
  };

  // PRO student additional menu items
  const getProStudentLinks = () => {
    if (user?.role === "pro_student") {
      return [
        {
          to: "/student/assessments",
          label: "Assessments",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          to: "/appointment",
          label: "Appointments",
          icon: <Calendar className="h-5 w-5" />,
        },
        {
          to: "/student/workshops",
          label: "Workshops",
          icon: <Briefcase className="h-5 w-5" />,
        },
      ];
    }
    return [];
  };

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: "16rem", // 64 * 4 = 256px = 16rem
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    collapsed: {
      width: "5rem", // Enough for icons only (80px)
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const linkTextVariants = {
    visible: {
      opacity: 1,
      x: 0,
      display: "block",
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    hidden: {
      opacity: 0,
      x: -10,
      transitionEnd: {
        display: "none",
      },
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-4 py-4">
                {getNavLinks().map((link, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={link.to}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        location.pathname === link.to
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {link.icon}
                      <span className="ml-2">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
                {getProStudentLinks().map((link, index) => (
                  <motion.div
                    key={`pro-${index}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={link.to}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        location.pathname === link.to
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {link.icon}
                      <span className="ml-2">{link.label}</span>
                      <Badge className="ml-2" variant="secondary">
                        PRO
                      </Badge>
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo - replacing text with image */}
          <div className="flex items-center">
            <img
              src={logo}
              alt="SCAD System Logo"
              className="h-24 object-contain"
            />
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Using the Notifications component */}
            <Notifications user={user} />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user?.name}
                  {user?.role === "pro_student" && (
                    <Badge className="ml-2" variant="secondary">
                      PRO
                    </Badge>
                  )}
                </DropdownMenuLabel>
                {user?.role.includes("student") && (
                  <DropdownMenuItem
                    onSelect={() =>
                      navigate(
                        user?.role.includes("student")
                          ? "/student/profile"
                          : "/company"
                      )
                    }
                  >
                    Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to log out?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You'll need to log back in to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onLogout}>
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <motion.aside
          className="hidden md:block border-r border-gray-200 bg-white h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto"
          initial="expanded"
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
          variants={sidebarVariants}
          layout="position"
        >
          <nav className="flex flex-col gap-1 p-4">
            {/* Collapse toggle button */}
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="rounded-full h-8 w-8"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Navigation links */}
            {getNavLinks().map((link, index) => (
              <TooltipProvider key={index} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Link
                        to={link.to}
                        className={`flex items-center px-3 py-2 rounded-md ${
                          location.pathname === link.to
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-100"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <span className={sidebarCollapsed ? "" : "mr-2"}>
                          {link.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="truncate">{link.label}</span>
                        )}
                      </Link>
                    </div>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}

            {/* PRO student links */}
            {getProStudentLinks().map((link, index) => (
              <TooltipProvider key={`pro-${index}`} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Link
                        to={link.to}
                        className={`flex items-center px-3 py-2 rounded-md ${
                          location.pathname === link.to
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-100"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        <span className={sidebarCollapsed ? "" : "mr-2"}>
                          {link.icon}
                        </span>
                        {!sidebarCollapsed && (
                          <span className="truncate">
                            {link.label}
                            <Badge className="ml-2" variant="secondary">
                              PRO
                            </Badge>
                          </span>
                        )}
                      </Link>
                    </div>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">
                      {link.label} <span className="ml-1 text-xs">(PRO)</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
        </motion.aside>

        {/* Main content with page transitions */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
