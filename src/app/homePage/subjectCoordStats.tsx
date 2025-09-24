"use client";

interface Props {
  data: any;
}

export default function SubjectCoordStats({ data }: Props) {
  return (
    <div>
      <h2>Subject Coordinator Stats</h2>
      <p>My Templates: {data.myTemplates}</p>
      <p>Active Templates: {data.activeTemplates}</p>
      <p>Active Subjects: {data.activeSubjects}</p>
    </div>
  );
}
