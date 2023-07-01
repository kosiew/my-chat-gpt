import React, { useState } from "react";

interface Props {
  handleFileSubmission: (
    content: string,
    filename: string,
    parts: number
  ) => void;
}

export const FileUploader: React.FC<Props> = ({ handleFileSubmission }) => {
  // Define the type for selectedFile
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const changeHandler = (event: any) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmission = () => {
    if (!selectedFile) return;

    const reader: any = new FileReader();
    reader.readAsText(selectedFile);
    reader.onload = async () => {
      const content = reader.result;
      // You now have TypeScript's type safety when calling properties on selectedFile
      const filename = selectedFile.name;
      const parts = content.match(/[\s\S]{1,15000}/g) || [];
      handleFileSubmission(content, filename, parts.length);
    };
  };

  return (
    <div>
      <input type="file" name="file" onChange={changeHandler} />
      <button
        className="ml-2 rounded bg-green-500 p-2 text-white"
        onClick={handleSubmission}
      >
        Upload File
      </button>
    </div>
  );
};
