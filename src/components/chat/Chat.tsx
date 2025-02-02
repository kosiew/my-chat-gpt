import { useAppDispatch, useAppSelector } from "@src/lib/hooks/redux";

import {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
} from "openai";
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
import { ProgressBar } from "@src/components/chat/ProgressBar";
import { FileUploader } from "@src/components/chat/FileUploader";

export type ChatViewProps = {
  chat: Chat;
};

export function ChatView({ chat }: ChatViewProps) {
  const [progress, setProgress] = useState(0);

  const dispatch = useAppDispatch();
  const muteSound = useAppSelector((state) => state.settings.muteSound);

  const playTune = useCallback(
    (tune: Note[]) => {
      if (muteSound) return;
      _playTune(tune);
    },
    [muteSound]
  );

  const sendChatMessage = (
    message: string,
    role: ChatCompletionRequestMessageRoleEnum
  ) => {
    console.log(
      `%c==> [sendChatMessage ${message}]`,
      "background-color: #0595DE; color: yellow; padding: 8px; border-radius: 4px;"
    );
    dispatch(pushHistory({ content: message, role }));
  };

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

  const handleFileSubmission = async (
    content: string,
    filename: string,
    partCount: number
  ) => {
    console.log(
      "%c==> [handleFileSubmission]",
      "background-color: #0595DE; color: yellow; padding: 8px; border-radius: 4px;"
    );

    const parts = content.match(/[\s\S]{1,15000}/g) || [];

    const fileUploadMessageRole = "user";
    // Send a preamble message before sending file contents
    sendChatMessage(
      "I will submit the contents of a file in chunks. Please ask for further instructions after I submit all the chunks",
      fileUploadMessageRole
    );

    for (let i = 0; i < parts.length; i++) {
      const part = i + 1;
      const message = `Part ${part} of ${filename}: \n\n ${parts[i]}`;
      sendChatMessage(message, fileUploadMessageRole);
      setProgress((part / partCount) * 100);
      console.log(
        `%c==> [sent part: ${part}/${parts.length} ]`,
        "background-color: #0595DE; color: yellow; padding: 8px; border-radius: 4px;"
      );
    }
    sendChatMessage(
      "I have uploaded all chunks of the file. First question is how many chunks have you received?",
      fileUploadMessageRole
    );
  };

  const handleChatSubmit = useCallback<NonNullable<ChatInputProps["onSubmit"]>>(
    async ({ draft, role }) => {
      if (!chat) return;
      dispatch(pushHistory({ content: draft, role: role }));
      dispatch(updateDraft({ id: chat.id, draft: "" }));
      playTune(onSubmitTune);
      setWaitingForCompletion(true);
    },
    [chat, dispatch]
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
      <div className="flex w-full flex-col items-center justify-center">
        <FileUploader handleFileSubmission={handleFileSubmission} />
        <ProgressBar progress={progress} />
        <div className="sticky bottom-0 mt-auto w-full bg-mirage-800 ">
          <ChatInput
            draft={chat.draft}
            disabled={botTyping}
            sendAsRole={sendAsRole}
            onChange={handleChatInput}
            onSubmit={handleChatSubmit}
          />
        </div>
      </div>
    </div>
  );
}
