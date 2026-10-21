// Shared drawing attributes — every icon inherits its color from the parent.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function HomeIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M3 10.75 12 3.5l9 7.25" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function ChartIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 20h16" />
      <path d="M7 20v-6" />
      <path d="M12 20V8" />
      <path d="M17 20v-9" />
    </svg>
  );
}

export function WalletIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" />
    </svg>
  );
}

export function UserIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </svg>
  );
}

export function PlusIcon({ className }) {
  // A touch bolder than the line icons since it sits on the accent FAB.
  return (
    <svg className={className} {...base} strokeWidth={2.2}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}

export function BellIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 5.5 2 6H4c.5-.5 2-1.5 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronDownIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function TransferIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5" />
      <path d="M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5" />
    </svg>
  );
}

export function TargetIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

export function RepeatIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 12a8 8 0 0 1 13.3-6M20 12a8 8 0 0 1-13.3 6" />
      <path d="M17 2v4h-4M7 22v-4h4" />
    </svg>
  );
}

export function CarIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M3 13l1.6-4.8A2 2 0 0 1 6.5 6.8h11a2 2 0 0 1 1.9 1.4L21 13v4H3z" />
      <path d="M3 17v1.5M21 17v1.5" />
      <circle cx="7.5" cy="13.5" r="1.1" />
      <circle cx="16.5" cy="13.5" r="1.1" />
    </svg>
  );
}

export function CalendarIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function ListIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function DownloadIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function TagIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M11 3H5a2 2 0 0 0-2 2v6l9 9 8-8-9-9z" />
      <circle cx="8" cy="8" r="1.2" />
    </svg>
  );
}

export function CartIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
      <path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L21 8H6" />
    </svg>
  );
}

export function HeartIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M12 20s-7-4.3-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.7 12 20 12 20z" />
    </svg>
  );
}

export function ZapIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M13 3 5 13h5l-1 8 8-10h-5z" />
    </svg>
  );
}

export function WifiIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16a5 5 0 0 1 7 0" />
      <path d="M12 19h.01" />
    </svg>
  );
}

export function SearchIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function MoreIcon({ className }) {
  return (
    <svg className={className} {...base} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export function CloseIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function FilterIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
export function PencilIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 20h4l10-10a2 2 0 0 0-3-3L5 17z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </svg>
  );
}

export function TrashIcon({ className }) {
  return (
    <svg className={className} {...base}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
