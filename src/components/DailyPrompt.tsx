import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Plus } from 'lucide-react';
import { firebaseService, DailyPrompt as DailyPromptType } from '@/lib/firebaseService';
import { Timestamp } from 'firebase/firestore';

interface DailyPromptProps {
  onSubmitMeme: () => void;
}

export default function DailyPrompt({ onSubmitMeme }: DailyPromptProps) {
  const [prompt, setPrompt] = useState<DailyPromptType | null>(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodayPrompt = async () => {
      try {
        let todayPrompt = await firebaseService.getTodayPrompt();
        
        if (!todayPrompt) {
          // Create today's prompt if it doesn't exist
          const prompts = [
            "AI Takes Over the Kitchen",
            "When Crypto Goes to the Moon",
            "NFTs in Real Life",
            "Web3 vs Web2 Battle",
            "Smart Contracts Gone Wrong",
            "DeFi Farming Adventures",
            "Metaverse Monday Blues",
            "DAO Drama Llama"
          ];
          
          const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
          const promptId = await firebaseService.createDailyPrompt(randomPrompt);
          todayPrompt = await firebaseService.getTodayPrompt();
        }
        
        setPrompt(todayPrompt);
      } catch (error) {
        console.error('Failed to load daily prompt:', error);
        // Fallback prompt
        setPrompt({
          id: 'fallback',
          prompt: "AI Takes Over the Kitchen",
          date: new Date().toISOString().split('T')[0],
          endsAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
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

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-yellow-200 rounded mb-4"></div>
            <div className="h-4 bg-yellow-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prompt) {
    return (
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load today's prompt. Please refresh the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center">
            <Zap className="mr-2 h-6 w-6 text-yellow-600" />
            Today's Meme Challenge
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="font-mono font-bold text-orange-600">
              {String(timeRemaining.hours).padStart(2, '0')}:
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            "{prompt.prompt}"
          </h3>
          <p className="text-sm text-muted-foreground">
            Create the funniest meme based on today's prompt and climb the leaderboard! 🏆
          </p>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={onSubmitMeme}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-5 w-5" />
            Submit Your Meme
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          💡 Tip: Memes that reach 1000 Pads earn creators 30% of the reward pool!
        </div>
      </CardContent>
    </Card>
  );
}