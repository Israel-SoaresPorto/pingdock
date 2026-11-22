import type { FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { LoaderCircle } from "lucide-react";
import { HTTP_METHODS, type HttpMethod } from "@/types/app";

interface RequestBarProps {
  method: HttpMethod;
  url: string;
  isLoading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
}

export function RequestBar({
  method,
  url,
  isLoading,
  onMethodChange,
  onUrlChange,
  onSubmit,
}: RequestBarProps) {
  const isUrlEmpty = url.trim().length === 0;
  const isSubmitDisabled = isLoading || isUrlEmpty;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSubmitDisabled) {
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2"
      aria-label="Barra de requisição"
    >
      <Select
        value={method}
        onValueChange={(value) => onMethodChange(value as HttpMethod)}
        disabled={isLoading}
      >
        <SelectTrigger
          aria-label="Método HTTP"
          className="w-28 rounded-sm border-border-strong bg-background font-mono text-sm font-medium shadow-none h-10"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-sm border-border bg-popover shadow-none">
          {HTTP_METHODS.map((httpMethod: HttpMethod) => (
            <SelectItem
              key={httpMethod}
              value={httpMethod}
              className="font-mono text-sm font-medium rounded-none"
            >
              {httpMethod}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="text"
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder="https://api.exemplo.com/v1/recurso"
        aria-label="URL da requisição"
        disabled={isLoading}
        className="min-w-50 flex-1 rounded-sm bg-background px-3 font-mono text-sm shadow-none placeholder:text-muted-foreground h-10 sm:min-w-70"
      />

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        variant="default"
        aria-busy={isLoading}
        className={
          isLoading
            ? "h-10 w-full cursor-progress rounded-sm bg-primary px-5.5 text-sm font-medium text-primary-foreground opacity-85 shadow-none hover:bg-primary sm:w-auto"
            : "h-10 w-full rounded-sm px-5.5 text-sm font-medium disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted-foreground disabled:opacity-100 sm:w-auto"
        }
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <LoaderCircle className="size-4 animate-spin" />
            Enviando…
          </span>
        ) : (
          "Enviar"
        )}
      </Button>
    </form>
  );
}
