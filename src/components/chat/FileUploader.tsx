import { createToast } from "@src/features/toasts/thunks";
import { useAppDispatch } from "@src/lib/hooks/redux";
import React, { useRef } from "react";

interface Props {
  handleFileSubmission: (
    content: string,
    filename: string,
    parts: number
  ) => void;
  acceptedExtensions?: string[];
}

export const FileUploader: React.FC<Props> = ({
  handleFileSubmission,
  acceptedExtensions = [".txt", ".csv"],
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const toastDuration = 2000;
  const accept = acceptedExtensions.join(",");
  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log(
      "%c==> [changeHandler]",
      "background-color: #0595DE; color: yellow; padding: 8px; border-radius: 4px;",
      { file }
    );
    if (file) {
      const fileExtension = file.name.split(".").pop();
      if (acceptedExtensions.includes("." + fileExtension)) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async () => {
          const content = reader.result as string;
          const filename = file.name;
          const parts = content.match(/[\s\S]{1,15000}/g) || [];
          handleFileSubmission(content, filename, parts.length);
        };
      } else {
        dispatch(
          createToast({
            message: "Invalid file extension!",
            duration: toastDuration,
            type: "error",
          })
        );
      }
    }
  };
  const handleSubmission = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Trigger the click event on the hidden file input element
    inputFileRef?.current?.click();
  };
  return (
    <div>
      <input
        type="file"
        accept={accept}
        ref={inputFileRef}
        style={{ display: "none" }}
        onChange={changeHandler}
      />
      <button
        className="ml-2 w-32 rounded bg-green-500 p-2 text-sm text-white"
        onClick={handleSubmission}
      >
        Upload File
      </button>
    </div>
  );
};
