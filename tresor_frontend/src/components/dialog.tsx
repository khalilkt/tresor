import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

export function MDialog({
  children,
  isOpen,
  title,
  onClose,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 flex items-center justify-center bg-gray opacity-70" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-20 flex h-min w-screen -translate-x-1/2 -translate-y-1/2 lg:h-max lg:max-h-[90%] lg:w-max lg:rounded-2xl"
          forceMount
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="h-min w-full flex-col overflow-y-auto rounded-xl bg-white px-6 py-8 shadow-lg lg:h-auto lg:w-auto"
              >
                <h2 className="pb-8 text-xl font-semibold">{title}</h2>
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className={"overflow-scroll " + isOpen ? "" : "hidden"}>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-20 flex items-center justify-center bg-gray opacity-70`}
      ></div>
      <div className="fixed left-1/2 top-1/2 z-20 h-screen w-screen -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-6 py-8 shadow-lg lg:h-max lg:w-max">
        <h2 className="pb-8 text-xl font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
