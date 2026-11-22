import { useState } from "react";
import { RequestBar } from "@/components/request/request-bar";
import { RequestTabs } from "@/components/request/request-tabs";
import type { HeaderItem, HttpMethod } from "@/types/app";
import { ResponsePanel } from "./components/response/response-panel";
import useClientRequest from "./hooks/use-client-request";

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

  const { request, isLoading, error, response } = useClientRequest();

  async function handleSubmit() {
    await request(url, method, headers, body);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            PingDock
          </span>
        </div>
        <span className="hidden text-[13px] text-muted-foreground sm:inline">
          Cliente HTTP/REST
        </span>
      </header>

      <div className="flex flex-1 flex-wrap">
        <aside
          aria-label="Histórico de requisições"
          className="w-full border-b border-border bg-surface p-4 lg:w-75 lg:border-r lg:border-b-0"
        >
          <p className="text-[14px] font-semibold">Histórico</p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            O histórico local será habilitado na Fase 4.
          </p>
        </aside>

        <main className="min-w-0 flex-[999_1_560px] space-y-6 p-6">
          <RequestBar
            method={method}
            url={url}
            isLoading={isLoading}
            onMethodChange={setMethod}
            onUrlChange={setUrl}
            onSubmit={handleSubmit}
          />

          <RequestTabs
            method={method}
            headers={headers}
            body={body}
            onHeadersChange={setHeaders}
            onBodyChange={setBody}
          />

          <ResponsePanel
            response={response}
            error={error}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
