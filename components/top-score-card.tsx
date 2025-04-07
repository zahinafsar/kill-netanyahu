"use client";

import { useEffect, useState } from "react";
import { getTopScorers } from "@/app/actions";

export function TopScoreCard() {
  const [topScorers, setTopScorers] = useState<{ name: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopScorers = async () => {
      try {
        const scorers = await getTopScorers();
        setTopScorers(scorers);
      } catch (error) {
        console.error("Error fetching top scorers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopScorers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 w-full bg-slate-700 p-6 rounded-lg mb-8">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-6 bg-slate-600 rounded w-32"></div>
              <div className="h-6 bg-slate-600 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full bg-slate-700 p-6 rounded-lg mb-8">
      {topScorers.map((scorer, index) => (
        <div
          key={index}
          className="flex justify-between items-center text-slate-200"
        >
          <div className="flex items-center gap-2">
            <span className="mr-1">
              {index === 0 && <p>👑</p>}
              {index === 1 && <p>🥈</p>}
              {index === 2 && <p>🥉</p>}
            </span>
            <p className="font-semibold">{scorer.name}</p>
            {index <= 2 && (
              <div className="text-xs px-2 py-0.5 bg-slate-500 rounded-full">
                <p>#{index + 1}</p>
              </div>
            )}
          </div>
          <span className="bg-slate-600 px-4 py-1 rounded">
            {scorer.score}
          </span>
        </div>
      ))}
    </div>
  );
}