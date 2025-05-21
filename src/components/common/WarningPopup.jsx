import React, { useEffect, useState } from "react";
import { AlertCircle, Info, CheckCircle, XCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert.tsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/button.tsx";

const WarningPopup = ({
  title = "Warning",
  description = "An error occurred.",
  type = "warning", // 'warning', 'error', 'success', 'info'
  duration = 3000, // Increased default duration to 3000ms
  onClose, // Optional callback
  persistent = false, // New prop to make popup stay until manually closed
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration && !persistent) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, persistent]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "warning":
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getAlertStyle = () => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      case "warning":
      default:
        return "bg-amber-50 border-amber-200";
    }
  };

  // Animation variants for the popup
  const popupVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: 10,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-4 right-4 z-50"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={popupVariants}
        >
          <Alert
            className={`relative flex items-start gap-2 ${getAlertStyle()} p-4 pr-10 shadow-lg rounded-lg border`}
          >
            <motion.div
              className="mt-1"
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
            >
              {getIcon()}
            </motion.div>
            <div>
              <AlertTitle className="text-base font-medium">{title}</AlertTitle>
              <AlertDescription className="text-sm">
                {description}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default WarningPopup;

