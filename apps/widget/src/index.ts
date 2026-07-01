import { h, render } from 'preact';
import { ChatWindow } from './components/ChatWindow.js';
import themeStyles from './styles/themes.css?inline';
import widgetStyles from './styles/widget.css?inline';

interface ChatWidgetOptions {
  agentId: string;
  baseUrl: string;
  title?: string;
  welcomeMessage?: string;
  quickReplies?: string[];
}

let initialized = false;

function init(options: ChatWidgetOptions) {
  if (initialized) return;
  initialized = true;

  const container = document.createElement('div');
  container.id = 'chat-sdk-widget-root';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  const styleTag = document.createElement('style');
  styleTag.textContent = `${themeStyles}\n${widgetStyles}`;
  shadowRoot.appendChild(styleTag);

  const mountPoint = document.createElement('div');
  shadowRoot.appendChild(mountPoint);

  render(
    h(ChatWindow, {
      agentId: options.agentId,
      baseUrl: options.baseUrl,
      title: options.title,
      welcomeMessage: options.welcomeMessage,
      quickReplies: options.quickReplies,
    }),
    mountPoint
  );
}

interface ChatSDKGlobal {
  q?: any[][];
  init?: (options: any) => void;
  (command: string, ...args: any[]): void;
}

declare global {
  interface Window {
    ChatSDK?: ChatSDKGlobal;
  }
}

function processQueue() {
  const current = window.ChatSDK;
  const queue = current?.q || [];

  window.ChatSDK = {
    init,
  } as unknown as ChatSDKGlobal;

  for (const item of queue) {
    const cmd = item[0];
    const args = item.slice(1);
    if (cmd === 'init') {
      init(args[0]);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processQueue);
} else {
  processQueue();
}
