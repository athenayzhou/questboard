import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { ConfirmOptions, ConfirmResult } from "../types/ui";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

type ConfirmDialogueState = {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: (result: ConfirmResult) => void;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<ConfirmResult>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if(!context){
    throw new Error('useConfirm must be used within a Confirm Provider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }){
  const [dialog, setDialog] = useState<ConfirmDialogueState | null>(null);

  const confirm = (options: ConfirmOptions): Promise<ConfirmResult> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if(dialog){
      dialog.resolve(true);
      setDialog(null);
    }
  };

  const handleCancel = () => {
    if(dialog){
      dialog.resolve(false);
      setDialog(null);
    }
  };

  const contextValue: ConfirmContextType = {
    confirm,
  };

  return (
    <ConfirmContext.Provider value = {contextValue}>
      {children}
      {dialog && (
        <ConfirmDialog
          isOpen={dialog.isOpen}
          options={dialog.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  )

}