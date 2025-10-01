"use client";

import { useCallback, useEffect, useState } from "react";

const API_BACKEND_URL = "http://localhost:8000";

// Fetch cookie in current user session
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}

export type UserInfo = {
  first_name: string;
  last_name: string;
  username: string;
  role: string;
};

export type TemplateSummaryRow = {
  templateId: number;
  name: string;
  version: number;
  subjectCode: string;
  year: number;
  semester: number;
  ownerName: string;
  isPublishable: boolean;
  isTemplate: boolean;
};

export type TemplateDetails = {
  id: number;
  name: string;
  version: number;
  ownerId: number;
  subject: { code: string; name: string | null ; semester: number; year: number};
  scope: string;
  description: string;
  isPublishable: boolean;
  isTemplate: boolean;
  template_items: Array<{
    id: number;
    task: string;
    instructionsToStudents: string;
    examples: string;
    aiGeneratedContent: string;
    useAcknowledgement: boolean;
    aiUseScaleLevel__name: string | null;
  }>;
};

function parseJSON<T>(res: Response): Promise<T> {
  return res.json().catch(() => ({})) as Promise<T>;
}

//Fetch entries in the template 
export function useTemplateDetails(templateID: number) {
  const [templateId, setTemplateId] = useState<number>(templateID);
  const [data, setData] = useState<TemplateDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  const open = useCallback((templateID: number) => {
    setTemplateId(templateID);
    setLoading(true);
    setErr(null);

    fetch(`${API_BACKEND_URL}/template/details/?templateId=${encodeURIComponent(templateID)}`, {
      method: "GET", credentials: "include",
    })
      .then(async (res) => {
        const body = await parseJSON<TemplateDetails>(res);
        setData(body);
      })
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, open, setTemplateId, setData };
}


export type NewVersionForm = {
  name: string;
  subjectCode: string;
  year: number;
  semester: number;
  scope?: string;
  description?: string;
  version?: number;
  isPublishable?: boolean;
  isTemplate?: boolean;
};

export function createOrUpdateTemplateAction(
  username: string,
  onSuccess: (result: { templateId: number; version: number }) => void,
  onError: (msg: string) => void
) {
  return (form: NewVersionForm) => {
    const payload = {
      username,
      name: form.name,
      subjectCode: form.subjectCode ,
      year: form.year,
      semester: form.semester ,
      version: form.version,
      scope: form.scope,
      description: form.description,
      isPublishable: form.isPublishable,
      isTemplate: form.isTemplate,
    };

    const csrftoken = getCookie("csrftoken");
    fetch(`${API_BACKEND_URL}/template/update/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken ?? "",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const body = await parseJSON<{ success?: boolean; templateId?: number; version?: number; error?: string }>(res);
        if (body?.templateId && body?.version) {
          onSuccess({ templateId: body.templateId, version: body.version });
        } else {
          onError(body?.error ?? "Failed to create/update template");
        }
      })
      .catch((e) => onError(String(e?.message ?? e)));
  };
}

export type NewItem = {
  templateItemId?: number;   
  task: string;
  aiUseScaleLevel_name?: string;
  instructionsToStudents?: string;
  examples?: string;
  aiGeneratedContent?: string;
  useAcknowledgement?: boolean;
};


export function addTemplateItemAction(templateId: number) {
  const csrftoken = getCookie("csrftoken");
  return (item: NewItem): Promise<void> => {
    return fetch(`${API_BACKEND_URL}/templateitem/update/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken ?? "",
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
      body: JSON.stringify({ templateId, ...item }),
    })
      .then(async (res) => {
        const body = await parseJSON<{ success?: boolean; error?: string }>(res);
        console.log(body);

        if (!res.ok || !body?.success) {
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
      });
  };
}



export function deleteTemplateAction(
  templateId: number,
  onSuccess: () => void,
  onError: (msg: string) => void
) {
  return () => {
    fetch(`${API_BACKEND_URL}/template/delete/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ templateId }),
    })
      .then(async (res) => {
        const body = await parseJSON<{ success: boolean }>(res);
        if (body?.success) onSuccess();
        else onError("failed to delete template");
      })
      .catch((e) => onError(String(e?.message ?? e)));
  };
}
