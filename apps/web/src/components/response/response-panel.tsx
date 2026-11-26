// apps/web/src/components/ResponsePanel.tsx
import { AlertTriangle, LoaderCircle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProxyResponse } from "@/types/api";
import type { ProxyRequestError } from "@/types/app";
import { ResponseContent } from "./response-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface ResponsePanelProps {
  response: ProxyResponse | null;
  error: ProxyRequestError | null;
  isLoading: boolean;
  className?: string;
}

export function ResponsePanelEmpty({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full items-center justify-center gap-2 p-4 text-sm text-muted-foreground",
        className,
      )}
    >
      <Terminal className="size-12 stroke-1" />
      {children ||
        "Nenhuma resposta ainda. Envie uma requisição para ver a resposta aqui."}
    </div>
  );
}

function getErrorAlertConfig(error: ProxyRequestError) {
  const isWarning = error.status === 429 || error.status === 504;

  if (isWarning) {
    return {
      title:
        error.status === 429
          ? "Limite de requisições atingido"
          : "Tempo limite excedido",
      containerClass: "border-alert-warning-border bg-alert-warning-bg",
      titleClass: "text-status-warning-text",
    };
  }

  return {
    title:
      error.status === 400
        ? "Requisição bloqueada"
        : "Erro ao executar requisição",
    containerClass: "border-alert-error-border bg-alert-error-bg",
    titleClass: "text-status-error-text",
  };
}

export function ResponsePanelError({
  error,
  className,
}: {
  error: ProxyRequestError;
  className?: string;
}) {
  const alertConfig = getErrorAlertConfig(error);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border p-4 text-sm",
        alertConfig.containerClass,
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="size-8 stroke-1 text-destructive" />
      <div className="flex flex-col gap-1 text-center">
        <span className={alertConfig.titleClass}>{alertConfig.title}</span>
        <span className="text-muted-foreground">
          {error.message || "Ocorreu um erro ao executar a requisição."}
        </span>
      </div>
    </div>
  );
}

export function ResponsePanel({
  response,
  error,
  isLoading,
  className,
}: ResponsePanelProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center gap-2 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <LoaderCircle className="size-4 animate-spin" />
        Enviando requisição…
      </div>
    );
  }

  return (
    <Tabs defaultValue="body" className={className}>
      <TabsList
        className="w-full justify-start rounded-none border-b border-border bg-transparent p-1"
        variant="line"
      >
        <TabsTrigger
          value="body"
          className="py-2 px-4 grow-0 data-active:after:bg-primary"
        >
          Resposta
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="py-2 px-4 grow-0 data-active:after:bg-primary"
        >
          Headers
        </TabsTrigger>
      </TabsList>
      <TabsContent value="body" className="mt-4 space-y-2 px-2">
        {error ? (
          <ResponsePanelError error={error} />
        ) : response ? (
          <ResponseContent response={response} />
        ) : (
          <ResponsePanelEmpty>
            Nenhuma resposta ainda. Envie uma requisição para ver o conteúdo da
            resposta aqui.
          </ResponsePanelEmpty>
        )}
      </TabsContent>
      <TabsContent value="headers" className="mt-4 space-y-2 px-2">
        {response ? (
          <ResponseContent response={response} />
        ) : (
          <ResponsePanelEmpty>
            Nenhuma resposta ainda. Envie uma requisição para ver os headers
            aqui.
          </ResponsePanelEmpty>
        )}
      </TabsContent>
    </Tabs>
  );
}
