import {
  clearChats,
  createChat,
  deleteChat,
  editSummary,
  switchChat,
} from "@src/features/chat";
import { useAppDispatch, useAppSelector } from "@src/lib/hooks/redux";
import { differenceInDays } from "date-fns";

import classNames from "classnames";
import { IconButton } from "./IconButton";
import { FiCheck, FiEdit, FiTrash } from "react-icons/fi";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localConfirm } from "@src/lib/util";
import { parseChatIdToDate } from "@src/utils/date";
import { setOpen } from "@src/features/sideMenu";

const SUMMARY_TYPING_SPEED = 50;
const OLD_DAYS_THRESHOLD = 30;
interface ChatSummaryTextProps {
  summary: string;
}

const ChatSummaryText = memo(({ summary }: ChatSummaryTextProps) => {
  const [displaySummary, setDisplaySummary] = useState(summary);
  const prevSummary = useRef(summary);
  // Type the new summary into the text
  useEffect(() => {
    let interval: NodeJS.Timer | null = null;
    if (prevSummary.current === summary) {
      return;
    }
    prevSummary.current = summary;
    setDisplaySummary("");
    const typeText = () => {
      setDisplaySummary((prev) => {
        if (prev.length === summary.length) {
          interval && clearInterval(interval);
          return prev;
        }
        return summary.slice(0, prev.length + 1);
      });
    };

    interval = setInterval(typeText, SUMMARY_TYPING_SPEED);

    return () => {
      interval && clearInterval(interval);
    };
  }, [summary]);

  return (
    <p className="block h-[24px] w-full max-w-[80%] overflow-hidden overflow-ellipsis">
      <span className="block h-full">{displaySummary}</span>
    </p>
  );
});
ChatSummaryText.displayName = "ChatSummaryText";

interface ChatSelectionButtonProps {
  id: string;
  active: boolean;
  summary: string;
  onClick?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, summary: string) => void;
}

export function ChatSelectionButton({
  active,
  summary,
  id,
  onClick,
  onDelete,
  onEdit,
}: ChatSelectionButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const classes = classNames(
    {
      "bg-mirage-700": active,
      "transition-colors focus-within:bg-mirage-600 hover:bg-mirage-600 active:bg-mirage-700":
        !active,
    },
    " p-2 rounded-lg my-1 transition-colors relative"
  );

  const handleClick = () => {
    onClick && onClick(id);
  };

  const handleDelete = () => {
    onDelete && onDelete(id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = useCallback(() => {
    setIsEditing(false);
    onEdit && onEdit(id, editedSummary);
  }, [editedSummary, id, onEdit]);

  useEffect(() => {
    setEditedSummary(summary);
  }, [summary]);
  // When the user clicks the edit button, focus the input
  // And when the user presses enter, save the summary
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();

      inputRef.current?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleSave();
        }
      });
    }
  }, [handleSave, isEditing]);

  const chatSummaryText = useMemo(() => {
    return <ChatSummaryText summary={summary} />;
  }, [summary]);

  return (
    <div className={classes}>
      {active ? (
        isEditing ? (
          <input
            ref={inputRef}
            className="block w-full rounded-md bg-mirage-700"
            value={editedSummary}
            onChange={(e) => {
              setEditedSummary(e.target.value);
            }}
          />
        ) : (
          chatSummaryText
        )
      ) : (
        <button className="block w-full text-left" onClick={handleClick}>
          {chatSummaryText}
        </button>
      )}
      {active && (
        <div className="absolute right-0 top-0 flex h-full flex-row justify-center">
          {!isEditing && (
            <IconButton onClick={handleDelete} aria-label="Deleete Chat">
              <FiTrash />
            </IconButton>
          )}
          <IconButton
            onClick={isEditing ? handleSave : handleEdit}
            aria-label="Edit Chat Description"
          >
            {isEditing ? <FiCheck /> : <FiEdit />}
          </IconButton>
        </div>
      )}
    </div>
  );
}

export function ChatSelection() {
  const chats = useAppSelector((state) => state.chats.chats);
  const preamble = useAppSelector((state) => state.settings.preamble);
  const activeChatId = useAppSelector((state) => state.chats.activeId);

  const dispatch = useAppDispatch();

  const handleCreateChat = () => {
    dispatch(createChat({ preamble }));
    dispatch(setOpen(false));
  };
  const handleSwitchChat = (id: string) => {
    dispatch(switchChat({ id }));
  };

  const handleEditChat = (id: string, summary: string) => {
    dispatch(editSummary({ id, summary }));
  };

  const handleDeleteChat = (id: string) => {
    dispatch(deleteChat({ id }));
  };
  const handleClearChats = async () => {
    (await localConfirm("Are you sure you want to delete all chats?")) &&
      dispatch(clearChats());
  };

  const checkAndAlertOldChats = useCallback(() => {
    const currentDate = new Date();
    const oldChats = Object.entries(chats).filter(([id]) => {
      const chatDate = parseChatIdToDate(id);
      const daysDifference = differenceInDays(currentDate, chatDate);
      return daysDifference > OLD_DAYS_THRESHOLD;
    });

    if (oldChats.length) {
      const command = `files=$(find /Users/kosiew/Library/Application\\ Support/my-chat-gpt/chats -type f -mtime +${OLD_DAYS_THRESHOLD} -print); if [[ -n $files ]]; then echo \"$files\" | xargs rm -v; else echo \"No files older than ${OLD_DAYS_THRESHOLD} days found.\"; fi`;
      navigator.clipboard.writeText(command);

      alert(
        `There are ${oldChats.length} chats older than ${OLD_DAYS_THRESHOLD} days. The command to delete these files has been copied to your clipboard.`
      );
    }
  }, [chats]);

  useEffect(() => {
    checkAndAlertOldChats();
  }, [chats]);

  const sortedChats = Object.entries(chats).sort(
    ([idA], [idB]) => Number(idB) - Number(idA)
  );

  return (
    <div className="sticky top-0 flex flex-col">
      <div className="border-b-2 border-mirage-700">
        <ChatSelectionButton
          summary={"Create new chat"}
          active={false}
          id={"new"}
          onClick={handleCreateChat}
        />
        <ChatSelectionButton
          summary={"Delete all Chats"}
          active={false}
          id={"delete"}
          onClick={handleClearChats}
        />
      </div>
      <div className="border-b-2 border-mirage-700">
        {sortedChats.map(([id, chat]) => {
          return (
            <ChatSelectionButton
              summary={chat.summary}
              active={id === activeChatId}
              id={id}
              onClick={handleSwitchChat}
              onDelete={handleDeleteChat}
              onEdit={handleEditChat}
              key={id}
            />
          );
        })}
      </div>
    </div>
  );
}
