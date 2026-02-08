import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Plus, XCircle } from "lucide-react";
import {
  firebaseService,
  DailyPrompt as DailyPromptType,
} from "@/lib/firebaseService";
import { Timestamp } from "firebase/firestore";

interface DailyPromptProps {
  onSubmitMeme: () => void;
}

export default function DailyPrompt({ onSubmitMeme }: DailyPromptProps) {
  const [prompt, setPrompt] = useState<DailyPromptType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodayPrompt = async () => {
      try {
        let todayPrompt = await firebaseService.getTodayPrompt();

        if (!todayPrompt) {
          // Create today's prompt if it doesn't exist
          const prompts = [
            "Moment when $BASE finally drops.",
            "Trying to get into TBA (BaseApp)",
            "When someone says Ethereum is the only chain that matters but you are a Base Maxi.",
            "Explaining APY to someone who uses traditional banks.",
            "When the Base Dev actually listens to community",
            "When a normie asks you to onboard them.",
            "When the gas fees are low but your heart rate is high",
            "Me flexing my base experience like it's a skill",
            "When you realise compounding base rewards is actually working",
            "Trying to explain base to your non-crypto friend like..",
          ];

          const randomPrompt =
            prompts[Math.floor(Math.random() * prompts.length)];
          const promptId =
            await firebaseService.createDailyPrompt(randomPrompt);
          todayPrompt = await firebaseService.getTodayPrompt();
        }

        setPrompt(todayPrompt);
      } catch (error) {
        console.error("Failed to load daily prompt:", error);
        // Fallback prompt
        setPrompt({
          id: "fallback",
          prompt: "AI Takes Over the Kitchen",
          date: new Date().toISOString().split("T")[0],
          endsAt: Timestamp.fromDate(
            new Date(Date.now() + 24 * 60 * 60 * 1000),
          ),
          isActive: true,
          createdAt: Timestamp.fromDate(new Date()),
        });
      } finally {
        setLoading(false);
      }
    };

    loadTodayPrompt();
  }, []);

  useEffect(() => {
    if (!prompt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = prompt.endsAt.toDate().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [prompt]);

  if (loading) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 shadow-md rounded-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-6 bg-purple-300/30 dark:bg-purple-600/30 rounded-md w-1/3"></div>
              <div className="h-4 bg-purple-200/40 dark:bg-purple-500/20 rounded-md w-1/4"></div>
            </div>

            {/* Prompt skeleton */}
            <div className="text-center space-y-3 mt-4">
              <div className="h-6 bg-purple-300/40 dark:bg-purple-600/30 rounded-md mx-auto w-2/3"></div>
              <div className="h-4 bg-purple-200/50 dark:bg-purple-500/20 rounded-md mx-auto w-1/2"></div>
            </div>

            {/* Button skeleton */}
            <div className="h-10 bg-purple-400/30 dark:bg-purple-500/40 rounded-lg mx-auto w-1/2"></div>

            {/* Tip skeleton */}
            <div className="h-3 bg-purple-200/40 dark:bg-purple-500/20 rounded-md mx-auto w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prompt) {
    return (
      <Card className="border border-red-300 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/10 shadow-md rounded-xl">
        <CardContent className="p-6 text-center space-y-3">
          <div className="flex justify-center">
            <XCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-red-700 dark:text-red-300 font-medium">
            Failed to load today’s prompt.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please refresh the page or try again later.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm
                   dark:bg-red-400 dark:hover:bg-red-500 dark:text-gray-900 transition-all"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 shadow-md rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className=" text-[14px] sm:text-md font-bold flex items-center">
              <Zap className="mr-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
              Today's Meme Challenge
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-purple-500 dark:text-purple-300" />
              <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                {String(timeRemaining.hours).padStart(2, "0")}:
                {String(timeRemaining.minutes).padStart(2, "0")}:
                {String(timeRemaining.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Prompt Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              "{prompt.prompt}"
            </h3>
            <p className="text-sm text-muted-foreground">
              Create the funniest meme based on today's prompt and climb the
              leaderboard! 🏆
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              onClick={onSubmitMeme}
              size="lg"
              className="bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-400 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="mr-2 h-5 w-5" />
              Submit Your Meme
            </Button>
          </div>

          <div className="flex items-center flex-col">
            {/* Tip */}
            <div className=" text-xs text-muted-foreground">
              💡 Tip: Memes that reach{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-300">
                500 Likes
              </span>{" "}
              earn creators{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-300">
                60%
              </span>{" "}
              of the reward pool!
            </div>
            <div className=" text-xs text-muted-foreground">
              💡 Tip:{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-300">
                3 Likes
              </span>{" "}
              is deducted per like action.{" "}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
