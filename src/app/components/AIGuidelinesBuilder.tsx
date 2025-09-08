"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader} from './card';
import { Plus, Trash2, Settings} from 'lucide-react';
import { Label } from './label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import AITemplateRepository from './AITemplateRepository';

interface AIUseLevel {
  id: string;
  label: string;
  instructions: string;
  examples: string;
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
  const [guidelinesTitle, setGuidelinesTitle] = useState('AI Use Guidelines for Assessment');
  const [assessmentType, setAssessmentType] = useState('');
  
  const [aiUseLevels, setAIUseLevels] = useState<AIUseLevel[]>([
    {
      id: '1',
      label: 'No AI Use Permitted',
      instructions: 'The assessment is completed entirely without AI assistance. This level ensures that students rely solely on their knowledge, understanding, and skills. AI must not be used at any point during the assessment',
      examples: 'Traditional exams, in-class essays, mathematical problem-solving without computational aids, original creative writing',
      acknowledgement: 'I confirm that I have not used any AI tools in completing this assessment.'
    },
    {
      id: '2',
      label: 'AI for Research & Brainstorming Only',
      instructions: 'You may use AI tools for initial research, topic exploration, and brainstorming ideas. However, all analysis, writing, and final work must be your own.',
      examples: 'Using ChatGPT to understand complex topics, generating research questions, exploring different perspectives on a subject',
      acknowledgement: 'I used AI tools for [specify purpose] but all analysis and written work is my own original contribution.'
    },
    {
      id: '3',
      label: 'AI as Writing Assistant',
      instructions: 'AI tools may be used to assist with writing tasks such as grammar checking, style suggestions, and structural feedback. The core ideas and arguments must be your own.',
      examples: 'Using Grammarly for editing, ChatGPT for feedback on draft structure, AI tools for citation formatting',
      acknowledgement: 'I used AI tools to assist with [editing/formatting/feedback] while maintaining original authorship of all content and ideas.'
    },
    {
      id: '4',
      label: 'Collaborative AI Use Encouraged',
      instructions: 'AI tools are encouraged as collaborative partners. You may use AI for research, drafting, analysis, and refinement while demonstrating critical evaluation of AI outputs.',
      examples: 'Co-writing with AI, using AI for data analysis, AI-assisted coding projects, collaborative problem-solving with AI',
      acknowledgement: 'I collaborated with AI tools throughout this project. I have critically evaluated all AI contributions and take responsibility for the final submission.'
    }
  ]);

  const addAIUseLevel = () => {
    const newId = Date.now().toString();
    setAIUseLevels([...aiUseLevels, {
      id: newId,
      label: 'New AI Use Level',
      instructions: '',
      examples: '',
      acknowledgement: ''
    }]);
  };

  const removeAIUseLevel = (id: string) => {
    if (aiUseLevels.length <= 1) return; // Keep at least 1 level
    setAIUseLevels(aiUseLevels.filter(level => level.id !== id));
  };

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
                <Label htmlFor="guidelines-title">Guidelines Title</Label>
                <Input
                  id="guidelines-title"
                  value={guidelinesTitle}
                  onChange={(e) => setGuidelinesTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1 max-w-md">
                <Label htmlFor="assessment-type">Assessment Type</Label>
                <Input
                  id="assessment-type"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  placeholder="e.g., Research Paper, Project, Exam..."
                  className="mt-1"
                />
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
                          value={level.label}
                          onChange={(e) => updateAIUseLevel(level.id, 'label', e.target.value)}
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
                    <div className="font-medium text-primary">AI Assessment Use Levels</div>
                  </th>
                  <th className="text-left p-4 min-w-80 bg-primary/5 border-r">
                    <div className="font-medium text-primary">Instructions to Students</div>
                  </th>
                  <th className="text-left p-4 min-w-64 bg-primary/5 border-r">
                    <div className="font-medium text-primary">Examples</div>
                  </th>
                  <th className="text-left p-4 min-w-64 bg-primary/5">
                    <div className="font-medium text-primary">AI Acknowledgement</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {aiUseLevels.map((level, index) => (
                  <tr key={level.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                    <td className="p-4 align-top border-r bg-accent/20">
                      <Textarea
                        value={level.label}
                        onChange={(e) => updateAIUseLevel(level.id, 'label', e.target.value)}
                        placeholder="AI use level name..."
                        className="min-h-24 resize-none font-medium border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent"
                      />
                    </td>
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.instructions}
                        onChange={(e) => updateAIUseLevel(level.id, 'instructions', e.target.value)}
                        placeholder="Clear instructions for students about what AI use is permitted..."
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />
                    </td>
                    <td className="p-4 align-top border-r">
                      <Textarea
                        value={level.examples}
                        onChange={(e) => updateAIUseLevel(level.id, 'examples', e.target.value)}
                        placeholder="Specific examples of permitted AI use..."
                        className="min-h-32 resize-none text-sm bg-transparent"
                      />
                    </td>
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
              <Button>Save Guidelines</Button>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}