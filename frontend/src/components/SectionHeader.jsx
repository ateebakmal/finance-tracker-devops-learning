import Button from "./Button";

export default function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-5">
      <h2 className="text-ink font-sans text-[15.5px] font-bold">{title}</h2>
      {action ? (
        <Button variant="soft" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}
