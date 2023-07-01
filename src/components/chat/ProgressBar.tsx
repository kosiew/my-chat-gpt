import React from "react";

interface ProgressBarProps {
  progress: number;
  baseColor?: string;
  progressColor?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  baseColor = "blue",
  progressColor = "green",
  id = "progressBar",
}) => {
  const progressStyle = `w-${Math.round(
    progress
  )} h-full transition-all duration-500 ease-in-out ${progressColor}`;

  return (
    <div
      id={id}
      className={`h-2 w-full bg-${baseColor} overflow-hidden rounded`}
    >
      <div className={progressStyle}></div>
    </div>
  );
};
