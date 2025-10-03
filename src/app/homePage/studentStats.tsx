import { Card, CardContent } from '../components/card';

export default function studentStats({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

      <Card><CardContent>Enrolled Subjects: {data.enrolledSubjects}</CardContent></Card>
      <Card><CardContent>Assigned Templates: {data.assignedTemplates}</CardContent></Card>
      <Card><CardContent>Upcoming Deadlines: {data.upcomingDeadlines}</CardContent></Card>
      <Card><CardContent>subjects: {data.subjects}</CardContent></Card>
      <Card><CardContent>All Subjects: {data.allSubjects}</CardContent></Card>

    </div>
  );
}