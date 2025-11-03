import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import { Copy } from 'lucide-react';

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

interface AITemplateRepositoryProps {
  onSelectTemplate: (template: TemplateScale) => void;
}

export default function AITemplateRepository({ onSelectTemplate }: AITemplateRepositoryProps) {
  const templateScales: TemplateScale[] = [
    {
      id: 'base-template',
      name: 'Base Template',
      description: 'Standard scale',
      category: 'Writing',
      levels: [
        {
        label: 'No AI Use Permitted',
        instructions: 'The assessment is completeted entirely without AI assistance. This level ensures that students rely solely on their knowledge, understanding, and skills. AI must not be used at any point during the assessment.',
        examples: 'Traditional exams, in-class essays, mathematical problem-solving without computational aids, original creative writing.',
        acknowledgement: ''
      },
      {
        label: 'AI for Research & Brainstorming Only',
        instructions: 'instructions You may use AI tools for initial research, topic exploration, and brainstorming ideas. However, all analysis, writing, and final work must be your own.',
        examples: 'Using ChatGPT to understand complex topics, generating research questions, exploring different perspectives on a subject.',
        acknowledgement: ''
      },
      {
        label: 'AI as Writing Assistant',
        instructions: 'AI tools may be used to assist with writing tasks such as grammar checking, style suggestions, and structural feedback. The core ideas and arguments must be your own.',
        examples: 'Using Grammarly for editing, ChatGPT for feedback on draft structure, AI tools for citation formatting.',
        acknowledgement: ''
      },
      {
        label: 'Collaborative AI Use Encouraged',
        instructions: 'AI tools are encouraged as collaborative partners. You may use AI for research, drafting, analysis, and refinement while demonstrating critical evaluation of AI outputs.',
        examples: 'Co-writing with AI, using AI for data analysis, AI-assisted coding projects, collaborative problem-solving with AI.',
        acknowledgement: ''
      }
        ]
    },
  ];

  const categories = Array.from(new Set(templateScales.map(scale => scale.category)));

  return (
    <div className="w-80 border-r bg-muted/30 h-full">
      <div className="p-4 border-b">
        <h3 className="font-medium">AI Use Scale Repository</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select predefined scales to add to your guidelines
        </p>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-sm font-medium text-primary mb-3">{category}</h4>
              <div className="space-y-3">
                {templateScales
                  .filter(scale => scale.category === category)
                  .map(scale => (
                    <Card key={scale.id} className="hover:shadow-sm transition-shadow">
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm">{scale.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {scale.description}
                            </p>
                            <Badge variant="secondary" className="text-xs mt-2">
                              {scale.levels.length} levels
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => onSelectTemplate(scale)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use This Scale
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}