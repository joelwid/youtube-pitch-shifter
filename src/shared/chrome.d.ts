declare namespace chrome {
  namespace runtime {
    interface MessageSender {
      tab?: tabs.Tab;
      id?: string;
      url?: string;
    }

    interface LastError {
      message: string;
    }

    interface ExtensionContext {
      contextType: string;
      documentUrl?: string;
    }

    const lastError: LastError | undefined;

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => void | boolean
      ): void;
    };

    function getURL(path: string): string;

    function getContexts(filter: {
      contextTypes: string[];
      documentUrls?: string[];
    }): Promise<ExtensionContext[]>;

    function sendMessage<TResponse = unknown>(
      message: unknown,
      callback?: (response: TResponse) => void
    ): void;
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
    }

    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>;
  }

  namespace tabCapture {
    function getMediaStreamId(
      options: { targetTabId: number },
      callback: (streamId?: string) => void
    ): void;
  }

  namespace offscreen {
    function createDocument(options: {
      url: string;
      reasons: string[];
      justification: string;
    }): Promise<void>;
  }
}
