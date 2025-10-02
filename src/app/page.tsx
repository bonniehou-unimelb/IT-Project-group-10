import AIGuidelinesBuilder from './components/AIGuidelinesBuilder';
import {Suspense} from 'react';
import Image from 'next/image';

export default function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-r from-primary to-blue-900 text-primary-foreground border-b">
        <div className="px-6 py-6 flex items-center gap-4">
        <Image src="icons/logo.svg" alt="University of Melbourne" width={100} height={100} />
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
