/**
 * Delete Quiz Button Component
 * 
 * Client component that handles quiz deletion with confirmation dialog.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteQuiz } from '@/app/actions/quizzes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteQuizButtonProps {
  quizId: string;
  quizTitle: string;
}

export function DeleteQuizButton({ quizId, quizTitle }: DeleteQuizButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuiz(quizId);
      
      if (result.success) {
        toast.success('Quiz deleted successfully');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      toast.error('An error occurred while deleting the quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          aria-label={`Delete quiz: ${quizTitle}`}
          title={`Delete quiz: ${quizTitle}`}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Quiz</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{quizTitle}&quot;? This action cannot be undone.
            All questions and related data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

