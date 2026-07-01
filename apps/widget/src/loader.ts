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

(function(w: Window) {
  w.ChatSDK = w.ChatSDK || {
    q: [],
  } as unknown as ChatSDKGlobal;

  const sdk = function(cmd: string, ...args: any[]) {
    if (w.ChatSDK && w.ChatSDK.q) {
      w.ChatSDK.q.push([cmd, ...args]);
    }
  } as unknown as ChatSDKGlobal;

  sdk.q = w.ChatSDK.q || [];
  w.ChatSDK = sdk;

  const script = document.createElement('script');
  script.src = (document.currentScript as HTMLScriptElement)?.src.replace('loader.js', 'widget.js') || 'widget.js';
  script.async = true;
  document.head.appendChild(script);
})(window);

export {};
