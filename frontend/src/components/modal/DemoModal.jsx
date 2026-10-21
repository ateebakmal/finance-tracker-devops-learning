export default function DemoModal({ message, onClose }) {
  return (
    <div className="space-y-4">
      <p className="text-muted text-sm">
        {message ??
          "The modal system works. This sheet slid up from the bottom."}
      </p>
      <button
        onClick={onClose}
        className="bg-accent w-full rounded-2xl py-4 font-sans font-bold text-white"
      >
        Got it
      </button>
    </div>
  );
}
