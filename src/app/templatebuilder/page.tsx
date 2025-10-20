"use client";

import React, { useRef, useState, Suspense } from "react";
import AIGuidelinesBuilder from "../components/AIGuidelinesBuilder";
import { Button } from "../components/button";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/alert-dialog";
import Image from "next/image";

type BuilderRef = {
  save: () => Promise<void>; // expose save() from the child
};

export default function App() {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const builderRef = useRef<BuilderRef | null>(null);

  const handleBackClick = () => {
    setShowSaveDialog(true);
  };

  // When user clicks "Save & Continue"
  const handleSave = async () => {
    if (builderRef.current?.save) {
      await builderRef.current.save(); // ✅ triggers AIGuidelinesBuilder.save()
    }
    setShowSaveDialog(false);
    window.history.back();
  };

  // When user clicks "Don't Save"
  const handleDontSave = async () => {
    setShowSaveDialog(false);

    const templateId = window.localStorage.getItem("currentTemplateId");
    if (templateId) {
      await fetch("http://localhost:8000/template/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateId }),
      });
      window.localStorage.removeItem("currentTemplateId");
    }

    window.history.back();
  };

  const handleCancel = () => {
    setShowSaveDialog(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-900 text-primary-foreground border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Image
              src="icons/logo.svg"
              alt="University of Melbourne"
              width={100}
              height={100}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackClick}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">AI Use Scales Builder</h1>
          </div>
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1">
        <Suspense>
          <AIGuidelinesBuilder ref={builderRef} />
        </Suspense>
      </div>

      {/* Save confirmation dialog */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your work?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save your progress
              before leaving this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleDontSave}>
              Don't Save
            </Button>
            <AlertDialogAction onClick={handleSave}>
              Save & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
