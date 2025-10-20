"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader} from './card';
import { Plus, Trash2, Settings} from 'lucide-react';
import { Label } from './label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import AITemplateRepository from './AITemplateRepository';
import { useTemplateDetails, createOrUpdateTemplateAction, addTemplateItemAction, deleteTemplateAction } from './api';
import { useSearchParams } from "next/navigation";
import { useAuth } from "../authentication/auth";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';

interface AIUseLevel {
  id: number | string;
  task?: string;
  aiUseScaleLevel_name: string;   
  instructions: string;
  examples: string;
  aiGeneratedContent: string;     
  acknowledgement: boolean;
}

interface TemplateScale {
  id: string;
  name: string;
  description: string;
  category: string;
  levels: Omit<AIUseLevel, 'id'>[];
}

const AIGuidelinesBuilder = forwardRef((props, ref) => {
  //pass in the template_id of the template we want to display from dashboard page
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateID = (() => {
    const v = Number(searchParams.get("template_id"));
    return v; 
  })();
  const [username, setUsername] = useState<string>("");
  const { user, pageLoading, refresh } = useAuth();

  //Store temporarily the current fields of the form
  const [guidelinesTitle, setGuidelinesTitle] = useState('AI Use Guidelines for Assessment');
  const [assessmentType, setAssessmentType] = useState('');
  const { data: payload, loading: detailLoading, error: detailErr, open, setData: setPayload } = useTemplateDetails(templateID);
  const [subjectCode, setSubjectCode] = useState<string>("");
  const [semester, setSemester] = useState<number>(1);
  const [year, setYear] = useState<number>(2025);
  const [version, setVersion] = useState<number>(0);
  const [isPublishable, setIsPublishable] = useState<boolean>(false);
  const [isTemplate, setIsTemplate] = useState<boolean>(false);

  // Save guidelines button states
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  // Reroute to log in page if user session invalid
  useEffect(() => {
    if (!pageLoading && !user) router.replace("/login");
  }, [pageLoading, user, router]);

  useEffect(() => { refresh(); }, []); 

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user]);

  
  const [aiUseLevels, setAIUseLevels] = useState<AIUseLevel[]>([
    {
      id: '1',
      task: '',
      aiUseScaleLevel_name: 'No AI Use Permitted',
      instructions: 'The assessment is completed entirely without AI assistance. This level ensures that students rely solely on their knowledge, understanding, and skills. AI must not be used at any point during the assessment',
      examples: 'Traditional exams, in-class essays, mathematical problem-solving without computational aids, original creative writing',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: true,
    },
    {
      id: '2',
      task: '',
      aiUseScaleLevel_name: 'AI for Research & Brainstorming Only',
      instructions: 'You may use AI tools for initial research, topic exploration, and brainstorming ideas. However, all analysis, writing, and final work must be your own.',
      examples: 'Using ChatGPT to understand complex topics, generating research questions, exploring different perspectives on a subject',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: true,
    },
    {
      id: '3',
      task: '',
      aiUseScaleLevel_name: 'AI as Writing Assistant',
      instructions: 'AI tools may be used to assist with writing tasks such as grammar checking, style suggestions, and structural feedback. The core ideas and arguments must be your own.',
      examples: 'Using Grammarly for editing, ChatGPT for feedback on draft structure, AI tools for citation formatting',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: true,
    },
    {
      id: '4',
      task: '',
      aiUseScaleLevel_name: 'Collaborative AI Use Encouraged',
      instructions: 'AI tools are encouraged as collaborative partners. You may use AI for research, drafting, analysis, and refinement while demonstrating critical evaluation of AI outputs.',
      examples: 'Co-writing with AI, using AI for data analysis, AI-assisted coding projects, collaborative problem-solving with AI',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: true,
    },
  ]);


  useEffect(() => {
    if (templateID && !isNaN(templateID)) {
      open(templateID);
    }
  }, [open, templateID]);

  // Fetch API once
  const [isFetched, setIsFetched] = useState(false);
  useEffect(() => {
    if (payload && !isFetched) {
      // Get the info to display for template details
      setGuidelinesTitle(payload.name ?? 'AI Use Guidelines for Assessment');
      setAssessmentType(payload.scope ?? 'Assignment');
      setSubjectCode(payload.subject?.code ?? "COMP10001");
      setSemester(payload.subject?.semester ?? 1);
      setYear(payload.subject?.year ?? 2025);
      setVersion(payload.version ?? 0);
      setIsPublishable(Boolean(payload.isPublishable));
      setIsTemplate(Boolean(payload.isTemplate));
      setVersion(Number(payload.version ?? 0));
      setCurrentVersion(Number(payload.version ?? 0)); 


      // Map API template_items to table rows for display
      const mapped = (payload.template_items ?? []).map((it, idx) => ({
        id: String(it.id),
        task: it.task ?? '',
        aiUseScaleLevel_name: it.aiUseScaleLevel__name ?? `Level ${idx + 1}`,
        instructions: it.instructionsToStudents ?? '',
        examples: it.examples ?? '',
        acknowledgement: Boolean(it.useAcknowledgement),
        aiGeneratedContent: it.aiGeneratedContent ?? '',
      }));

      if (mapped.length > 0) setAIUseLevels(mapped);
      setIsFetched(true);
    }
  }, [payload, isFetched]);

  const addAIUseLevel = () => {
    const newId = Date.now().toString();
    setAIUseLevels([
      ...aiUseLevels,
      {
        id: newId,
        task: '',
        aiUseScaleLevel_name: 'New AI Use Level',
        instructions: '',
        examples: '',
        aiGeneratedContent: '',
        acknowledgement: true,
      },
    ]);
  };


  const removeAIUseLevel = (id: string | number) => {
    if (aiUseLevels.length <= 1) return; // Keep at least 1 level
    setAIUseLevels(aiUseLevels.filter(level => level.id !== id));
  };

  //update description for AI use level
  const updateAIUseLevel = (id: string | number, field: keyof AIUseLevel, value: string | boolean) => {
    setAIUseLevels(aiUseLevels.map(level => 
      level.id === id ? { ...level, [field]: value } : level
    ));
  };

  const handleSelectTemplate = (template: any) => {
    const newLevels = (template.levels ?? []).map((level: any, index: number) => ({
      ...level,
      id: (Date.now() + index).toString()
    }));
    setAIUseLevels(newLevels);
    setGuidelinesTitle(template.name);
  };

  async function handleSaveGuidelines() {
    setIsSaving(true);
    setError(null);

    try {
      // Build a form object for input into createOrUpdateTemplateAction
      const form = {
        name: guidelinesTitle,
        subjectCode: subjectCode,
        year: Number(year),
        semester: Number(semester),
        scope: assessmentType,
        description: "", 
        version: Number(currentVersion), 
        isPublishable: isPublishable,
        isTemplate: isTemplate,
      };

      await new Promise<void>((resolve, reject) => {
        const onSuccess = async ({ templateId, version }: { templateId: number; version: number }) => {
          try {
            setTemplateId(templateId);
            setCurrentVersion(version);
            setVersion(version);

            window.localStorage.setItem("currentTemplateId", String(templateId));

            // Add all template items (updated or not) to the template just created
            // Call addTemplateItemAction to add the item for every row in the guidelines form
            const addItemOnce = (level: AIUseLevel) => {
              const addItem = addTemplateItemAction(templateId!);
              return addItem({
                task: level.task ?? 'NA',
                aiUseScaleLevel_name: level.aiUseScaleLevel_name ?? 'NA',
                instructionsToStudents: level.instructions ?? 'NA',
                examples: level.examples ?? 'NA',
                aiGeneratedContent: level.aiGeneratedContent ?? 'NA',
                useAcknowledgement: !!level.acknowledgement,
              });
            };
            await Promise.all(aiUseLevels.map(addItemOnce));

            setIsFetched(false);
            open(templateId)
            console.log("Template items created.")
            resolve();
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        };

        const onError = (msg: string) => reject(new Error(msg));

        // Make API call to create new template object
        const save = createOrUpdateTemplateAction(username, onSuccess, onError);
        console.log("New template created.")
        save(form);
      });

    } catch (e: any) {
      setError(e?.message ?? "Error with updating template.");
    } finally {
      setIsSaving(false);
    }
  }

  const escapeHtml = (str: string) => 
    String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildPrintableHTML = () => {
    const tableHeader = `
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:80px">Task</th>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:80px">AI Assessment Use Levels</th>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:300px">Instructions to Students</th>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:200px">Examples</th>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:200px">AI Generated Content</th>
          <th style="text-align:left;padding:8px;border:1px solid #ddd;min-width:80px">AI Acknowledgement</th>
        </tr>
      </thead>`;

    const rows = aiUseLevels.map((level, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f7f7f7';
        return `
          <tr style="background:${bg}">
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${escapeHtml(level.task ?? '')}</td>
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${escapeHtml(level.aiUseScaleLevel_name ?? '')}</td>
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${escapeHtml(level.instructions ?? '')}</td>
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${escapeHtml(level.examples ?? '')}</td>
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${escapeHtml(level.aiGeneratedContent ?? '')}</td>
            <td style="vertical-align:top;padding:8px;border:1px solid #ddd;">${level.acknowledgement ? 'Yes' : 'No'}</td>
          </tr>`;
      }).join('');
    
    const style = `
      <style>
        @page { margin: 20mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f172a; font-size:12px; }
        h1 { font-size:18px; margin-bottom:8px; }
        table { border-collapse: collapse; width:100%; margin-top:8px; }
        th { background:#f1f5f9; font-weight:600; }
        td, th { word-break:break-word; }
      </style>`;
    
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(guidelinesTitle)}</title>
          ${style}
        </head>
        <body>
          <h1>${escapeHtml(guidelinesTitle)}</h1>
          <div>${escapeHtml(assessmentType ?? '')}</div>
          <table>
            ${tableHeader}
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>`;
  };

  const handleExportPDF = async () => {
    const html = buildPrintableHTML();

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin:       10,
        filename:     `${guidelinesTitle || 'AI_Guidelines'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      } as const;

      // convert HTML string to DOM element
      const el = document.createElement('div');
      el.innerHTML = html;
      // download
      await html2pdf().from(el).set(opt).save();
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Failed to export PDF.');
    }
  };

  const handleExportExcel = () => {
    const data = aiUseLevels.map(level => ({
      Task: level.task ?? '',
      'AI Use Level': level.aiUseScaleLevel_name ?? '',
      'Instructions to Students': level.instructions ?? '',
      'Examples': level.examples ?? '',
      'AI Generated Content': level.aiGeneratedContent ?? '',
      'Acknowledgement Required': level.acknowledgement ? 'Yes' : 'No',
    }));

    // create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet['!cols'] = [
      { wch: 30 }, // Task
      { wch: 20 }, // AI Use Level
      { wch: 40 }, // Instructions to Students
      { wch: 40 }, // Examples
      { wch: 40 }, // AI Generated Content
      { wch: 25 }, // Acknowledgement Required
    ];

    // text wrapping
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cell_address];
        if (cell && cell.t) {
          if (!cell.s) cell.s = {};
          cell.s.alignment = { wrapText: true, vertical: 'top' };
        }
      }
    }

    // add worksheet to workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AI Use Levels');

    // write to file and download
    const filename = `${guidelinesTitle || 'AI_Guidelines'}.xlsx`;
    XLSX.writeFile(workbook, filename, {cellStyles: true});
  }

  useImperativeHandle(ref, () => ({
    save: handleSaveGuidelines,  // expose save function to parent
  }));

  return (
    <div className="flex h-[calc(100vh-120px)]">
      <AITemplateRepository onSelectTemplate={handleSelectTemplate} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 max-w-md">
                <Label htmlFor="guidelines-title">Asessment Title</Label>
                <Input
                  id="guidelines-title"
                  value={guidelinesTitle}
                  onChange={(e) => setGuidelinesTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1 max-w-md">
                <Label htmlFor="assessment-type">Assessment Scope</Label>
                <Input
                  id="assessment-type"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  placeholder="e.g., Research Paper, Project, Exam..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={String(version)}
                  onChange={(e) => setVersion(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subject-code">Subject Code</Label>
                <Input
                  id="subject-code"
                  value={String(subjectCode)}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={String(semester)}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={String(year)}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="is-publishable">Publishable?</Label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="is-publishable"
                  type="checkbox"
                  checked={isPublishable}
                  onChange={(e) => setIsPublishable(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">
                  {isPublishable ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
        </div>


            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage AI Use Levels
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Manage AI Use Levels</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {aiUseLevels.map((level) => (
                      <div key={level.id} className="flex items-center gap-3 p-3 border rounded">
                        <Input
                          value={level.aiUseScaleLevel_name}
                          onChange={(e) => updateAIUseLevel(level.id, 'aiUseScaleLevel_name', e.target.value)}
                          placeholder="Level name"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAIUseLevel(level.id)}
                          disabled={aiUseLevels.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button onClick={addAIUseLevel} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add AI Use Level
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Guidelines Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto" id="guidelines-table">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 w-48 bg-primary/5 border-r">
                    <div className="font-medium text-primary">Task</div>
                  </th>
                  <th className="text-left p-4 w-48 bg-primary/5 border-r">
                    <div className="font-medium text-primary">AI Assessment Use Levels</div>
                  </th>
                  <th className="text-left p-4 min-w-80 bg-primary/5 border-r">
                    <div className="font-medium text-primary">Instructions to Students</div>
                  </th>
                  <th className="text-left p-4 min-w-64 bg-primary/5 border-r">
                    <div className="font-medium text-primary">Examples</div>
                  </th>
                  <th className="text-left p-4 min-w-64 bg-primary/5 border-r">
                    <div className="font-medium text-primary">AI Generated Content</div>
                  </th>
                  <th className="text-left p-4 min-w-64 bg-primary/5 border-r">
                    <div className="font-medium text-primary">AI Acknowledgement</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {aiUseLevels.map((level, index) => (
                  <tr key={level.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                    {/* Task */}
                    <td className="p-4 align-top border-r bg-accent/20">
                      <Textarea
                        value={level.task ?? ''}
                        onChange={(e) => updateAIUseLevel(level.id, 'task', e.target.value)}
                        placeholder="Task title / description..."
                        className="min-h-24 resize-none font-medium border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent"
                      />
                    </td>
                    {/* Level name */}
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.aiUseScaleLevel_name}
                        onChange={(e) => updateAIUseLevel(level.id, 'aiUseScaleLevel_name', e.target.value)}
                        placeholder="AI use level name..."
                        className="min-h-24 resize-none font-medium border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent"
                      />

                    </td>
                    {/* Instructions */}
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.instructions}
                        onChange={(e) => updateAIUseLevel(level.id, 'instructions', e.target.value)}
                        placeholder="Clear instructions for students about what AI use is permitted..."
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />
                    </td>
                    {/* Examples */}
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.examples}
                        onChange={(e) => updateAIUseLevel(level.id, 'examples', e.target.value)}
                        placeholder="Specific examples of permitted AI use..."
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />
                    </td>
                    {/* AI Generated Content */}
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.aiGeneratedContent}
                        onChange={(e) => updateAIUseLevel(level.id, 'aiGeneratedContent', e.target.value)}
                        placeholder="Describe/attach AI-generated parts, constraints, or links…"
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />

                    </td>
                    {/* Acknowledgement, check box for need to acknowledge or not */}
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!level.acknowledgement}
                          onChange={(e) => updateAIUseLevel(level.id, 'acknowledgement', e.target.checked as any)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Student acknowledgement required</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {aiUseLevels.length} AI use levels defined
              {assessmentType && ` • ${assessmentType}`}
            </div>

            {/* export */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="export-format">Export Format:</Label>

                <div className="flex items-center gap-2">
                  {/* excel label */}
                  <span
                    className={`text-sm ${
                      exportFormat === "excel"
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Excel
                  </span>

                  {/* toggle */}
                  <div
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${exportFormat === "pdf" ? "bg-blue-900" : "bg-gray-300"}`}
                    onClick={() =>
                      setExportFormat((prev) => (prev === "excel" ? "pdf" : "excel"))
                    }
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300
                        ${exportFormat === "pdf" ? "translate-x-6" : ""}`}
                    />
                  </div>

                  {/* pdf label */}
                  <span
                    className={`text-sm ${
                      exportFormat === "pdf"
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    PDF
                  </span>
                </div>
              </div>

              {/* export & save buttons */}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    exportFormat === "pdf"
                      ? handleExportPDF()
                      : handleExportExcel()
                  }
                >
                  Export as {exportFormat === "pdf" ? "PDF" : "Excel"}
                </Button>

                <Button onClick={handleSaveGuidelines} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Guidelines"}
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );

});

export default AIGuidelinesBuilder;
 
