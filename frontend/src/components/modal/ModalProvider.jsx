import {
  useState,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

const ModalContext = createContext(null);

function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalProps, setModalProps] = useState({});

  const openModal = useCallback((modalName, props = {}) => {
    setActiveModal(modalName);
    setModalProps(props);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalProps({});
  }, []);

  const value = useMemo(
    () => ({
      activeModal,
      modalProps,
      openModal,
      closeModal,
    }),
    [activeModal, modalProps, openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}

export default ModalProvider;
