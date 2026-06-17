declare namespace chrome {
  namespace runtime {
    interface MessageSender {
      tab?: unknown;
      id?: string;
      url?: string;
    }

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => void | boolean
      ): void;
    };

    function sendMessage<TResponse = unknown>(
      message: unknown,
      callback?: (response: TResponse) => void
    ): void;
  }
}
