import { useAppDispatch, useAppSelector } from "@src/lib/hooks/redux";
import { v4 as uuidV4 } from "uuid";

import { ChatCompletionResponseMessageRoleEnum } from "openai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInput, ChatInputProps } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import {
  updateDraft,
  deleteMessage,
  editMessage,
  abortCompletion,
  setImportant,
} from "@src/features/chat";
import { pushHistory, streamCompletion } from "@src/features/chat/thunks";
import { Chat } from "@src/features/chat/types";
import { Button } from "../Button";
import {
  Note,
  onCompletionTune,
  onSubmitTune,
  playTune as _playTune,
} from "@src/utils/audio";

export type ChatViewProps = {
  chat: Chat;
};

export function ChatView({ chat }: ChatViewProps) {
  const dispatch = useAppDispatch();
  const muteSound = useAppSelector((state) => state.settings.muteSound);

  const playTune = useCallback(
    (tune: Note[]) => {
      if (muteSound) return;
      _playTune(tune);
    },
    [muteSound]
  );

  const [waitingForCompletion, setWaitingForCompletion] = useState(false);

  const [sendAsRole, setSendAsRole] =
    useState<ChatCompletionResponseMessageRoleEnum>("user");

  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottomRef = useRef(true);

  const botTyping = useAppSelector(
    (state) => state.chats.chats[chat.id].botTyping
  );
  const botTypingMessage = useAppSelector(
    (state) => state.chats.chats[chat.id].botTypingMessage
  );
  const showPreamble = useAppSelector((state) => state.settings.showPreamble);

  const isHistoryEmpty =
    Object.values(chat.history).filter((message) => !message.isPreamble)
      .length === 0;

  const isLastMessageBot = useMemo(() => {
    const lastMessage = Object.values(chat.history).pop();
    if (!lastMessage) return false;
    return lastMessage.role === "assistant";
  }, [chat.history]);

  const handleChatInput = useCallback<NonNullable<ChatInputProps["onChange"]>>(
    ({ draft, role }) => {
      if (!chat) return;
      dispatch(updateDraft({ id: chat.id, draft: draft }));

      setSendAsRole(role);
    },
    [chat, dispatch]
  );
  const [fileContent, setFileContent] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Function to read and slice the file content in chunks
  const processFileContent = useCallback(
    async (file) => {
      const fileSize = file.size;
      const chunkSize = 2048; // Chunks of 2kb
      let offset = 0;

      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();

        const readPromise = new Promise((resolve) => {
          reader.onload = (event) => {
            const textChunk = event.target.result;
            setFileContent((prevFileContent) => prevFileContent + textChunk);
            resolve();
          };
        });

        // Read the chunk as text
        reader.readAsText(chunk);

        // Wait for reader to finish
        await readPromise;

        offset += chunkSize;
      }
    },
    [setFileContent]
  );

  // Event handler to handle file input change
  const onFileInputChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await processFileContent(file);
  };

  // Modify handleChatSubmit function to handle file uploads
  const handleChatSubmit = useCallback<NonNullable<ChatInputProps["onSubmit"]>>(
    async ({ draft, role }) => {
      if (!chat) return;
      if (fileContent) {
        const promptMessage = "Uploading file in chunks. Please wait...";

        // Send the prompt first before uploading file chunks
        const promptMessageId = uuidV4();
        dispatch(
          pushHistory({
            content: promptMessage,
            role: "user",
            messageId: promptMessageId,
          })
        );

        const chunks = fileContent.match(/[\s\S]{1,2048}/g) || [];
        for (const chunk of chunks) {
          const messageId = uuidV4();
          dispatch(pushHistory({ content: chunk, role: role, messageId }));
          setUploadProgress((prev) => prev + chunk.length);
          await new Promise((resolve) => setTimeout(resolve, 300)); // Sending interval of 300ms
        }

        // Clear the file input, file content, and upload progress states
        setFileContent("");
        setUploadProgress(0);
      } else {
        navigator.clipboard.writeText(draft);
        dispatch(pushHistory({ content: draft, role: role }));
        dispatch(updateDraft({ id: chat.id, draft: "" }));
        playTune(onSubmitTune);
        setWaitingForCompletion(true);
      }
    },
    [chat, dispatch, fileContent, playTune]
  );

  const handleChatAbort = useCallback(() => {
    if (!chat) return;

    dispatch(abortCompletion({ id: chat.id }));
  }, [chat, dispatch]);

  const handleGenerateResponse = useCallback(() => {
    if (!chat) return;

    const done = () => {
      dispatch(streamCompletion(chat.id));
    };

    if (isLastMessageBot) {
      // Remove the last message by the bot and generate a new one
      const lastMessage = Object.values(chat.history).pop();
      if (lastMessage) {
        dispatch(deleteMessage({ chatId: chat.id, messageId: lastMessage.id }));
      }
      done();
      return;
    }

    done();
  }, [chat, dispatch, isLastMessageBot]);

  const scrollToBottom = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.scrollTop = scrollElement.scrollHeight;
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    const handleScroll = () => {
      const bottomThreshold = 10;
      isScrolledToBottomRef.current =
        scrollElement.scrollHeight -
          scrollElement.scrollTop -
          bottomThreshold <=
        scrollElement.clientHeight;
    };

    scrollElement.addEventListener("scroll", handleScroll);

    return () => scrollElement.removeEventListener("scroll", handleScroll);
  });
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    if (isScrolledToBottomRef.current) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  });

  const shouldRenderTmpMessage =
    botTyping && botTypingMessage?.role && botTypingMessage?.content;

  const historyMessages = useMemo(() => {
    if (!chat.id) return;

    const handleDelete = (id: string) => {
      dispatch(deleteMessage({ chatId: chat.id, messageId: id }));
    };
    const handleEdit = (content: string, id: string) => {
      dispatch(editMessage({ content, chatId: chat.id, messageId: id }));
    };
    return Object.values(chat.history).map((message, i) => {
      if (message.isPreamble && !showPreamble) {
        return null;
      }
      return (
        <ChatMessage
          isImportant={message.isImportant}
          onToggleImportant={() => {
            dispatch(
              setImportant({
                chatId: chat.id,
                messageId: message.id,
                important: !message.isImportant,
              })
            );
          }}
          onDelete={() => {
            handleDelete(message.id);
          }}
          onEdit={(content) => {
            handleEdit(content, message.id);
          }}
          key={i}
          content={message.content}
          role={message.role}
        />
      );
    });
  }, [chat.history, chat.id, dispatch, showPreamble]);

  const completedResponse =
    waitingForCompletion && !botTyping && !isHistoryEmpty && isLastMessageBot;

  useEffect(() => {
    if (completedResponse) {
      playTune(onCompletionTune);
      setWaitingForCompletion(false);
    }
  }, [completedResponse]);

  // Scroll to the bottom whenever historyMessages changes
  useEffect(() => {
    scrollToBottom();
  }, [historyMessages]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-scroll" ref={scrollRef}>
        <div className="mx-auto max-w-screen-md px-4 py-5">
          <div id="chat">
            {historyMessages}
            {shouldRenderTmpMessage && (
              <ChatMessage
                content={botTypingMessage.content!}
                role={botTypingMessage.role!}
              />
            )}
          </div>
          {shouldRenderTmpMessage && (
            <div className="flex justify-center">
              <Button onClick={handleChatAbort}>Stop Generation</Button>
            </div>
          )}
          {!botTyping && !isHistoryEmpty && (
            <div className="flex justify-center">
              <Button onClick={handleGenerateResponse}>
                {isLastMessageBot ? "Regenerate Response" : "Generate Response"}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 mt-auto w-full bg-mirage-800 ">
        <div className="flex">
          <input
            type="file"
            className="bg-gray-200 p-1"
            accept=".txt"
            onChange={onFileInputChange}
          />
          {uploadProgress > 0 && (
            <div className="ml-2">
              Uploaded:{" "}
              {Math.round((uploadProgress / fileContent.length) * 100)}%
            </div>
          )}
        </div>
        <ChatInput
          draft={chat.draft}
          disabled={botTyping}
          sendAsRole={sendAsRole}
          onChange={handleChatInput}
          onSubmit={handleChatSubmit}
        />
      </div>
    </div>
  );
}
