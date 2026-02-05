import { useEffect, useRef } from "react";

export interface CommandLogEntry {
  id: number;
  timestamp: number;
  command: string;
  status: "success" | "error";
  errorMessage?: string;
}

interface CommandLogProps {
  entries: CommandLogEntry[];
}

export function CommandLog({ entries }: CommandLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="command-log">
      <div className="command-log-entries">
        {entries.slice(-20).map((entry) => (
          <div key={entry.id} className={`command-log-entry ${entry.status}`}>
            <span className="entry-command">{entry.command}</span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
