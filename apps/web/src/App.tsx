import { useState } from "react";
import { RequestBar } from "@/components/request/request-bar";
import { RequestTabs } from "@/components/request/request-tabs";
import type { HeaderItem, HistoryItem, HttpMethod } from "@/types/app";
import { ResponsePanel } from "./components/response/response-panel";
import useClientRequest from "./hooks/use-client-request";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HistorySidebar } from "./components/history-sidebar";
import { cn } from "cn";
import { useHistory } from "./hooks/use-history";

export function App() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    {
      id: crypto.randomUUID(),
      key: "Accept",
      value: "application/json",
      enabled: true,
    },
  ]);
  const [body, setBody] = useState("");

  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const { request, isLoading, error, response } = useClientRequest();
  const { history, addEntry, removeEntry, clearHistory } = useHistory();

  async function handleSubmit() {
    const result = await request(url, method, headers, body);
    if (result) {
      const created = addEntry({
        method,
        url: url.trim(),
        headers,
        body,
        status: result.status,
        durationMs: result.durationMs,
      });
      setSelectedHistoryId(created.id);
    }
  }

  function handleSelectHistoryItem(item: HistoryItem) {
    setMethod(item.method);
    setUrl(item.url);
    setHeaders(item.headers.map((header) => ({ ...header })));
    setBody(item.body);
    setSelectedHistoryId(item.id);
    setIsMobileHistoryOpen(false);
  }

  function handleRemoveHistoryItem(id: string) {
    removeEntry(id);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
  }

  function handleClearHistory() {
    clearHistory();
    setSelectedHistoryId(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 bg-background flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="text-base font-semibold tracking-[-0.01em]">
            PingDock
          </span>
        </div>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Cliente HTTP/REST
        </span>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsMobileHistoryOpen((open) => !open)}
          aria-expanded={isMobileHistoryOpen}
          aria-controls="history-sidebar"
          className="h-11 gap-2 rounded-[6px] border-border bg-surface px-3 text-[13px] font-medium text-foreground shadow-none hover:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
        >
          <History className="size-4" strokeWidth={1.5} aria-hidden="true" />
          <span>Histórico</span>
          <span className="font-mono text-xs text-muted-foreground">
            {history.length}
          </span>
        </Button>
      </header>

      <div className="flex flex-1 flex-wrap">
        <aside
          id="history-sidebar"
          aria-label="Histórico de requisições"
          className={cn(
            "w-full border-b border-border bg-surface p-4 lg:block lg:w-75 lg:border-r lg:border-b-0 lg:fixed lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto",
            isMobileHistoryOpen ? "block" : "hidden",
          )}
        >
          <HistorySidebar
            items={history}
            selectedId={selectedHistoryId}
            onSelect={handleSelectHistoryItem}
            onRemove={handleRemoveHistoryItem}
            onClear={handleClearHistory}
          />
        </aside>

        <main className="w-full lg:ml-76 space-y-6">
          <RequestBar
            method={method}
            url={url}
            isLoading={isLoading}
            onMethodChange={setMethod}
            onUrlChange={setUrl}
            onSubmit={handleSubmit}
          />

          <div className="h-full grid grid-cols-[1fr_1px_1fr] border-t border-border">
            <RequestTabs
              method={method}
              headers={headers}
              body={body}
              onHeadersChange={setHeaders}
              onBodyChange={setBody}
              className="w-full"
            />

            <span className="bg-border" aria-hidden="true" />

            <ResponsePanel
              response={response}
              error={error}
              isLoading={isLoading}
              className="w-full"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
