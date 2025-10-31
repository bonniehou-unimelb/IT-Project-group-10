import { Suspense } from "react";
import AIGuidelinesBuilder from '../components/AIGuidelinesBuilder';

export default function App() {
  return (
    <Suspense fallback={null}>
      <AIGuidelinesBuilder />
    </Suspense>
    );
  }