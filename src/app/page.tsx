import AIGuidelinesBuilder from './components/AIGuidelinesBuilder';
import {Suspense} from 'react';
/*
export default function Page() {
  return <div>Test</div>;
}
  */

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-r from-primary to-blue-700 text-primary-foreground border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold">AI Use Scales Builder</h1>
        </div>
      </div>
      <div className="flex-1">
        <Suspense>
          <AIGuidelinesBuilder />
        </Suspense>
      </div>
    </div>
  );
}
