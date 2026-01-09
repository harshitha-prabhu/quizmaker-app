/**
 * Welcome Section Component
 * 
 * Displays a personalized welcome message for the user.
 */

interface WelcomeSectionProps {
  firstName: string;
  lastName: string;
}

export function WelcomeSection({ firstName }: WelcomeSectionProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">
        {greeting}, {firstName}!
      </h1>
      <p className="text-muted-foreground">
        Welcome to your QuizMaker dashboard. Ready to create or take some quizzes?
      </p>
    </div>
  );
}

