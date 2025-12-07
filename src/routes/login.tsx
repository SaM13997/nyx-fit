import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, LineChart, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

const STEPS = [
  {
    id: "track",
    title: "Track Every Workout",
    description: "Log your sets, reps, and weights with ease. Keep a history of your fitness journey.",
    icon: Dumbbell,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: "analyze",
    title: "Analyze Your Progress",
    description: "Visualize your gains over time. see how far you've come with detailed charts.",
    icon: LineChart,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    id: "achieve",
    title: "Achieve Your Goals",
    description: "Set targets and smash them. Join a community of dedicated fitness enthusiasts.",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    id: "login",
    title: "Welcome Back",
    description: "Sign in to continue check your progress.",
    icon: null,
  },
];

function RouteComponent() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-zinc-900 to-black pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-64 h-64 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Progress Pills */}
      <div className="w-full max-w-md flex gap-2 z-10 pt-4">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${index <= currentStep ? "bg-white" : "bg-white/10"
              }`}
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center z-10 relative">
        <AnimatePresence mode="wait">
          {!isLastStep ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div
                className={`w-40 h-40 rounded-[2.5rem] flex items-center justify-center ${STEPS[currentStep].bg} border border-white/5 shadow-2xl backdrop-blur-sm`}
              >
                {/* Dynamic Icon Rendering */}
                {(() => {
                  const Icon = STEPS[currentStep].icon;
                  return Icon ? <Icon className={`w-20 h-20 ${STEPS[currentStep].color}`} /> : null;
                })()}
              </div>

              <div className="space-y-4">
                <motion.h2
                  key={STEPS[currentStep].title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold tracking-tight"
                >
                  {STEPS[currentStep].title}
                </motion.h2>
                <motion.p
                  key={STEPS[currentStep].description}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-gray-400 text-lg leading-relaxed px-4"
                >
                  {STEPS[currentStep].description}
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <LoginForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Area */}
      {!isLastStep && (
        <motion.div
          className="w-full max-w-md z-10 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-purple-900/20"
          >
            Next
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <button
            onClick={() => setCurrentStep(STEPS.length - 1)}
            className="w-full mt-4 text-gray-500 font-medium text-sm hover:text-white transition-colors"
          >
            Skip to Login
          </button>
        </motion.div>
      )}
    </div>
  );
}
