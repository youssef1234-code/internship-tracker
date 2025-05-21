import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { initMockData } from "./utils/mock-data.js";
// Auth Components
import AuthForm from "./components/auth/AuthForm.jsx";

// Layout Components
import AppLayout from "./components/layout/AppLayout.jsx";

// Company Components
import CompanyRegistrationForm from "./components/company/CompanyRegistrationForm.jsx";
import InternshipPosts from "./components/company/InternshipPosts.jsx";
import CompanyInternshipsList from "./components/company/CompanyInternshipsList.jsx";
import CompanyApplicationView from "./components/company/CompanyApplicationView.jsx";
import CompanyInternsManagement from "./components/company/CompanyInternsManagement.jsx";
import InternDetail from "./components/company/InternDetail.jsx";
import CompanyEvaluationForm from "./components/company/CompanyEvaluationForm.jsx";

// SCAD Office Components
import SCADDashboard from "@/components/scad/SCADDashboard";
import CompanyApprovalList from "./components/scad/CompanyApprovalList.jsx";
import WorkshopManagement from "./components/scad/WorkshopManagement.jsx";
import StudentsList from "./components/scad/StudentsList";
import ReportsList from "./components/scad/ReportsList";
import InternshipCycleSettings from "./components/scad/InternshipCycleSettings";
import ScadAppointment from "./components/scad/SCADAppointments.jsx";
import InternEvaluationsView from "./components/scad/InternEvaluationsView.jsx";

// Student Components
import WorkshopManagementProStudent from "./components/student/WorkshopManagementProStudent.jsx";
import StudentProfileForm from "./components/student/StudentProfileForm.jsx";
import StudentApplicationsList from "./components/student/StudentApplicationsList.jsx";
import InternshipReportForm from "./components/student/InternshipReportForm.jsx";
import StudentApplicationForm from "./components/student/StudentApplicationForm.jsx";
import StudentInternships from "./components/student/StudentInternships.jsx";
import OnlineAssessments from "./components/student/OnlineAssessments";
import VideoCall from "./components/student/StudentVideoCall.jsx";
import StudentHelp from "./components/student/StudentHelp.jsx";
// company
import CompanyEvaluation from "./components/student/CompanyEvaluation.jsx";
// Internship Components
import InternshipListing from "./components/internships/InternshipListing.jsx";
import InternshipDetail from "./components/internships/InternshipDetail.jsx";
import CompanyApplicationsList from "./components/company/CompanyApplicationsList.jsx";

// Mail Components
import Mailbox from "./components/mail/Mailbox.jsx";

function App() {
  const [user, setUser] = useState(null);

  const initializeDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("StudentProfileDB");

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject("Error opening IndexedDB");
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create an object store for student profiles
        if (!db.objectStoreNames.contains("scadAppointments")) {
          const store = db.createObjectStore("scadAppointments", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("studentAppointments")) {
          const store = db.createObjectStore("studentAppointments", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("studentProfiles")) {
          const store = db.createObjectStore("studentProfiles", {
            keyPath: "email",
          });
          store.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("InternshipApplications")) {
          const store = db.createObjectStore("InternshipApplications", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("AssessmentResults")) {
          const store = db.createObjectStore("AssessmentResults", {
            keyPath: "email",
          });
          store.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("companyProfiles")) {
          const store = db.createObjectStore("companyProfiles", {
            keyPath: "email",
          });
          store.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("Internships")) {
          const store = db.createObjectStore("Internships", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("workshops")) {
          const store = db.createObjectStore("workshops", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("notifications")) {
          const store = db.createObjectStore("notifications", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
        }
        if (!db.objectStoreNames.contains("emails")) {
          const store = db.createObjectStore("emails", {
            keyPath: "id",
          });
          store.createIndex("id", "id", { unique: true });
          store.createIndex("recipient", "recipient", { unique: false });
        }
        if (!db.objectStoreNames.contains("companyViews")) {
          const store = db.createObjectStore("companyViews", {
            keyPath: "email",
          });
          store.createIndex("email", "email", { unique: true });
        }
        if (!db.objectStoreNames.contains("InternshipEvaluations")) {
          const store = db.createObjectStore("InternshipEvaluations", {
            keyPath: "internshipId",
          });
          store.createIndex("internshipId", "internshipId", { unique: true });
        }
      };
    });
  };

  useEffect(() => {
    initializeDB()
      .then((db) => {
        console.log("Database initialized:", db);
      })
      .catch((error) => {
        console.error("Error initializing database:", error);
      });
    const initMock = async () => {
      await initMockData();

      // Initialize sample emails only happens when user logs in to Mailbox now
      // This is handled in the Mailbox component
    };
    initMock();
  }, []);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthForm onLogin={handleLogin} />} />
        <Route path="/login" element={<AuthForm onLogin={handleLogin} />} />
        <Route path="/register" element={<CompanyRegistrationForm />} />
        <Route path="/mailbox" element={<Mailbox />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <AppLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Common routes */}
          <Route path="internships" element={<InternshipListing />} />
          {<Route path="appointment" element={<ScadAppointment />} />}
          {/* <Route path="internships/:id" element={<InternshipDetail />} /> */}

          {/* Company routes */}
          <Route path="company">
            {/* <Route index element={<CompanyDashboard />} /> */}
            <Route path="post" element={<InternshipPosts />} />
            <Route path="internships" element={<CompanyInternshipsList />} />
            <Route path="internships/:id" element={<InternshipDetail />} />
            <Route path="applications" element={<CompanyApplicationsList />} />
            <Route
              path="applications/:id"
              element={<CompanyApplicationView />}
            />
            <Route path="interns" element={<CompanyInternsManagement />} />
            <Route path="interns/:id" element={<InternDetail />} />
            <Route path="evaluate/:id" element={<CompanyEvaluationForm />} />
          </Route>

          {/* SCAD Office routes */}
          <Route path="scad">
            <Route index element={<SCADDashboard />} />
            <Route path="companies" element={<CompanyApprovalList />} />
            <Route path="students" element={<StudentsList />} />
            <Route path="reports" element={<ReportsList />} />
            {<Route path="cycle" element={<InternshipCycleSettings />} />}
            {
              <Route
                path="intern-evaluations"
                element={<InternEvaluationsView />}
              />
            }
            {<Route path="appointment" element={<ScadAppointment />} />}
            <Route path="workshops" element={<WorkshopManagement />} />
          </Route>

          {/* Student routes */}
          <Route path="student">
            {/* <Route index element={<StudentDashboard />} /> */}
            <Route path="profile" element={<StudentProfileForm />} />
            <Route path="help" element={<StudentHelp />} />
            <Route path="applications" element={<StudentApplicationsList />} />
            <Route path="apply/:id" element={<StudentApplicationForm />} />
            <Route path="report/:id" element={<InternshipReportForm />} />
            <Route path="internships/:id" element={<InternshipDetail />} />
            <Route path="internships" element={<StudentInternships />} />
            <Route path="assessments" element={<OnlineAssessments />} />
            <Route path="appointment" element={<VideoCall />} />
            <Route path="CompanyEvaluation" element={<CompanyEvaluation />} />
            <Route
              path="workshops"
              element={<WorkshopManagementProStudent />}
            />
          </Route>
          <Route path="pro_student">
            <Route path="internships/:id" element={<InternshipDetail />} />
            <Route path="assessments" element={<OnlineAssessments />} />
            <Route path="CompanyEvaluation" element={<CompanyEvaluation />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
