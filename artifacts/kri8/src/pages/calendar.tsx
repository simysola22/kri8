import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetCalendarIdeas, getGetCalendarIdeasQueryKey } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Lightbulb, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Idea = {
  id: number;
  title: string;
  createdDate?: string | null;
  usedDate?: string | null;
  customDate?: string | null;
  isUsed?: boolean;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const { data: ideas = [], isLoading } = useGetCalendarIdeas(
    { month: monthStr },
    { query: { queryKey: getGetCalendarIdeasQueryKey({ month: monthStr }) } }
  );

  const goToPrevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function ideasForDay(day: number): Idea[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return (ideas as Idea[]).filter(idea =>
      idea.createdDate === dateStr || idea.usedDate === dateStr || idea.customDate === dateStr
    );
  }

  function getDayType(idea: Idea, day: number): "created" | "scheduled" | "used" {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (idea.usedDate === dateStr) return "used";
    if (idea.customDate === dateStr) return "scheduled";
    return "created";
  }

  const selectedIdeas = selectedDay !== null ? ideasForDay(selectedDay) : [];
  const today = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const totalOnCalendar = new Set(
    (ideas as Idea[]).flatMap(i => [i.createdDate, i.usedDate, i.customDate].filter(Boolean))
  ).size;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-1">See your ideas mapped to time.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Created</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Published</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <Card className="lg:col-span-2 bg-card border-white/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={goToPrevMonth} className="rounded-full hover:bg-white/10">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-xl font-bold">{MONTH_NAMES[month]} {year}</CardTitle>
                <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-full hover:bg-white/10">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayIdeas = ideasForDay(day);
                  const hasIdeas = dayIdeas.length > 0;
                  const isToday = isCurrentMonth && day === today;
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-start p-1 text-xs transition-all relative",
                        "hover:bg-white/10 cursor-pointer",
                        isToday && "ring-1 ring-primary",
                        isSelected && "bg-white/15",
                        hasIdeas && "bg-white/5"
                      )}
                    >
                      <span className={cn(
                        "font-medium text-sm leading-none mb-1 mt-0.5",
                        isToday && "text-primary font-bold"
                      )}>{day}</span>
                      {hasIdeas && (
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {dayIdeas.slice(0, 3).map((idea) => {
                            const type = getDayType(idea, day);
                            return (
                              <span
                                key={`${idea.id}-${type}`}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  type === "created" && "bg-blue-400",
                                  type === "scheduled" && "bg-primary",
                                  type === "used" && "bg-emerald-500"
                                )}
                              />
                            );
                          })}
                          {dayIdeas.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{dayIdeas.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isLoading && (
                <div className="text-center text-muted-foreground py-4 text-sm">Loading ideas…</div>
              )}
            </CardContent>
          </Card>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Month summary */}
            <Card className="bg-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Month Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ideas this month</span>
                  <Badge variant="outline" className="border-white/20">{(ideas as Idea[]).length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days with ideas</span>
                  <Badge variant="outline" className="border-white/20">{totalOnCalendar}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Published</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    {(ideas as Idea[]).filter(i => i.isUsed).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Day detail */}
            {selectedDay !== null && (
              <Card className="bg-card border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {MONTH_NAMES[month]} {selectedDay}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedIdeas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No ideas on this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIdeas.map(idea => {
                        const type = getDayType(idea, selectedDay);
                        return (
                          <Link key={idea.id} href={`/ideas/${idea.id}`}>
                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                              {type === "used" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                              ) : (
                                <Lightbulb className={cn(
                                  "h-4 w-4 mt-0.5 shrink-0",
                                  type === "scheduled" ? "text-primary" : "text-blue-400"
                                )} />
                              )}
                              <div>
                                <p className="text-sm font-medium group-hover:text-primary transition-colors">{idea.title}</p>
                                <p className="text-xs text-muted-foreground capitalize">{type}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedDay === null && (
              <Card className="bg-card border-white/10 border-dashed">
                <CardContent className="py-8 text-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Click a day to see its ideas</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
