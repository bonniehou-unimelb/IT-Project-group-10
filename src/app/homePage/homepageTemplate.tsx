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
import { useRouter } from 'next/navigation';
import { SideBar } from '../components/sidebar';

import { 
  FileText, Plus, BookOpen, Users, Clock, TrendingUp, ArrowRight, Settings, Bell
} from 'lucide-react';

type UserRole = 'subjectCoord' | 'student' | 'systemAdmin';

/* Defining the attributes for each user type */
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

  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <SideBar />

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-6">
            {/* Homepage welcome Section */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome back, {userName.split(' ')[0]} 👋
                </h1>
                <p className="text-lg text-muted-foreground">
                  {userRole === 'subjectCoord'
                    ? 'Manage your AI guidelines and help students understand appropriate AI use.'
                    : 'View AI guidelines for your assessments.'}
                </p>
              </div>

              {/* Notifications */}
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
            
            {/*Here, we include a quick actions and community templates section*/}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userRole === 'subjectCoord' ? (
                    <>
                      <Button 
                        className="w-full justify-start h-12 bg-blue-600 text-primary-foreground hover:bg-blue-700" 
                        onClick={() => router.push('/templates/new')}
                      >
                        <Plus className="h-4 w-4 mr-3" />
                        Create New AI Guidelines
                      </Button>
                      <Button 
                        className="w-full justify-start h-11" 
                        variant="outline"
                        onClick={() => router.push('/myTemplates')}
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        View My Templates
                      </Button>
                      <Button 
                        className="w-full justify-start h-11" 
                        variant="outline"
                        onClick={() => router.push('/allTemplates')}
                      >
                        <BookOpen className="h-4 w-4 mr-3" />
                        Browse All Templates
                      </Button>
                      <Button 
                        className="w-full justify-start h-11" 
                        variant="outline"
                      >
                        <Users className="h-4 w-4 mr-3" />
                        Manage Subjects
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full justify-start h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                        <FileText className="h-4 w-4 mr-3" />
                        View Active Guidelines
                      </Button>
                      <Button className="w-full justify-start h-11" variant="outline">
                        <Clock className="h-4 w-4 mr-3" />
                        Upcoming Deadlines
                      </Button>
                      <Button className="w-full justify-start h-11" variant="outline">
                        <BookOpen className="h-4 w-4 mr-3" />
                        My Subjects
                      </Button>
                      <Button className="w-full justify-start h-11" variant="outline">
                        <Settings className="h-4 w-4 mr-3" />
                        Submission History
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>


              {/* Community Templates */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Community Templates
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push("/allTemplates")}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* Mock community templates*/}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Research Paper Template</h4>
                        <p className="text-xs text-muted-foreground">Dr. Johnson</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">Science</Badge>
                          <span className="text-xs text-muted-foreground">100 downloads</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">STEM Lab Template</h4>
                        <p className="text-xs text-muted-foreground">Mr. Smith</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">Science</Badge>
                          <span className="text-xs text-muted-foreground">100 downloads</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Creative Writing Template</h4>
                        <p className="text-xs text-muted-foreground">Dr. Han</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">Arts</Badge>
                          <span className="text-xs text-muted-foreground">100 downloads</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Programming Assignment Template</h4>
                        <p className="text-xs text-muted-foreground">Prof. Wang</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">IT</Badge>
                          <span className="text-xs text-muted-foreground">100 downloads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </div>
      </div>
  );
}
