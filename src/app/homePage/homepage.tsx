import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Avatar, AvatarFallback } from '../components/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/dialog';
import { ScrollArea } from '../components/scroll-area';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { 
  FileText, 
  Plus, 
  BookOpen, 
  Users, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Settings,
  Bell
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
  userRole: 'subjectCoord' | 'student';
  userName: string;
}

export default function HomePage({ onNavigate, userRole, userName }: HomePageProps) {
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    semester: 'Semester 1 2025',
    students: 0,
    templates: 0
  });
  
  // Mock data, add real data from the database
  const [subjectsData, setSubjectsData] = useState({
    subjectCoord: {
      allSubjects: [
        { name: 'Foundations of Computing', code: 'COMP10001', students: 28, templates: 3, semester: 'Semester 1 2025' },
        { name: 'Models of Computation', code: 'COMP30026', students: 45, templates: 2, semester: 'Semester 1 2025' },
        { name: 'Competition and Strategy', code: 'ECON20005', students: 32, templates: 3, semester: 'Semester 1 2025' },
 
      ]
    },
    student: {
      allSubjects: [
        { name: 'Literature Studies', code: 'LIT201', instructor: 'Dr. Smith', templates: 2, deadline: 'Tomorrow', semester: 'Semester 1 2025' },
        { name: 'Chemistry 101', code: 'CHEM101', instructor: 'Prof. Johnson', templates: 1, deadline: '3 days', semester: 'Semester 1 2025' },
        { name: 'Business Ethics', code: 'BUS301', instructor: 'Dr. Williams', templates: 2, deadline: '1 week', semester: 'Semester 1 2025' },
        { name: 'Statistics', code: 'STAT200', instructor: 'Dr. Brown', templates: 1, deadline: '2 weeks', semester: 'Semester 1 2025' },
        { name: 'Computer Science Fundamentals', code: 'CS101', instructor: 'Dr. Garcia', templates: 3, deadline: '3 weeks', semester: 'Semester 1 2025' },
        { name: 'Introduction to Philosophy', code: 'PHIL101', instructor: 'Prof. Lee', templates: 1, deadline: '1 month', semester: 'Semester 1 2025' },
        { name: 'Art History', code: 'ART201', instructor: 'Dr. Chen', templates: 2, deadline: '2 weeks', semester: 'Semester 1 2025' },
        { name: 'Calculus I', code: 'MATH151', instructor: 'Prof. Davis', templates: 4, deadline: '5 days', semester: 'Semester 1 2025' }
      ]
    }
  });

  const mockData = {
    subjectCoord: {
      myTemplates: 12,
      assignedTemplates: 8,
      activeSubjects: 5,
      subjects: subjectsData.subjectCoord.allSubjects.slice(0, 3),
      allSubjects: subjectsData.subjectCoord.allSubjects
    },
    student: {
      enrolledSubjects: 4,
      assignedTemplates: 6,
      upcomingDeadlines: 2,
      subjects: subjectsData.student.allSubjects.slice(0, 4),
      allSubjects: subjectsData.student.allSubjects
    }
  };

  const data = mockData[userRole];

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.code) return;
    
    const newSubjectData = {
      ...newSubject,
      students: newSubject.students || 0,
      templates: newSubject.templates || 0
    };
    
    setSubjectsData(prev => ({
      ...prev,
      subjectCoord: {
        allSubjects: [...prev.subjectCoord.allSubjects, newSubjectData]
      }
    }));
    
    setNewSubject({
      name: '',
      code: '',
      semester: 'Semester 1 2025',
      students: 0,
      templates: 0
    });
    
    setIsAddSubjectDialogOpen(false);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto p-6">
      {/* Welcome Section for all users */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back, {userName}
            </h1>
            <p className="text-muted-foreground">
              {userRole === 'subjectCoord' 
                ? 'Manage your AI guidelines and help students understand appropriate AI use.'
                : 'Stay up to date with AI guidelines for your assessments and coursework.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}