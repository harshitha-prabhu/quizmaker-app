import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/app/actions/helpers";
import { redirect } from "next/navigation";

// Mark as dynamic since we use cookies for authentication check
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Welcome to QuizMaker
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Create, manage, and take quizzes with ease. Perfect for educators and learners.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Quizzes</CardTitle>
              <CardDescription>
                Build comprehensive MCQ quizzes with multiple questions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Take Quizzes</CardTitle>
              <CardDescription>
                Test your knowledge with available quizzes
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor your performance and improvement over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
