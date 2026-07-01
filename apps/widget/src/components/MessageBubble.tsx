import { h } from 'preact';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'operator';
  content: string;
  senderType: 'user' | 'bot' | 'human';
  createdAt?: string | Date;
}

function parseMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return html.split('\n').map(line => `<p>${line}</p>`).join('');
}

export function MessageBubble({ role, content, senderType, createdAt }: MessageBubbleProps) {
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const htmlContent = parseMarkdown(content);

  const displayRole = senderType === 'human' ? 'Operador' : senderType === 'bot' ? 'Assistente' : 'Tu';

  return (
    <div class={`chat-message-row ${role === 'user' ? 'user' : 'assistant'}`}>
      <div class="chat-bubble">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        <div class="chat-bubble-meta">
          {displayRole} &bull; {formattedTime}
        </div>
      </div>
    </div>
  );
}
