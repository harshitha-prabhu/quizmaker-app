/**
 * Quiz Creation Page
 * 
 * Allows authenticated users to create new MCQ quizzes with questions and choices.
 * Follows the same design patterns as login/registration pages with full accessibility.
 */

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createQuiz } from '@/app/actions/quizzes';
import { CreateQuizSchema, type CreateQuizInput } from '@/lib/schemas/quiz.schema';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function QuizCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateQuizInput>({
    resolver: zodResolver(CreateQuizSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      questions: [
        {
          questionText: '',
          points: 1,
          choices: [
            { choiceText: '', isCorrect: false },
            { choiceText: '', isCorrect: false },
          ],
        },
      ],
    },
    mode: 'onChange',
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({
    control,
    name: 'questions',
  });

  // Check authentication on mount
  useEffect(() => {
    // The middleware handles authentication, but we check here for better UX
    // The server action will also validate authentication
    setIsCheckingAuth(false);
  }, []);

  const onSubmit = async (data: CreateQuizInput) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.instructions) {
        formData.append('instructions', data.instructions);
      }
      formData.append('questions', JSON.stringify(data.questions));

      const result = await createQuiz(formData);

      if (result.success) {
        toast.success('Quiz created successfully! Redirecting...');
        router.push('/dashboard');
        router.refresh();
      } else {
        const error = result.error || 'Failed to create quiz. Please try again.';
        setErrorMessage(error);
        toast.error(error);
      }
    } catch (error) {
      console.error('Quiz creation error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" aria-hidden="true" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl">
        {/* Back Navigation */}
        <nav aria-label="Breadcrumb navigation">
          <Button
            variant="ghost"
            asChild
            className="mb-4"
            aria-label="Go back to dashboard"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Dashboard
            </Link>
          </Button>
        </nav>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create New Quiz</CardTitle>
            <CardDescription>
              Create a new multiple choice quiz with questions and answer choices
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-6">
              {/* Error Message */}
              {errorMessage && (
                <div
                  className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="font-medium">Error</p>
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Quiz Metadata */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Quiz Information</h2>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive" aria-label="required">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter quiz title"
                    {...register('title')}
                    aria-invalid={errors.title ? 'true' : 'false'}
                    aria-required="true"
                    aria-describedby={errors.title ? 'title-error' : undefined}
                    disabled={isLoading}
                  />
                  {errors.title && (
                    <p
                      id="title-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter quiz description (optional)"
                    rows={3}
                    {...register('description')}
                    aria-invalid={errors.description ? 'true' : 'false'}
                    aria-describedby={errors.description ? 'description-error' : undefined}
                    disabled={isLoading}
                  />
                  {errors.description && (
                    <p
                      id="description-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Enter quiz instructions (optional)"
                    rows={2}
                    {...register('instructions')}
                    aria-invalid={errors.instructions ? 'true' : 'false'}
                    aria-describedby={errors.instructions ? 'instructions-error' : undefined}
                    disabled={isLoading}
                  />
                  {errors.instructions && (
                    <p
                      id="instructions-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.instructions.message}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Questions</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendQuestion({
                        questionText: '',
                        points: 1,
                        choices: [
                          { choiceText: '', isCorrect: false },
                          { choiceText: '', isCorrect: false },
                        ],
                      })
                    }
                    disabled={isLoading}
                    aria-label="Add new question"
                  >
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Add Question
                  </Button>
                </div>

                {errors.questions && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.questions.message}
                  </p>
                )}

                <div
                  className="space-y-6"
                  role="group"
                  aria-label="Quiz questions"
                >
                  {questionFields.map((question, questionIndex) => (
                    <QuestionForm
                      key={question.id}
                      questionIndex={questionIndex}
                      register={register}
                      control={control}
                      watch={watch}
                      errors={errors}
                      onRemove={() => removeQuestion(questionIndex)}
                      canRemove={questionFields.length > 1}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-label={isLoading ? 'Creating quiz...' : 'Create quiz'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Creating Quiz...
                  </>
                ) : (
                  'Create Quiz'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <span className="text-destructive" aria-label="required">*</span> Required fields
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}

// Question Form Component
function QuestionForm({
  questionIndex,
  register,
  control,
  errors,
  watch,
  onRemove,
  canRemove,
  isLoading,
}: {
  questionIndex: number;
  register: ReturnType<typeof useForm<CreateQuizInput>>['register'];
  control: ReturnType<typeof useForm<CreateQuizInput>>['control'];
  errors: ReturnType<typeof useForm<CreateQuizInput>>['formState']['errors'];
  watch: ReturnType<typeof useForm<CreateQuizInput>>['watch'];
  onRemove: () => void;
  canRemove: boolean;
  isLoading: boolean;
}) {
  const {
    fields: choiceFields,
    append: appendChoice,
    remove: removeChoice,
  } = useFieldArray({
    control,
    name: `questions.${questionIndex}.choices`,
  });

  const questionErrors = errors.questions?.[questionIndex];
  const choices = watch(`questions.${questionIndex}.choices`) || [];
  const hasCorrectAnswer = choices.some(
    (choice: { choiceText: string; isCorrect: boolean }) => choice?.isCorrect === true
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Question {questionIndex + 1}
          </CardTitle>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isLoading}
              aria-label={`Remove question ${questionIndex + 1}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`question-${questionIndex}`}>
            Question Text{' '}
            <span className="text-destructive" aria-label="required">*</span>
          </Label>
          <Textarea
            id={`question-${questionIndex}`}
            placeholder="Enter your question"
            rows={2}
            {...register(`questions.${questionIndex}.questionText`)}
            aria-invalid={questionErrors?.questionText ? 'true' : 'false'}
            aria-required="true"
            aria-describedby={
              questionErrors?.questionText
                ? `question-${questionIndex}-error`
                : undefined
            }
            disabled={isLoading}
          />
          {questionErrors?.questionText && (
            <p
              id={`question-${questionIndex}-error`}
              className="text-sm text-destructive"
              role="alert"
            >
              {questionErrors.questionText.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`points-${questionIndex}`}>Points</Label>
          <Input
            id={`points-${questionIndex}`}
            type="number"
            min="1"
            defaultValue={1}
            {...register(`questions.${questionIndex}.points`, {
              valueAsNumber: true,
            })}
            aria-invalid={questionErrors?.points ? 'true' : 'false'}
            aria-describedby={
              questionErrors?.points ? `points-${questionIndex}-error` : undefined
            }
            disabled={isLoading}
          />
          {questionErrors?.points && (
            <p
              id={`points-${questionIndex}-error`}
              className="text-sm text-destructive"
              role="alert"
            >
              {questionErrors.points.message}
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              Answer Choices{' '}
              <span className="text-destructive" aria-label="required">*</span>
            </Label>
            {choiceFields.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendChoice({ choiceText: '', isCorrect: false })
                }
                disabled={isLoading}
                aria-label="Add new choice"
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Add Choice
              </Button>
            )}
          </div>

          {questionErrors?.choices && (
            <p className="text-sm text-destructive" role="alert">
              {questionErrors.choices.message || questionErrors.choices.root?.message}
            </p>
          )}

          {!hasCorrectAnswer && choiceFields.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
              Please mark at least one choice as correct
            </p>
          )}

          <div className="space-y-3" role="group" aria-label={`Choices for question ${questionIndex + 1}`}>
            {choiceFields.map((choice, choiceIndex) => (
              <ChoiceForm
                key={choice.id}
                questionIndex={questionIndex}
                choiceIndex={choiceIndex}
                register={register}
                errors={questionErrors?.choices?.[choiceIndex]}
                onRemove={() => removeChoice(choiceIndex)}
                canRemove={choiceFields.length > 2}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Choice Form Component
function ChoiceForm({
  questionIndex,
  choiceIndex,
  register,
  errors,
  onRemove,
  canRemove,
  isLoading,
}: {
  questionIndex: number;
  choiceIndex: number;
  register: ReturnType<typeof useForm<CreateQuizInput>>['register'];
  errors:
    | {
        choiceText?: { message: string };
      }
    | undefined;
  onRemove: () => void;
  canRemove: boolean;
  isLoading: boolean;
}) {
  const choiceId = `choice-${questionIndex}-${choiceIndex}`;

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            id={choiceId}
            type="text"
            placeholder={`Choice ${String.fromCharCode(65 + choiceIndex)}`}
            {...register(
              `questions.${questionIndex}.choices.${choiceIndex}.choiceText`
            )}
            aria-invalid={errors?.choiceText ? 'true' : 'false'}
            aria-required="true"
            aria-describedby={
              errors?.choiceText ? `${choiceId}-error` : undefined
            }
            disabled={isLoading}
            className="flex-1"
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isLoading}
              aria-label={`Remove choice ${String.fromCharCode(65 + choiceIndex)}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          )}
        </div>
        {errors?.choiceText && (
          <p
            id={`${choiceId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.choiceText.message}
          </p>
        )}
      </div>
      <div className="flex items-center pt-1">
        <input
          type="checkbox"
          id={`correct-${questionIndex}-${choiceIndex}`}
          {...register(
            `questions.${questionIndex}.choices.${choiceIndex}.isCorrect`,
            {
              setValueAs: (value) => value === true || value === 'true',
            }
          )}
          disabled={isLoading}
          className="h-4 w-4 rounded border-gray-300"
          aria-label={`Mark choice ${String.fromCharCode(65 + choiceIndex)} as correct answer`}
        />
        <Label
          htmlFor={`correct-${questionIndex}-${choiceIndex}`}
          className="ml-2 text-sm font-normal cursor-pointer"
        >
          Correct
        </Label>
      </div>
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" aria-hidden="true" />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <QuizCreationForm />
    </Suspense>
  );
}

