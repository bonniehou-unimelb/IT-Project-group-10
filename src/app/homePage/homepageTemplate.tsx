"use client";
import SubjectCoordStats from './subjectCoordStats';
import StudentStats from './studentStats';
import SystemAdminStats from './systemAdminStats';
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
  FileText, Plus, BookOpen, Users, Clock, TrendingUp, ArrowRight, Settings, Bell
} from 'lucide-react';

type UserRole = 'subjectCoord' | 'student' | 'systemAdmin';

/* Defining the structure of data for each role */
interface SubjectCoordData {
  myTemplates: number;
  activeTemplates: number;
  activeSubjects: number;
  subjects: any[];
  allSubjects: any[];
}

interface StudentData {
  enrolledSubjects: number;
  assignedTemplates: number;
  upcomingDeadlines: number;
  subjects: any[];
  allSubjects: any[];
}

interface SystemAdminData {
  myTemplates: number;
}

type HomePageData =
  | { role: 'subjectCoord'; data: SubjectCoordData }
  | { role: 'student'; data: StudentData }
  | { role: 'systemAdmin'; data: SystemAdminData };

interface HomePageProps {
  onNavigate: (page: string) => void;
  userRole: UserRole;
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

  /* Mock subjects data */
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
        { name: 'Elements of Data Processing', code: 'COMP20008', templates: 2, deadline: 'Tomorrow', semester: 'Semester 1 2025' },
        { name: 'Linear Algebra', code: 'MAST10007', templates: 1, deadline: '3 days', semester: 'Semester 1 2025' },
      ]
    },

    systemAdmin: {
      allSubjects: [
        { name: 'Foundations of Computing', code: 'COMP10001', students: 28, templates: 3, semester: 'Semester 1 2025' },
      ]
    }
  });

  /* Mock home page stats data */
  const mockData = {
    subjectCoord: {
      myTemplates: 12,
      activeTemplates: 8,
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
    },
    systemAdmin: {
      myTemplates: 2
    }
  };

  // Assign role-based data
  let data: HomePageData;

  switch (userRole) {
    case 'subjectCoord':
      data = { role: 'subjectCoord', data: mockData.subjectCoord };
      break;
    case 'student':
      data = { role: 'student', data: mockData.student };
      break;
    case 'systemAdmin':
      data = { role: 'systemAdmin', data: mockData.systemAdmin };
      break;
  }

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
    <div className="flex-1">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {userName.split(' ')[0]} 👋
            </h1>

            <p className="text-lg text-muted-foreground">
              {userRole === 'subjectCoord'
                ? 'Manage your AI guidelines and help students understand appropriate AI use.'
                : 'View AI guidelines for your assessments.'
              }
            </p>

            {/* Quick Stats */}
            {data.role === 'subjectCoord' && (
              <SubjectCoordStats data={data.data} />
            )}
            {data.role === 'student' && (
              <StudentStats data={data.data} />
            )}
            {data.role === 'systemAdmin' && (
              <SystemAdminStats data={data.data} />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

      </div>
    </div>
  );
}
