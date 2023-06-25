import { createToast } from "@src/features/toasts/thunks";
import { Toast } from "@src/features/toasts/types";
import { useCallback } from "react";
import { useAppDispatch } from "@src/lib/hooks/redux";

export const useToast = () => {
  const dispatch = useAppDispatch();

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      dispatch(
        createToast({
          message,
          duration: 2000,
          type,
        })
      );
    },
    [dispatch]
  );

  return {
    addToast,
  };
};
