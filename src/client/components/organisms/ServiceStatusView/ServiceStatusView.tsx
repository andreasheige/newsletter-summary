import { useServiceStatus } from "../../../hooks/useServiceStatus";
import type { ServiceHealth } from "../../../../shared/types";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const healthDot: Record<ServiceHealth, string> = {
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  major: "bg-red-500",
  unknown: "bg-gray-500",
  "no-feed": "bg-gray-400",
};

const healthLabel: Record<ServiceHealth, string> = {
  operational: "Operational",
  degraded: "Degraded",
  major: "Major Outage",
  unknown: "Unknown",
  "no-feed": "No feed available",
};

export function ServiceStatusView() {
  const { data, loading } = useServiceStatus();

  if (loading && !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 text-center text-text-secondary">
        Loading service status...
      </div>
    );
  }

  const services = data?.services ?? [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-text-primary">
          Service Status
        </h2>
        <span className="text-xs text-text-secondary">
          Auto-refreshes every 60s
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.slug}
            className="rounded-lg bg-bg-secondary border border-border p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${healthDot[service.health]}`}
              />
              <span className="font-medium text-text-primary text-sm">
                {service.name}
              </span>
              {service.statusUrl && (
                <a
                  href={service.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[10px] text-text-secondary hover:text-text-link"
                  title="Open status page"
                >
                  ↗
                </a>
              )}
            </div>

            <p className="text-xs text-text-secondary mb-3">
              {healthLabel[service.health]}
              {service.health === "no-feed" && (
                <span className="ml-1 italic">
                  {service.statusUrl
                    ? "— check status page ↗"
                    : "— no public status page"}
                </span>
              )}
            </p>

            {service.incidents.length > 0 && (
              <div className="border-t border-border pt-2">
                <p className="text-xs font-medium text-text-secondary mb-1.5">
                  Recent Incidents
                </p>
                <ul className="flex flex-col gap-1.5">
                  {service.incidents.slice(0, 5).map((incident) => (
                    <li key={incident.id} className="text-xs">
                      <a
                        href={incident.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-link hover:underline"
                      >
                        {incident.title}
                      </a>
                      <span className="text-text-secondary ml-1.5">
                        {relativeTime(incident.publishedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {services.length === 0 && !loading && (
          <p className="text-center text-text-secondary py-8 col-span-full">
            No services configured.
          </p>
        )}
      </div>
    </div>
  );
}
