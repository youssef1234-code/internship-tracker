import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Mail,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Circle,
  Search,
  Inbox,
  User,
  Lock,
  LogIn,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { Button } from "../ui/button.tsx";
import { Input } from "../ui/input.tsx";
import { Label } from "../ui/label.tsx";
import { Separator } from "../ui/separator.tsx";
import { ScrollArea } from "../ui/scroll-area.tsx";
import { Badge } from "../ui/badge.tsx";
import { Skeleton } from "../ui/skeleton.tsx";
import { Alert, AlertDescription } from "../ui/alert.tsx";
import {
  getUserEmails,
  markEmailAsRead,
  deleteEmail,
} from "@/utils/email-utils";

const Mailbox = () => {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    // Simple validation
    if (!loginEmail) {
      setLoginError("Email is required");
      setIsLoading(false);
      return;
    }

    // No actual authentication - just proceed with the provided email
    try {
      // Set authenticated and fetch emails for the provided email
      setIsAuthenticated(true);
      await fetchEmails(loginEmail);
    } catch (err) {
      setLoginError("Failed to load emails. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch emails when authenticated
  useEffect(() => {
    if (isAuthenticated && loginEmail) {
      fetchEmails(loginEmail);

      // Listen for new emails
      const handleNewEmail = () => {
        fetchEmails(loginEmail);
      };

      window.addEventListener("emailSent", handleNewEmail);

      return () => {
        window.removeEventListener("emailSent", handleNewEmail);
      };
    }
  }, [isAuthenticated, loginEmail]);

  // Fetch emails from IndexedDB
  const fetchEmails = async (email) => {
    try {
      setIsLoading(true);
      setError("");

      if (!email) {
        setError("User email is required");
        setIsLoading(false);
        return;
      }

      const userEmails = await getUserEmails(email);
      setEmails(userEmails);
      setUnreadCount(userEmails.filter((email) => !email.read).length);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
      setError("Failed to load emails");
      setIsLoading(false);
    }
  };

  // Filter emails based on search query
  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle email selection
  const handleEmailClick = async (email) => {
    setSelectedEmail(email);

    // Mark as read if unread
    if (!email.read) {
      try {
        await markEmailAsRead(email.id);
        // Update the emails list
        setEmails(
          emails.map((e) => (e.id === email.id ? { ...e, read: true } : e))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark email as read:", err);
      }
    }
  };

  // Handle email deletion
  const handleDeleteEmail = async (emailId) => {
    try {
      await deleteEmail(emailId);

      // Remove from list
      const updatedEmails = emails.filter((e) => e.id !== emailId);
      setEmails(updatedEmails);

      // Update unread count if needed
      const deletedEmail = emails.find((e) => e.id === emailId);
      if (deletedEmail && !deletedEmail.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Clear selection if the deleted email was selected
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(null);
      }
    } catch (err) {
      console.error("Failed to delete email:", err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // Login animation variants
  const loginVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const loginItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (custom) => ({
      opacity: 1,
      x: 0,
      transition: { delay: custom * 0.1, duration: 0.5 },
    }),
  };

  // Render login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={loginVariants}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" /> Mailbox Login
                  </CardTitle>
                  <CardDescription>
                    Enter your email to access your messages
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <motion.div
                  variants={loginItemVariants}
                  custom={1}
                  className="space-y-2"
                >
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={loginItemVariants}
                  custom={2}
                  className="space-y-2"
                >
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 mb-7"
                      autoComplete="current-password"
                    />
                  </div>
                </motion.div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing In...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render mailbox if authenticated
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Mailbox</h1>
        <Badge variant="secondary" className="ml-3">
          {unreadCount} unread
        </Badge>
        <span className="ml-auto text-sm text-muted-foreground">
          Signed in as: {loginEmail}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => setIsAuthenticated(false)}
        >
          Sign Out
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Email sidebar */}
        <Card className="md:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <Inbox className="h-5 w-5 mr-2" />
                Inbox
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchEmails(loginEmail)}
                className="h-8 w-8 p-0"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[calc(100vh-300px)]">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {isLoading ? (
                  // Loading skeletons
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))
                ) : filteredEmails.length > 0 ? (
                  filteredEmails.map((email) => (
                    <motion.div
                      key={email.id}
                      variants={itemVariants}
                      whileHover={{
                        scale: 1.01,
                        backgroundColor: "rgba(0,0,0,0.02)",
                      }}
                      className={`flex items-start p-3 rounded-md cursor-pointer ${
                        selectedEmail?.id === email.id ? "bg-muted" : ""
                      } ${!email.read ? "bg-blue-50" : ""}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      {!email.read && (
                        <Circle className="h-2 w-2 mt-2 mr-2 text-blue-600 fill-current" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p
                            className={`font-medium truncate ${
                              !email.read ? "font-semibold" : ""
                            }`}
                          >
                            {email.senderName || email.sender}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {format(new Date(email.date), "MMM d")}
                          </span>
                        </div>
                        <p className="text-sm truncate">{email.subject}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {email.content
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 60)}
                          ...
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Mail className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No emails found</p>
                    <p className="text-sm">
                      {searchQuery
                        ? "Try a different search term"
                        : "Your inbox is empty"}
                    </p>
                  </div>
                )}
              </motion.div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email content */}
        <Card className="md:col-span-8">
          <AnimatePresence mode="wait">
            {selectedEmail ? (
              <motion.div
                key="email-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                      {selectedEmail.subject}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <CardDescription className="flex justify-between">
                    <div>
                      From:{" "}
                      <span className="font-medium">
                        {selectedEmail.senderName || selectedEmail.sender}
                      </span>
                    </div>
                    <div>{format(new Date(selectedEmail.date), "PPpp")}</div>
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: selectedEmail.content,
                      }}
                    />
                  </ScrollArea>
                </CardContent>
              </motion.div>
            ) : (
              <motion.div
                key="email-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-[calc(100vh-250px)] flex flex-col items-center justify-center text-center p-4"
              >
                <Mail className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-medium mb-2">
                  Select an email to view
                </h3>
                <p className="text-muted-foreground">
                  Click on any email from the list to view its content here
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
};

export default Mailbox;

