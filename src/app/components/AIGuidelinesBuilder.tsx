"use client";

import React, { useState, useEffect } from 'react';
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

interface AIUseLevel {
  id: string;
  task?: string;
  aiUseScaleLevel_name: string;   
  instructions: string;
  examples: string;
  aiGeneratedContent: string;     
  acknowledgement: string;
}

interface TemplateScale {
  id: string;
  name: string;
  description: string;
  category: string;
  levels: Omit<AIUseLevel, 'id'>[];
}

export default function AIGuidelinesBuilder() {
  //pass in the template_id of the template we want to display from dashboard page
  const searchParams = useSearchParams();
  const templateID = (() => {
    const v = Number(searchParams.get("template_id"));
    return v; 
  })();

  //Store temporarily the current fields of the form
  const [guidelinesTitle, setGuidelinesTitle] = useState('AI Use Guidelines for Assessment');
  const [assessmentType, setAssessmentType] = useState('');
  const [username, setUsername] = useState<string>("benconnor@unimelb.edu.au");
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

  
  const [aiUseLevels, setAIUseLevels] = useState<AIUseLevel[]>([
    {
      id: '1',
      task: '',
      aiUseScaleLevel_name: 'No AI Use Permitted',
      instructions: 'The assessment is completed entirely without AI assistance. This level ensures that students rely solely on their knowledge, understanding, and skills. AI must not be used at any point during the assessment',
      examples: 'Traditional exams, in-class essays, mathematical problem-solving without computational aids, original creative writing',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: 'Students must acknowledge that they have not used AI tools in completing this assessment.',
    },
    {
      id: '2',
      task: '',
      aiUseScaleLevel_name: 'AI for Research & Brainstorming Only',
      instructions: 'You may use AI tools for initial research, topic exploration, and brainstorming ideas. However, all analysis, writing, and final work must be your own.',
      examples: 'Using ChatGPT to understand complex topics, generating research questions, exploring different perspectives on a subject',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: 'Students must acknowledge that they have not used AI tools in completing this assessment.',
    },
    {
      id: '3',
      task: '',
      aiUseScaleLevel_name: 'AI as Writing Assistant',
      instructions: 'AI tools may be used to assist with writing tasks such as grammar checking, style suggestions, and structural feedback. The core ideas and arguments must be your own.',
      examples: 'Using Grammarly for editing, ChatGPT for feedback on draft structure, AI tools for citation formatting',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: 'Students must acknowledge that they have not used AI tools in completing this assessment.',
    },
    {
      id: '4',
      task: '',
      aiUseScaleLevel_name: 'Collaborative AI Use Encouraged',
      instructions: 'AI tools are encouraged as collaborative partners. You may use AI for research, drafting, analysis, and refinement while demonstrating critical evaluation of AI outputs.',
      examples: 'Co-writing with AI, using AI for data analysis, AI-assisted coding projects, collaborative problem-solving with AI',
      aiGeneratedContent: 'Add details here…',
      acknowledgement: 'Students must acknowledge that they have not used AI tools in completing this assessment.',
    },
  ]);


  useEffect(() => {
    open(templateID);
  }, [open, templateID]);

  // Fetch API once
  const [isFetched, setIsFetched] = useState(false);
  useEffect(() => {
    if (payload && !isFetched) {
      // Get the info to display for template details
      setGuidelinesTitle(payload.name ?? 'AI Use Guidelines for Assessment');
      setAssessmentType(payload.scope ?? 'Assignment');
      setSubjectCode(payload.subject?.code ?? "COMP10001");
      setSemester(payload.subject?.semester ?? "1");
      setYear(payload.subject?.year ?? "2025");
      setVersion(payload.version ?? 0);
      setIsPublishable(Boolean(payload.isPublishable));
      setIsTemplate(Boolean(payload.isTemplate));


      // Map API template_items to table rows for display
      const mapped = (payload.template_items ?? []).map((it, idx) => ({
        id: String(it.id ?? idx),
        task: it.task ?? '',
        aiUseScaleLevel_name: it.aiUseScaleLevel__name ?? `Level ${idx + 1}`,
        instructions: it.instructionsToStudents ?? '',
        examples: it.examples ?? '',
        acknowledgement: it.useAcknowledgement ?? 'false',
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
        acknowledgement: '',
      },
    ]);
  };


  const removeAIUseLevel = (id: string) => {
    if (aiUseLevels.length <= 1) return; // Keep at least 1 level
    setAIUseLevels(aiUseLevels.filter(level => level.id !== id));
  };

  //update description for AI use level
  const updateAIUseLevel = (id: string, field: keyof AIUseLevel, value: string) => {
    setAIUseLevels(aiUseLevels.map(level => 
      level.id === id ? { ...level, [field]: value } : level
    ));
  };

  const handleSelectTemplate = (template: TemplateScale) => {
    const newLevels = template.levels.map((level, index) => ({
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

            // Add all template items (updated or not) to the template just created
            // Call addTemplateItemAction to add the item for every row in the guidelines form
            const addItemOnce = (item: {
              task: string;
              aiUseScaleLevel: string;
              instructionsToStudents: string;
              examples: string;
              aiGeneratedContent: string;
              useAcknowledgement: boolean;
            }) =>
                new Promise<void>((resolve, reject) => {
                  const addItem = addTemplateItemAction(
                    templateId
                  );
                  addItem({ ...item, useAcknowledgement: String(item.useAcknowledgement ?? false) });
                  console.log("added an item to template");
                });

            //Loop through all rows and add the template items to the parent template
            const addAll = aiUseLevels.map((level) =>
              addItemOnce({
                task: level.task ?? "NA",
                aiUseScaleLevel: level.aiUseScaleLevel_name ?? "NA",    
                instructionsToStudents: level.instructions ?? "NA",
                examples: level.examples ?? "NA",
                aiGeneratedContent: level.aiGeneratedContent ?? "NA",    
                useAcknowledgement: Boolean(level.acknowledgement),
              })
            );


            await Promise.all(addAll);
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

            <div className="flex items-end">
          <div>
            <Label htmlFor="is-template">Template?</Label>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="is-template"
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                {isTemplate ? 'Yes' : 'No'}
              </span>
            </div>
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
          <div className="overflow-x-auto">
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
                    {/* Acknowledgement */}
                    <td className="p-4 align-top">
                      <Textarea
                        value={level.acknowledgement}
                        onChange={(e) => updateAIUseLevel(level.id, 'acknowledgement', e.target.value)}
                        placeholder="Required acknowledgement statement for students..."
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />
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
              {aiUseLevels.length} AI use levels defined{assessmentType && ` • ${assessmentType}`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Export Guidelines</Button>
              <Button onClick={handleSaveGuidelines} disabled={isSaving}>{isSaving ? "Saving…" : "Save Guidelines"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}
