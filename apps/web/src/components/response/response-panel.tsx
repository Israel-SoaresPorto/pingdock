// apps/web/src/components/ResponsePanel.tsx
import { AlertTriangle, LoaderCircle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProxyResponse } from "@/types/api";
import type { ProxyRequestError } from "@/types/app";
import { ResponseContent } from "./response-content";

interface ResponsePanelProps {
  response: ProxyResponse | null;
  error: ProxyRequestError | null;
  isLoading: boolean;
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

export function ResponsePanel({
  response,
  error,
  isLoading,
}: ResponsePanelProps) {
  if (isLoading) {
    return (
      <section
        aria-label="Painel de resposta"
        aria-busy="true"
        className="flex items-center gap-2 rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground"
      >
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        <span>Enviando requisição…</span>
      </section>
    );
  }

  if (error) {
    const alertConfig = getErrorAlertConfig(error);

    return (
      <section aria-label="Painel de resposta">
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-md border p-4 text-sm",
            alertConfig.containerClass,
          )}
        >
          <AlertTriangle
            className={cn("mt-0.5 size-4 shrink-0", alertConfig.titleClass)}
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className={cn("font-semibold", alertConfig.titleClass)}>
              {alertConfig.title}
            </p>
            <p className="text-foreground">{error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!response) {
    return (
      <section
        aria-label="Painel de resposta"
        className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border p-8 text-center"
      >
        <Terminal className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          Nenhuma resposta ainda
        </p>
        <p className="text-2xs text-muted-foreground">
          Informe uma URL acima e clique em Enviar para visualizar status,
          headers e corpo da resposta.
        </p>
      </section>
    );
  }

  return <ResponseContent response={response} />;
}
