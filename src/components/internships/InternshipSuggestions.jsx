import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Calendar,
  DollarSign,
  Tag,
  ThumbsUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { Badge } from "../ui/badge.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { getFromStore } from "../../utils/indexedDB-utils";

const getFromIndexedDB = (email) => getFromStore("studentProfiles", email);

const InternshipCard = ({ internship }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 hover:bg-accent cursor-pointer transition-colors"
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="font-medium text-lg flex items-center justify-between">
              <span className="flex items-center">
                {internship.title}
                <Badge
                  variant="primary"
                  className="ml-2 bg-primary/20 text-primary"
                >
                  Suggested
                </Badge>
              </span>

              {/* External link icon next to Suggested */}
              <div
                className="text-primary cursor-pointer ml-3"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/student/internships/${internship.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </div>
            </h3>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              Posted {new Date(internship.postedDate).toLocaleDateString()}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Building className="mr-1 h-4 w-4" />
          {internship.company.name} • {internship.company.industry}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 my-3">
                <div className="flex items-center bg-muted px-2 py-1 rounded text-sm">
                  <Calendar className="mr-1 h-3 w-3" />
                  {internship.duration}
                </div>
                <div className="flex items-center bg-muted px-2 py-1 rounded text-sm">
                  <DollarSign className="mr-1 h-3 w-3" />
                  {internship.isPaid ? internship.salary : "Unpaid"}
                </div>
                <div className="flex items-center bg-muted px-2 py-1 rounded text-sm">
                  {internship.location}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {internship.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {internship.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function InternshipSuggestions({ allInternships }) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedInternships, setSuggestedInternships] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);

        // Get user type and email from localStorage
        const storedUserType = localStorage.getItem("userType");
        const userEmail = localStorage.getItem("email");

        if (storedUserType) {
          setUserType(storedUserType);
        }

        // Only proceed if the user is a student and email exists
        if (
          (storedUserType === "student" || storedUserType === "pro_student") &&
          userEmail
        ) {
          // Get student profile data
          const profileData = await getFromIndexedDB(userEmail);

          if (profileData) {
            setStudentProfile(profileData);

            // Generate suggestions based on profile
            const suggestions = generateSuggestions(
              profileData,
              allInternships
            );
            setSuggestedInternships(suggestions);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Function to generate suggestions based on student profile
  const generateSuggestions = (profile, internships) => {
    if (!profile) return [];

    // Extract relevant profile information
    const { major, interests, experiences = [] } = profile;

    // Convert interests to array if it's a string
    const interestsArray = Array.isArray(interests)
      ? interests
      : typeof interests === "string"
      ? interests.split(",").map((i) => i.trim())
      : [];

    // Extract skills from experiences
    const experienceKeywords = experiences.flatMap((exp) =>
      exp.responsibilities
        ? exp.responsibilities.split(" ").filter((word) => word.length > 4)
        : []
    );

    // Keywords to match (from major, interests, and experience)
    const keywords = [major, ...interestsArray, ...experienceKeywords]
      .filter(Boolean)
      .map((k) => k.toLowerCase());

    // Score each internship based on keyword matches
    const scoredInternships = internships.map((internship) => {
      let score = 0;

      // Check title
      if (keywords.some((k) => internship.title.toLowerCase().includes(k))) {
        score += 3;
      }

      // Check description
      keywords.forEach((keyword) => {
        if (
          internship.description &&
          internship.description.toLowerCase().includes(keyword)
        ) {
          score += 1;
        }
      });

      // Check skills
      if (internship.skills) {
        internship.skills.forEach((skill) => {
          if (
            keywords.some(
              (k) =>
                skill.toLowerCase().includes(k) ||
                k.includes(skill.toLowerCase())
            )
          ) {
            score += 2;
          }
        });
      }

      // Check industry match with major or interests
      if (
        keywords.some((k) =>
          internship.company.industry.toLowerCase().includes(k)
        )
      ) {
        score += 2;
      }

      return {
        ...internship,
        score,
        suggested: score > 0,
      };
    });

    // Sort by score and take top 3
    return scoredInternships
      .filter((i) => i.suggested)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  // Only show for students
  if (userType !== "student" && userType !== "pro_student") {
    return null;
  }

  // Render placeholder states with animation
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Top 3 Suggested Internships</CardTitle>
            <CardDescription>
              Loading personalized recommendations...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 0.7 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1,
                  }}
                  className="h-24 bg-muted rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Show message if no profile data
  if (!studentProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Internship Recommendations</CardTitle>
            <CardDescription>
              Complete your profile to get personalized internship
              recommendations
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Show message if no suggestions
  if (suggestedInternships.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Internship Recommendations</CardTitle>
            <CardDescription>
              No internships match your profile yet. Check back later or update
              your profile with more details.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ThumbsUp className="mr-2 h-5 w-5 text-primary" />
            Recommended For You
          </CardTitle>
          <CardDescription>
            Internships that match your profile and interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            {suggestedInternships.map((internship, index) => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

