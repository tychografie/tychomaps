import { FormEvent, memo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog"
import { Button } from "./Button"

interface FeedbackDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSubmit: (rating?: "-1" | "1", text?: string) => void
}

export const FeedbackDialog = memo<FeedbackDialogProps>(
  ({ onSubmit, setOpen, ...props }) => {
    const handleSubmit = useCallback(
      (e: FormEvent) => {
        e.preventDefault()
        const text = (e.target as HTMLFormElement).feedback.value
        onSubmit(text)
        setOpen(false)
      },
      [onSubmit, setOpen],
    )
    return (
      <Dialog open={props.open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              name="feedback"
              placeholder="Enter your feedback here"
              className="w-full h-32 p-2 mt-2 border rounded resize-none"
            />
            <Button>Submit</Button>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)

FeedbackDialog.displayName = "FeedbackDialog"
