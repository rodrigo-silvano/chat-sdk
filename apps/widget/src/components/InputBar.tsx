import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSendMessage, disabled }: InputBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!value.trim() || disabled) {
      return;
    }
    onSendMessage(value.trim());
    setValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="chat-input-bar">
      <input
        ref={inputRef}
        type="text"
        class="chat-input"
        placeholder="Escreva uma mensagem..."
        value={value}
        onInput={(e: any) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        class="chat-send-btn"
        disabled={disabled || !value.trim()}
      >
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}
