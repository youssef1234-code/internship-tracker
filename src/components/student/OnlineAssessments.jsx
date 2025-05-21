import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { saveToStore, getFromStore } from "../../utils/indexedDB-utils";
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

const assessments = [
  {
    id: 1,
    title: "Myers Briggs Type Indicator (MBTI)",
    description:
      "A personality assessment tool that categorizes people into 16 distinct personality types based on their preferences in four key areas",
    link: "https://www.mbtionline.com/en-US/Products/For-you",
    result: [
      "ISTJ",
      "ISFJ",
      "INFJ",
      "INTJ",
      "ISTP",
      "ISFP",
      "INFP",
      "INTP",
      "ESTP",
      "ESFP",
      "ENFP",
      "ENTP",
      "ESTJ",
      "ESFJ",
      "ENFJ",
      "ENTJ",
    ],
  },
  {
    id: 2,
    title: "Big Five Personality Test (OCEAN)",
    description:
      "Measures five key dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
    link: "https://www.truity.com/test/big-five-personality-test",
    result: [
      "Openness",
      "Conscientiousness",
      "Extraversion",
      "Agreeableness",
      "Neuroticism",
    ],
  },
  {
    id: 3,
    title: "CliftonStrengths (StrengthsFinder)",
    description:
      "Identifies a person's top talents among 34 themes to help maximize personal and professional potential.",
    link: "https://www.gallup.com/cliftonstrengths/en/home.aspx",
    result: [
      "Achiever",
      "Activator",
      "Adaptability",
      "Analytical",
      "Arranger",
      "Belief",
      "Command",
      "Communication",
      "Competition",
      "Connectedness",
    ],
  },
  {
    id: 4,
    title: "DISC Personality Assessment",
    description:
      "Focuses on four primary behavioral traits: Dominance, Influence, Steadiness, and Conscientiousness.",
    link: "https://www.tonyrobbins.com/disc/",
    result: ["Dominance", "Influence", "Steadiness", "Conscientiousness"],
  },
  {
    id: 5,
    title: "Enneagram Personality Test",
    description:
      "A model of the human psyche which is principally understood as a typology of nine interconnected personality types.",
    link: "https://www.truity.com/test/enneagram-personality-test",
    result: [
      "Type 1: Reformer",
      "Type 2: Helper",
      "Type 3: Achiever",
      "Type 4: Individualist",
      "Type 5: Investigator",
      "Type 6: Loyalist",
      "Type 7: Enthusiast",
      "Type 8: Challenger",
      "Type 9: Peacemaker",
    ],
  },
];

const saveToIndexedDB = (data) => saveToStore("AssessmentResults", data);

const getFromIndexedDB = async (email) =>
  getFromStore("AssessmentResults", email);

const AssessmentCard = ({ assessment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [pastResults, setPastResults] = useState(null);
  const [res, setRes] = useState("");

  useEffect(() => {
    const fetchStored = async () => {
      const email = localStorage.getItem("email");
      const currentD = await getFromIndexedDB(email);
      setPastResults(currentD ? currentD.assessmentResults : []);
    };
    fetchStored();
  }, []);

  const handleResult = (assessment) => {
    return assessment.result[
      Math.floor(Math.random() * assessment.result.length)
    ];
  };

  const handleClick = async () => {
    if (!isTested) {
      const test = handleResult(assessment);
      setRes(test);

      const email = localStorage.getItem("email");
      const currentD = await getFromIndexedDB(email);
      const currentData =
        currentD && currentD.assessmentResults
          ? currentD.assessmentResults.filter((o) => o.id != assessment.id)
          : [];
      const result = [
        ...currentData,
        {
          email: email,
          id: assessment.id,
          title: assessment.title,
          result: test,
          showRes: false,
        },
      ];

      await saveToIndexedDB({ email: email, assessmentResults: result });
      setIsTested(true);
    }
  };

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
              <span className="flex items-center">{assessment.title}</span>

              {/* External link icon next to Suggested */}
              <div
                className="text-primary cursor-pointer ml-3"
                onClick={handleClick}
              >
                <a href={assessment.link} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </h3>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">
              {(isTested && `Result: ${res}`) ||
                (pastResults &&
                  pastResults.some((l) => l.id === assessment.id) &&
                  `Result: ${
                    pastResults.find((o) => o.id === assessment.id)?.result ??
                    "N/A"
                  }`)}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </div>
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
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {assessment.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function OnlineAssessments() {
  return (
    <motion.div
      className="w-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="w-full max-w-full mx-auto">
        <CardHeader>
          <CardTitle>Online Assessments</CardTitle>
          <CardDescription>
            A list of online assessments to help you identify your personality
            and strengths.
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
            {assessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

