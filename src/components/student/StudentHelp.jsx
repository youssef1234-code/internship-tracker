import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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


const computer_science = "https://player.vimeo.com/video/1083248753?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

const business_administration = "https://player.vimeo.com/video/1083248919?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

const engineering = "https://player.vimeo.com/video/1083249055?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

const design = "https://player.vimeo.com/video/1083249168?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

const communication = "https://player.vimeo.com/video/1083249321?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

export default function OnlineAssessments() {
  const [video, setVideo] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const email = localStorage.getItem("email");
      const student = await getFromStore("studentProfiles", email);

      switch (student.major) {
        case "computer_science": setVideo(computer_science); break;
        case "business_administration": setVideo(business_administration); break;
        case "engineering": setVideo(engineering); break;
        case "design": setVideo(design); break;
        case "communication": setVideo(communication); break;
        default: break;
      }
    }

    loadData();
  }, [])

  return (
    <Card className="w-full max-w-full mx-auto">
      <CardHeader>
        <CardTitle>Internship Help</CardTitle>
        <CardDescription>
          The below video describes the valid types of internships you can do that are accepted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {video && (<iframe src={video} frameborder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" style={{ top: 0, left: 0, width: 1500, height: 900 }} title="Design"></iframe>)}
        {!video && <h3>Invalid Major</h3>}
      </CardContent>
    </Card >
  );
}

