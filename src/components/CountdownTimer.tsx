import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer = ({ targetDate, className = '' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium text-green-600 ${className}`}>
        <Clock className="h-4 w-4" />
        <span>Event Started!</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4 text-purple-500" />
      <div className="flex gap-1 text-sm font-mono">
        {timeLeft.days > 0 && (
          <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
            {timeLeft.days}d
          </div>
        )}
        <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
          {String(timeLeft.hours).padStart(2, '0')}h
        </div>
        <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </div>
        <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold min-w-[32px] text-center">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </div>
      </div>
    </div>
  );
};
