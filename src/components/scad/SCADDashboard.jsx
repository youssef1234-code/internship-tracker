import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs.tsx";
import { Button } from "../ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import { Badge } from "../ui/badge.tsx";
import { Input } from "../ui/input.tsx";
import { Label } from "../ui/label.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.tsx";
import { Skeleton } from "../ui/skeleton.tsx";
import {
  RefreshCcw,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Star,
  FileText,
  Flag,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Briefcase,
  Building,
  User,
} from "lucide-react";
import { getAllFromStore, getFromStore } from "@/utils/indexedDB-utils";
import { getCourseById } from "../../utils/mock-data";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  hover: { y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
};

// COLORS for charts
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#6A0572",
  "#AB83A1",
];

const STATUS_COLORS = {
  approved: "#10B981",
  rejected: "#EF4444",
  pending: "#F59E0B",
  flagged: "#FB923C",
};

export default function SCADDashboard() {
  // States for all data
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [timeRange, setTimeRange] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);

  // Dashboard data states
  const [reportStats, setReportStats] = useState({
    approved: 0,
    rejected: 0,
    flagged: 0,
    pending: 0,
    total: 0,
    avgReviewTime: 0,
  });
  const [internshipStats, setInternshipStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
  });
  const [topCompanies, setTopCompanies] = useState([]);
  const [courseUsage, setCourseUsage] = useState([]);
  const [companyRatings, setCompanyRatings] = useState([]);
  const [studentStats, setStudentStats] = useState({
    total: 0,
    pro: 0,
    regular: 0,
    withInternships: 0,
    withoutInternships: 0,
  });
  const [applicationTrends, setApplicationTrends] = useState([]);
  const [workshopStats, setWorkshopStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    categories: [],
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Refs for exporting components
  const dashboardRef = useRef(null);
  const reportsChartRef = useRef(null);
  const topCompaniesChartRef = useRef(null);
  const courseChartRef = useRef(null);
  const companyRatingsChartRef = useRef(null);
  const applicationTrendsChartRef = useRef(null);

  // Fetch all data on mount and when refresh is triggered
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchReportStats(),
          fetchInternshipStats(),
          fetchCompanyStats(),
          fetchCourseUsage(),
          fetchStudentStats(),
          fetchWorkshopStats(),
          fetchApplicationTrends(),
        ]);

        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [refreshTrigger, timeRange]);

  // Fetch report statistics
  const fetchReportStats = async () => {
    try {
      const evaluations = await getAllFromStore("InternshipEvaluations");
      let approved = 0,
        rejected = 0,
        flagged = 0,
        pending = 0;
      let totalReviewTime = 0,
        reviewedCount = 0;

      evaluations.forEach((eva) => {
        if (eva.report) {
          switch (eva.report.status) {
            case "approved":
              approved++;
              break;
            case "rejected":
              rejected++;
              break;
            case "flagged":
              flagged++;
              break;
            default:
              pending++;
              break;
          }

          // Calculate review time if we have both submission and review dates
          if (eva.report.date && eva.report.reviewDate) {
            const submissionDate = new Date(eva.report.date);
            const reviewDate = new Date(eva.report.reviewDate);
            totalReviewTime +=
              (reviewDate - submissionDate) / (1000 * 60 * 60 * 24); // days
            reviewedCount++;
          }
        }
      });

      const total = approved + rejected + flagged + pending;
      const avgReviewTime =
        reviewedCount > 0 ? (totalReviewTime / reviewedCount).toFixed(1) : 0;

      setReportStats({
        approved,
        rejected,
        flagged,
        pending,
        total,
        avgReviewTime,
      });
    } catch (error) {
      console.error("Error fetching report stats:", error);
    }
  };

  // Fetch internship statistics
  const fetchInternshipStats = async () => {
    try {
      const applications = await getAllFromStore("InternshipApplications");
      let active = 0,
        completed = 0,
        pending = 0,
        total = 0;

      applications.forEach((appSet) => {
        if (Array.isArray(appSet.applications)) {
          appSet.applications.forEach((app) => {
            total++;
            switch (app.status) {
              case "current":
                active++;
                break;
              case "completed":
                completed++;
                break;
              default:
                pending++;
                break;
            }
          });
        }
      });

      setInternshipStats({
        total,
        active,
        completed,
        pending,
      });
    } catch (error) {
      console.error("Error fetching internship stats:", error);
    }
  };

  // Fetch company statistics
  const fetchCompanyStats = async () => {
    try {
      const applications = await getAllFromStore("InternshipApplications");
      const evaluations = await getAllFromStore("InternshipEvaluations");

      // Count internships per company
      const internshipsPerCompany = {};
      applications.forEach((appSet) => {
        if (Array.isArray(appSet.applications)) {
          appSet.applications.forEach((app) => {
            if (app.status === "current" || app.status === "completed") {
              const companyName = app.company?.name || "Unknown Company";
              if (!internshipsPerCompany[companyName]) {
                internshipsPerCompany[companyName] = 0;
              }
              internshipsPerCompany[companyName]++;
            }
          });
        }
      });

      // Calculate ratings per company
      const ratingsPerCompany = {};
      evaluations.forEach((eva) => {
        if (eva.company && eva.evaluations && eva.evaluations.length > 0) {
          if (!ratingsPerCompany[eva.company]) {
            ratingsPerCompany[eva.company] = {
              total: 0,
              count: 0,
            };
          }

          // Use overallRating from each evaluation
          eva.evaluations.forEach((e) => {
            if (e.overallRating) {
              ratingsPerCompany[eva.company].total += parseFloat(
                e.overallRating
              );
              ratingsPerCompany[eva.company].count++;
            }
          });
        }
      });

      // Calculate average ratings
      const companyRatingsArray = Object.keys(ratingsPerCompany)
        .map((company) => {
          const { total, count } = ratingsPerCompany[company];
          const avgRating = count > 0 ? (total / count).toFixed(1) : 0;
          return {
            name: company,
            rating: parseFloat(avgRating),
            count: count,
          };
        })
        .filter((c) => c.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10);

      // Create top companies by internship count
      const topCompaniesArray = Object.keys(internshipsPerCompany)
        .map((company) => ({
          name: company,
          internships: internshipsPerCompany[company],
          rating:
            companyRatingsArray.find((c) => c.name === company)?.rating || 0,
        }))
        .sort((a, b) => b.internships - a.internships)
        .slice(0, 10);

      setTopCompanies(topCompaniesArray);
      setCompanyRatings(companyRatingsArray);
    } catch (error) {
      console.error("Error fetching company stats:", error);
    }
  };

  // Fetch course usage statistics
  const fetchCourseUsage = async () => {
    try {
      const evaluations = await getAllFromStore("InternshipEvaluations");
      const courseCounts = {};

      evaluations.forEach((eva) => {
        if (Array.isArray(eva.selectedCourses)) {
          eva.selectedCourses.forEach((courseId) => {
            if (!courseCounts[courseId]) {
              courseCounts[courseId] = 0;
            }
            courseCounts[courseId]++;
          });
        }
      });

      const courseUsageArray = Object.keys(courseCounts)
        .map((courseId) => ({
          name: getCourseById(courseId)?.name || "Unknown Course",
          count: courseCounts[courseId],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setCourseUsage(courseUsageArray);
    } catch (error) {
      console.error("Error fetching course usage:", error);
    }
  };

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

  // Fetch student statistics
  const fetchStudentStats = async () => {
    try {
      const students = await getAllFromStore("studentProfiles");
      const applications = await getAllFromStore("InternshipApplications");

      // Count total students and pro students
      const total = students.length;
      const proStudents = (
        await Promise.all(
          students.map(async (s) => ((await isUserPro(s.email)) ? s : null))
        )
      ).filter(Boolean).length;
      const regularStudents = total - proStudents;

      // Count students with internships
      const studentsWithInternships = new Set();
      applications.forEach((appSet) => {
        if (Array.isArray(appSet.applications)) {
          appSet.applications.forEach((app) => {
            if (app.status === "current" || app.status === "completed") {
              studentsWithInternships.add(app.email);
            }
          });
        }
      });

      const withInternships = studentsWithInternships.size;
      const withoutInternships = total - withInternships;

      setStudentStats({
        total,
        pro: proStudents,
        regular: regularStudents,
        withInternships,
        withoutInternships,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
    }
  };

  // Fetch workshop statistics
  const fetchWorkshopStats = async () => {
    try {
      const workshops = await getAllFromStore("workshops");

      // Count workshops by status
      const now = new Date();
      let completed = 0,
        upcoming = 0;
      const categoryCounts = {};

      workshops.forEach((workshop) => {
        const workshopDate = new Date(workshop.date);
        if (workshopDate < now) {
          completed++;
        } else {
          upcoming++;
        }

        // Count by category
        if (workshop.category) {
          if (!categoryCounts[workshop.category]) {
            categoryCounts[workshop.category] = 0;
          }
          categoryCounts[workshop.category]++;
        }
      });

      const categoryData = Object.keys(categoryCounts).map((category) => ({
        name: category,
        count: categoryCounts[category],
      }));

      setWorkshopStats({
        total: workshops.length,
        completed,
        upcoming,
        categories: categoryData,
      });
    } catch (error) {
      console.error("Error fetching workshop stats:", error);
    }
  };

  // Fetch application trends
  const fetchApplicationTrends = async () => {
    try {
      const applications = await getAllFromStore("InternshipApplications");
      const applicationDates = [];

      applications.forEach((appSet) => {
        if (Array.isArray(appSet.applications)) {
          appSet.applications.forEach((app) => {
            if (app.appliedDate) {
              applicationDates.push({
                date: new Date(app.appliedDate),
                status: app.status || "pending",
              });
            }
          });
        }
      });

      // Group by month
      const monthlyData = {};
      applicationDates.forEach((app) => {
        const monthYear = format(app.date, "MMM yyyy");
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            name: monthYear,
            total: 0,
            accepted: 0,
            rejected: 0,
            pending: 0,
          };
        }

        monthlyData[monthYear].total++;

        if (
          app.status === "accepted" ||
          app.status === "current" ||
          app.status === "completed"
        ) {
          monthlyData[monthYear].accepted++;
        } else if (app.status === "rejected") {
          monthlyData[monthYear].rejected++;
        } else {
          monthlyData[monthYear].pending++;
        }
      });

      // Convert to array and sort by date
      const trendsArray = Object.values(monthlyData).sort((a, b) => {
        const aDate = new Date(a.name);
        const bDate = new Date(b.name);
        return aDate - bDate;
      });

      setApplicationTrends(trendsArray);
    } catch (error) {
      console.error("Error fetching application trends:", error);
    }
  };

  const exportAsPdf = async (
    componentRef,
    filename = "dashboard-report.pdf"
  ) => {
    try {
      setExportLoading(true);

      // Initialize the PDF document - CHANGED TO LANDSCAPE
      const doc = new jsPDF({
        orientation: "landscape", // Changed from portrait to landscape
        unit: "mm",
        format: "a4",
      });

      // Set fonts and colors
      const titleFont = 16;
      const headerFont = 12;
      const normalFont = 10;
      const smallFont = 8;
      const primaryColor = "#1d4ed8"; // Primary blue color
      const margin = 15; // Slightly reduced margin
      let yPos = margin;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * margin;

      // Add header with title and date
      doc.setFontSize(titleFont);
      doc.setTextColor(primaryColor);

      // Determine which report is being exported based on componentRef
      let reportTitle = "SCAD Dashboard Report";
      let reportData = {};

      if (componentRef === dashboardRef) {
        reportTitle = "Complete SCAD Dashboard Report";
        reportData = {
          reportStats,
          internshipStats,
          studentStats,
          workshopStats,
          topCompanies: topCompanies.slice(0, 5),
          companyRatings: companyRatings.slice(0, 5),
          courseUsage: courseUsage.slice(0, 5),
          applicationTrends: applicationTrends.slice(-5), // Last 5 periods
        };
      } else if (componentRef === reportsChartRef) {
        reportTitle = "Report Status Distribution";
        reportData = { reportStats };
      } else if (componentRef === topCompaniesChartRef) {
        reportTitle = "Top Companies by Internship Count";
        reportData = { topCompanies: topCompanies.slice(0, 8) };
      } else if (componentRef === courseChartRef) {
        reportTitle = "Course Usage in Reports";
        reportData = { courseUsage: courseUsage.slice(0, 8) };
      } else if (componentRef === companyRatingsChartRef) {
        reportTitle = "Top Rated Companies";
        reportData = { companyRatings: companyRatings.slice(0, 8) };
      } else if (componentRef === applicationTrendsChartRef) {
        reportTitle = "Application Trends Over Time";
        reportData = { applicationTrends: applicationTrends.slice(-12) }; // Last 12 periods
      }

      // Add title
      doc.text(reportTitle, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      // Add generation date
      doc.setFontSize(smallFont);
      doc.setTextColor(100, 100, 100); // Gray color
      const dateText = `Generated on: ${format(new Date(), "PPP pp")}`;
      doc.text(dateText, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 15;

      // Reset text color to black for content
      doc.setTextColor(0, 0, 0);

      // If it's the full dashboard export, add sections for different metrics
      if (componentRef === dashboardRef) {
        // Create a two-column layout
        const columnWidth = contentWidth / 2;
        const leftColumnX = margin;
        const rightColumnX = margin + columnWidth + 10; // Add 10mm spacing between columns
        let leftYPos = yPos;
        let rightYPos = yPos;

        // Left Column - Report Stats Section
        leftYPos = addSectionTitle(
          doc,
          "Report Statistics",
          leftColumnX,
          leftYPos
        );
        const reportStatsData = [
          ["Total Reports", reportStats.total.toString()],
          ["Approved", reportStats.approved.toString()],
          ["Rejected", reportStats.rejected.toString()],
          ["Flagged", reportStats.flagged.toString()],
          ["Pending", reportStats.pending.toString()],
          ["Avg. Review Time", `${reportStats.avgReviewTime} days`],
        ];
        leftYPos = addTable(
          doc,
          reportStatsData,
          leftColumnX,
          leftYPos,
          columnWidth - 10
        );

        // Left Column - Student Stats Section
        leftYPos = addSectionTitle(
          doc,
          "Student Statistics",
          leftColumnX,
          leftYPos
        );
        const studentStatsData = [
          ["Total Students", studentStats.total.toString()],
          ["PRO Students", studentStats.pro.toString()],
          ["Regular Students", studentStats.regular.toString()],
          ["With Internships", studentStats.withInternships.toString()],
          ["Without Internships", studentStats.withoutInternships.toString()],
        ];
        leftYPos = addTable(
          doc,
          studentStatsData,
          leftColumnX,
          leftYPos,
          columnWidth - 10
        );

        // Right Column - Internship Stats Section
        rightYPos = addSectionTitle(
          doc,
          "Internship Statistics",
          rightColumnX,
          rightYPos
        );
        const internshipStatsData = [
          ["Total Internships", internshipStats.total.toString()],
          ["Active", internshipStats.active.toString()],
          ["Completed", internshipStats.completed.toString()],
          ["Pending", internshipStats.pending.toString()],
          [
            "Acceptance Rate",
            `${
              internshipStats.total
                ? Math.round(
                    ((internshipStats.active + internshipStats.completed) /
                      internshipStats.total) *
                      100
                  )
                : 0
            }%`,
          ],
        ];
        rightYPos = addTable(
          doc,
          internshipStatsData,
          rightColumnX,
          rightYPos,
          columnWidth - 10
        );

        // Start a new section below the tallest column
        yPos = Math.max(leftYPos, rightYPos) + 5;

        // Full width - Top Companies Section
        yPos = addSectionTitle(doc, "Top Companies", margin, yPos);
        const topCompaniesData = [["Company", "Internships", "Rating"]];
        topCompanies.slice(0, 5).forEach((company) => {
          topCompaniesData.push([
            company.name,
            company.internships.toString(),
            company.rating.toFixed(1),
          ]);
        });
        yPos = addTableWithHeader(
          doc,
          topCompaniesData,
          margin,
          yPos,
          contentWidth
        );

        // Check if need to add a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        // Split the remaining sections into two columns again
        leftYPos = yPos;
        rightYPos = yPos;

        // Left Column - Course Usage Section
        leftYPos = addSectionTitle(doc, "Course Usage", leftColumnX, leftYPos);
        const courseUsageData = [["Course", "Count"]];
        courseUsage.slice(0, 5).forEach((course) => {
          courseUsageData.push([course.name, course.count.toString()]);
        });
        leftYPos = addTableWithHeader(
          doc,
          courseUsageData,
          leftColumnX,
          leftYPos,
          columnWidth - 10
        );

        // Right Column - Application Trends Section
        rightYPos = addSectionTitle(
          doc,
          "Recent Application Trends",
          rightColumnX,
          rightYPos
        );
        const trendsData = [["Period", "Total", "Accepted", "Rejected"]];
        applicationTrends.slice(-5).forEach((trend) => {
          trendsData.push([
            trend.name,
            trend.total.toString(),
            trend.accepted.toString(),
            trend.rejected.toString(),
          ]);
        });
        rightYPos = addTableWithHeader(
          doc,
          trendsData,
          rightColumnX,
          rightYPos,
          columnWidth - 10
        );
      } else if (componentRef === reportsChartRef) {
        // Report Status Distribution specific export
        const reportStatsData = [
          ["Status", "Count", "Percentage"],
          [
            "Approved",
            reportStats.approved.toString(),
            `${
              reportStats.total
                ? Math.round((reportStats.approved / reportStats.total) * 100)
                : 0
            }%`,
          ],
          [
            "Rejected",
            reportStats.rejected.toString(),
            `${
              reportStats.total
                ? Math.round((reportStats.rejected / reportStats.total) * 100)
                : 0
            }%`,
          ],
          [
            "Flagged",
            reportStats.flagged.toString(),
            `${
              reportStats.total
                ? Math.round((reportStats.flagged / reportStats.total) * 100)
                : 0
            }%`,
          ],
          [
            "Pending",
            reportStats.pending.toString(),
            `${
              reportStats.total
                ? Math.round((reportStats.pending / reportStats.total) * 100)
                : 0
            }%`,
          ],
          ["Total", reportStats.total.toString(), "100%"],
        ];
        yPos = addTableWithHeader(
          doc,
          reportStatsData,
          margin,
          yPos,
          contentWidth
        );
      } else if (componentRef === topCompaniesChartRef) {
        // Top Companies specific export
        const companiesData = [["Rank", "Company", "Internships", "Rating"]];
        topCompanies.forEach((company, index) => {
          companiesData.push([
            (index + 1).toString(),
            company.name,
            company.internships.toString(),
            company.rating.toFixed(1),
          ]);
        });
        yPos = addTableWithHeader(
          doc,
          companiesData,
          margin,
          yPos,
          contentWidth
        );
      } else if (componentRef === courseChartRef) {
        // Course Usage specific export
        const coursesData = [["Rank", "Course", "Usage Count"]];
        courseUsage.forEach((course, index) => {
          coursesData.push([
            (index + 1).toString(),
            course.name,
            course.count.toString(),
          ]);
        });
        yPos = addTableWithHeader(doc, coursesData, margin, yPos, contentWidth);
      } else if (componentRef === companyRatingsChartRef) {
        // Company Ratings specific export
        const ratingsData = [["Rank", "Company", "Rating", "Count of Ratings"]];
        companyRatings.forEach((company, index) => {
          ratingsData.push([
            (index + 1).toString(),
            company.name,
            company.rating.toFixed(1),
            company.count.toString(),
          ]);
        });
        yPos = addTableWithHeader(doc, ratingsData, margin, yPos, contentWidth);
      } else if (componentRef === applicationTrendsChartRef) {
        // Application Trends specific export
        const trendsData = [
          ["Period", "Total Applications", "Accepted", "Rejected", "Pending"],
        ];
        applicationTrends.forEach((trend) => {
          trendsData.push([
            trend.name,
            trend.total.toString(),
            trend.accepted.toString(),
            trend.rejected.toString(),
            trend.pending.toString(),
          ]);
        });
        yPos = addTableWithHeader(doc, trendsData, margin, yPos, contentWidth);
      }

      // Add footer with page numbers
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });
      }

      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to add a section title to the PDF
  const addSectionTitle = (doc, title, x, yPos) => {
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175); // Darker blue
    doc.text(title, x, yPos);

    // Draw line under title - adjusted to match x position
    const lineWidth = 50; // Fixed line width for section headers
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200); // Light gray
    doc.line(x, yPos + 1, x + lineWidth, yPos + 1);

    doc.setTextColor(0, 0, 0); // Reset to black
    doc.setFontSize(10);
    return yPos + 8; // Slightly reduced spacing
  };

  // Helper function to add a simple key-value table to the PDF
  const addTable = (doc, data, x, yPos, width) => {
    const rowHeight = 7; // Slightly reduced row height for more compact tables
    const colWidth = width / 2;

    // Draw table border
    doc.setDrawColor(220, 220, 220); // Light gray for borders
    doc.setLineWidth(0.1);
    doc.rect(x, yPos - 5, width, rowHeight * data.length + 2);

    data.forEach((row, i) => {
      // Alternate row background
      if (i % 2 === 1) {
        doc.setFillColor(245, 245, 245); // Light gray background
        doc.rect(x, yPos - 5, width, rowHeight, "F");
      }

      // Draw cell borders
      doc.line(x + colWidth, yPos - 5, x + colWidth, yPos + 2); // Vertical line separating columns
      if (i > 0) {
        doc.line(x, yPos - 5, x + width, yPos - 5); // Horizontal line separating rows
      }

      // Add cell text
      doc.setFontSize(9);
      doc.text(row[0], x + 2, yPos); // Left padding of 2mm
      doc.text(row[1], x + colWidth + 2, yPos); // Left padding of 2mm for second column

      yPos += rowHeight;
    });

    return yPos + 3; // Add some space after the table
  };

  // Helper function to add a table with header
  const addTableWithHeader = (doc, data, x, yPos, width) => {
    const headerRow = data[0];
    const rows = data.slice(1);
    const rowHeight = 7;
    const colWidth = width / headerRow.length;

    // Draw table border
    doc.setDrawColor(220, 220, 220); // Light gray for borders
    doc.setLineWidth(0.1);
    doc.rect(x, yPos - 5, width, rowHeight * (rows.length + 1) + 2);

    // Draw header
    doc.setFillColor(220, 230, 250); // Light blue background for header
    doc.rect(x, yPos - 5, width, rowHeight, "F");
    doc.setFont(undefined, "bold");

    // Add header text
    headerRow.forEach((header, i) => {
      doc.text(header, x + colWidth * i + 2, yPos); // Left padding of 2mm
    });

    // Draw header separator line
    doc.line(x, yPos + 2, x + width, yPos + 2);

    doc.setFont(undefined, "normal");
    yPos += rowHeight;

    // Draw rows
    rows.forEach((row, rowIndex) => {
      // Alternate row background
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245); // Very light gray
        doc.rect(x, yPos - 5, width, rowHeight, "F");
      }

      // Draw vertical column separators
      for (let i = 1; i < headerRow.length; i++) {
        doc.line(x + colWidth * i, yPos - 5, x + colWidth * i, yPos + 2);
      }

      // Draw horizontal row separator if not the last row
      if (rowIndex < rows.length - 1) {
        doc.line(x, yPos + 2, x + width, yPos + 2);
      }

      // Add cell text
      row.forEach((cell, cellIndex) => {
        doc.text(cell, x + colWidth * cellIndex + 2, yPos); // Left padding of 2mm
      });

      yPos += rowHeight;
    });

    return yPos + 5; // Add some space after the table
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      ref={dashboardRef}
    >
      <div className="flex justify-between items-center">
        <motion.h2
          className="text-3xl font-bold tracking-tight"
          variants={itemVariants}
        >
          SCAD Dashboard
        </motion.h2>
        <motion.div className="flex items-center gap-4" variants={itemVariants}>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            onClick={() =>
              exportAsPdf(dashboardRef, "scad-dashboard-report.pdf")
            }
            disabled={exportLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Full Report
          </Button>
        </motion.div>
      </div>

      <motion.div
        className="text-sm text-muted-foreground"
        variants={itemVariants}
      >
        Last updated: {format(lastUpdated, "PPP pp")}
      </motion.div>

      {/* Overview Stats Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        <motion.div variants={cardVariants} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  reportStats.total
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg. Review Time: {reportStats.avgReviewTime} days
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="flex gap-1">
                  <CheckCircle className="h-3 w-3" /> {reportStats.approved}
                </Badge>
                <Badge variant="destructive" className="flex gap-1">
                  <XCircle className="h-3 w-3" /> {reportStats.rejected}
                </Badge>
                <Badge
                  variant="warning"
                  className="flex gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200"
                >
                  <Flag className="h-3 w-3" /> {reportStats.flagged}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internships</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  internshipStats.total
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Active: {internshipStats.active} / Completed:{" "}
                {internshipStats.completed}
              </div>
              <div className="w-full mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Acceptance Rate</span>
                  <span>
                    {internshipStats.total
                      ? `${Math.round(
                          ((internshipStats.active +
                            internshipStats.completed) /
                            internshipStats.total) *
                            100
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: internshipStats.total
                        ? `${
                            ((internshipStats.active +
                              internshipStats.completed) /
                              internshipStats.total) *
                            100
                          }%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  studentStats.total
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                PRO: {studentStats.pro} / Regular: {studentStats.regular}
              </div>
              <div className="w-full mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Internship Participation</span>
                  <span>
                    {studentStats.total
                      ? `${Math.round(
                          (studentStats.withInternships / studentStats.total) *
                            100
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: studentStats.total
                        ? `${
                            (studentStats.withInternships /
                              studentStats.total) *
                            100
                          }%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants} whileHover="hover">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workshops</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  workshopStats.total
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Upcoming: {workshopStats.upcoming} / Completed:{" "}
                {workshopStats.completed}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {workshopStats.categories.slice(0, 3).map((category, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {category.name}: {category.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="reports" className="mt-8">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="reports">Reports Analysis</TabsTrigger>
          <TabsTrigger value="companies">Company Analysis</TabsTrigger>
          <TabsTrigger value="students">Student Analysis</TabsTrigger>
          <TabsTrigger value="trends">Application Trends</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              ref={reportsChartRef}
            >
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Report Status Distribution</CardTitle>
                    <CardDescription>
                      Report review status breakdown
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      exportAsPdf(
                        reportsChartRef,
                        "report-status-distribution.pdf"
                      )
                    }
                    disabled={exportLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Approved",
                                value: reportStats.approved,
                                color: STATUS_COLORS.approved,
                              },
                              {
                                name: "Rejected",
                                value: reportStats.rejected,
                                color: STATUS_COLORS.rejected,
                              },
                              {
                                name: "Flagged",
                                value: reportStats.flagged,
                                color: STATUS_COLORS.flagged,
                              },
                              {
                                name: "Pending",
                                value: reportStats.pending,
                                color: STATUS_COLORS.pending,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {[
                              {
                                name: "Approved",
                                value: reportStats.approved,
                                color: STATUS_COLORS.approved,
                              },
                              {
                                name: "Rejected",
                                value: reportStats.rejected,
                                color: STATUS_COLORS.rejected,
                              },
                              {
                                name: "Flagged",
                                value: reportStats.flagged,
                                color: STATUS_COLORS.flagged,
                              },
                              {
                                name: "Pending",
                                value: reportStats.pending,
                                color: STATUS_COLORS.pending,
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value} reports`, "Count"]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              ref={courseChartRef}
            >
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Course Usage in Reports</CardTitle>
                    <CardDescription>
                      Most frequently referenced courses
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      exportAsPdf(courseChartRef, "course-usage.pdf")
                    }
                    disabled={exportLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={courseUsage}
                          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${value} reports`, "Count"]}
                          />
                          <Bar dataKey="count" fill="#8884d8">
                            {courseUsage.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card>
              <CardHeader>
                <CardTitle>Report Review Metrics</CardTitle>
                <CardDescription>
                  Average review time and throughput
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            Avg Review Time
                          </div>
                          <div className="text-2xl font-bold">
                            {reportStats.avgReviewTime} days
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            Approval Rate
                          </div>
                          <div className="text-2xl font-bold">
                            {reportStats.total
                              ? `${Math.round(
                                  (reportStats.approved / reportStats.total) *
                                    100
                                )}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            Flag/Rejection Rate
                          </div>
                          <div className="text-2xl font-bold">
                            {reportStats.total
                              ? `${Math.round(
                                  ((reportStats.flagged +
                                    reportStats.rejected) /
                                    reportStats.total) *
                                    100
                                )}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              ref={topCompaniesChartRef}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Top Companies by Internship Count</CardTitle>
                    <CardDescription>
                      Companies hosting the most internships
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      exportAsPdf(topCompaniesChartRef, "top-companies.pdf")
                    }
                    disabled={exportLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topCompanies}
                          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `${value} internships`,
                              "Count",
                            ]}
                          />
                          <Bar dataKey="internships" fill="#0088FE">
                            {topCompanies.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              ref={companyRatingsChartRef}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Top Rated Companies</CardTitle>
                    <CardDescription>
                      Based on student evaluations
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      exportAsPdf(companyRatingsChartRef, "company-ratings.pdf")
                    }
                    disabled={exportLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={companyRatings}
                          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                          />
                          <YAxis domain={[0, 5]} />
                          <Tooltip
                            formatter={(value) => [`${value} / 5`, "Rating"]}
                          />
                          <Bar dataKey="rating" fill="#00C49F">
                            {companyRatings.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[(index + 3) % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card>
              <CardHeader>
                <CardTitle>Company Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed analysis of top companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Internships</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading
                        ? Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Skeleton className="h-4 w-[150px]" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-[50px]" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-[80px]" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="h-4 w-[80px]" />
                                </TableCell>
                              </TableRow>
                            ))
                        : topCompanies.map((company, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {company.name}
                              </TableCell>
                              <TableCell>{company.internships}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {company.rating.toFixed(1)}
                                  <div className="flex ml-2">
                                    {Array(5)
                                      .fill(0)
                                      .map((_, idx) => (
                                        <Star
                                          key={idx}
                                          className={`h-3 w-3 ${
                                            idx < Math.floor(company.rating)
                                              ? "text-yellow-400 fill-yellow-400"
                                              : idx < company.rating
                                              ? "text-yellow-400 fill-yellow-400 opacity-50"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    company.rating >= 4
                                      ? "success"
                                      : company.rating >= 3
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {company.rating >= 4
                                    ? "Excellent"
                                    : company.rating >= 3
                                    ? "Good"
                                    : "Average"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Student Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of student categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "PRO Students",
                                value: studentStats.pro,
                                color: "#0088FE",
                              },
                              {
                                name: "Regular Students",
                                value: studentStats.regular,
                                color: "#00C49F",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {[
                              {
                                name: "PRO Students",
                                value: studentStats.pro,
                                color: "#0088FE",
                              },
                              {
                                name: "Regular Students",
                                value: studentStats.regular,
                                color: "#00C49F",
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${value} students`,
                              "Count",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Internship Participation</CardTitle>
                  <CardDescription>
                    Students with and without internships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "With Internships",
                                value: studentStats.withInternships,
                                color: "#FFBB28",
                              },
                              {
                                name: "Without Internships",
                                value: studentStats.withoutInternships,
                                color: "#FF8042",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {[
                              {
                                name: "With Internships",
                                value: studentStats.withInternships,
                                color: "#FFBB28",
                              },
                              {
                                name: "Without Internships",
                                value: studentStats.withoutInternships,
                                color: "#FF8042",
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [
                              `${value} students`,
                              "Count",
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Metrics</CardTitle>
                <CardDescription>
                  Key statistics about student participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            PRO Enrollment
                          </div>
                          <div className="text-2xl font-bold">
                            {studentStats.total
                              ? `${Math.round(
                                  (studentStats.pro / studentStats.total) * 100
                                )}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            Internship Rate
                          </div>
                          <div className="text-2xl font-bold">
                            {studentStats.total
                              ? `${Math.round(
                                  (studentStats.withInternships /
                                    studentStats.total) *
                                    100
                                )}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">
                            PRO with Internships
                          </div>
                          <div className="text-2xl font-bold">
                            {studentStats.pro
                              ? `${Math.round(
                                  (studentStats.withInternships /
                                    studentStats.pro) *
                                    100
                                )}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Application Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            ref={applicationTrendsChartRef}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Application Trends Over Time</CardTitle>
                  <CardDescription>
                    Monthly application volume and outcomes
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    exportAsPdf(
                      applicationTrendsChartRef,
                      "application-trends.pdf"
                    )
                  }
                  disabled={exportLoading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-[400px]">
                    <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={applicationTrends}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} applications`, ""]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="accepted"
                          stroke="#82ca9d"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="rejected"
                          stroke="#ff8042"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Application Success Rate</CardTitle>
                  <CardDescription>
                    Percentage of successful applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="relative h-40 w-40">
                          <svg className="h-full w-full" viewBox="0 0 100 100">
                            <circle
                              className="text-muted stroke-current"
                              strokeWidth="10"
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                            ></circle>
                            <circle
                              className="text-primary stroke-current"
                              strokeWidth="10"
                              strokeLinecap="round"
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              strokeDasharray={`${
                                internshipStats.total
                                  ? ((internshipStats.active +
                                      internshipStats.completed) /
                                      internshipStats.total) *
                                    251.2
                                  : 0
                              } 251.2`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                            ></circle>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-3xl font-bold">
                              {internshipStats.total
                                ? `${Math.round(
                                    ((internshipStats.active +
                                      internshipStats.completed) /
                                      internshipStats.total) *
                                      100
                                  )}%`
                                : "0%"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                          {internshipStats.active + internshipStats.completed}{" "}
                          successful applications out of {internshipStats.total}{" "}
                          total
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Application Metrics</CardTitle>
                  <CardDescription>Key application statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Acceptance Rate
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {internshipStats.total
                            ? `${Math.round(
                                ((internshipStats.active +
                                  internshipStats.completed) /
                                  internshipStats.total) *
                                  100
                              )}%`
                            : "0%"}
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: internshipStats.total
                              ? `${
                                  ((internshipStats.active +
                                    internshipStats.completed) /
                                    internshipStats.total) *
                                  100
                                }%`
                              : "0%",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Completion Rate
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {internshipStats.active + internshipStats.completed
                            ? `${Math.round(
                                (internshipStats.completed /
                                  (internshipStats.active +
                                    internshipStats.completed)) *
                                  100
                              )}%`
                            : "0%"}
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-green-600"
                          style={{
                            width:
                              internshipStats.active + internshipStats.completed
                                ? `${
                                    (internshipStats.completed /
                                      (internshipStats.active +
                                        internshipStats.completed)) *
                                    100
                                  }%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          Rejection Rate
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {internshipStats.total
                            ? `${Math.round(
                                (internshipStats.pending /
                                  internshipStats.total) *
                                  100
                              )}%`
                            : "0%"}
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-red-600"
                          style={{
                            width: internshipStats.total
                              ? `${
                                  (internshipStats.pending /
                                    internshipStats.total) *
                                  100
                                }%`
                              : "0%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

