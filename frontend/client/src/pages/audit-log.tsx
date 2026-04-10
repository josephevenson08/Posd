import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Shield, LogOut, Search, Filter, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuditLog = {
  id: number;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
};

const ACTION_STYLES: Record<string, { color: string; bg: string; icon: any }> = {
  LOGIN: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle },
  LOGIN_FAILED: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  LOGOUT: { color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: LogOut },
  REGISTER: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Info },
};

function getActionStyle(action: string) {
  return ACTION_STYLES[action] || { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: AlertTriangle };
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AuditLogPage() {
  const [, setLocation] = useLocation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [sortDesc, setSortDesc] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audit-logs", {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("mediportal_user");
        setLocation("/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(data);
    } catch {
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actions = ["ALL", ...Array.from(new Set(logs.map((l) => l.action)))];

  const filtered = logs
    .filter((l) => {
      if (actionFilter !== "ALL" && l.action !== actionFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.username?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.ipAddress?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortDesc ? -diff : diff;
    });

  const stats = {
    total: logs.length,
    logins: logs.filter((l) => l.action === "LOGIN").length,
    failed: logs.filter((l) => l.action === "LOGIN_FAILED").length,
    registers: logs.filter((l) => l.action === "REGISTER").length,
  };

  const handleExit = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {}

    localStorage.removeItem("mediportal_user");
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Audit Log</h1>
              <p className="text-xs text-slate-400">System access and activity monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={fetchLogs}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={handleExit}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total, color: "text-white" },
            { label: "Successful Logins", value: stats.logins, color: "text-green-400" },
            { label: "Failed Attempts", value: stats.failed, color: "text-red-400" },
            { label: "Registrations", value: stats.registers, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by username, action, details, or IP..."
              className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white min-w-[160px] justify-between"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {actionFilter === "ALL" ? "All Actions" : actionFilter}
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[160px]">
                {actions.map((action) => (
                  <button
                    key={action}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      actionFilter === action ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      setActionFilter(action);
                      setFilterOpen(false);
                    }}
                  >
                    {action === "ALL" ? "All Actions" : action}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => setSortDesc(!sortDesc)}
          >
            {sortDesc ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronUp className="w-4 h-4 mr-2" />}
            {sortDesc ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">Username</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-1">IP</div>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-red-400">
              <XCircle className="w-6 h-6 mx-auto mb-3" />
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              No logs found matching your filters.
            </div>
          ) : (
            filtered.map((log) => {
              const style = getActionStyle(log.action);
              const Icon = style.icon;
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors items-center"
                >
                  <div className="col-span-1 text-xs text-slate-600 font-mono">{log.id}</div>
                  <div className="col-span-2">
                    <p className="text-xs text-white font-medium">{formatDate(log.timestamp)}</p>
                    <p className="text-xs text-slate-500 font-mono">{formatTime(log.timestamp)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-200 font-medium">{log.username || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.color}`}>
                      <Icon className="w-3 h-3" />
                      {log.action}
                    </span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm text-slate-300">{log.details || "-"}</p>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs text-slate-500 font-mono">{log.ipAddress || "-"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-slate-600 text-center">
          Showing {filtered.length} of {logs.length} events
        </p>
      </div>
    </div>
  );
}
