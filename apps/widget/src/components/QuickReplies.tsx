import { h } from 'preact';

interface QuickRepliesProps {
  replies: string[];
  onReplyClick: (reply: string) => void;
}

export function QuickReplies({ replies, onReplyClick }: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div class="chat-quick-replies">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          class="chat-reply-chip"
          onClick={() => onReplyClick(reply)}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
