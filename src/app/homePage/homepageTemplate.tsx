"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/dialog';
import { ScrollArea } from '../components/scroll-area';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { useRouter } from 'next/navigation';
import { SideBar } from '../components/sidebar';
import { TopBar } from '../components/topbar';
import { useAuth } from "../authentication/auth";

const API_BACKEND_URL = "http://localhost:8000";

import { 
  FileText, Plus, BookOpen, Users, TrendingUp, ArrowRight, Settings,
} from 'lucide-react';

type UserRole = 'COORDINATOR' | 'STUDENT' | 'ADMIN' | 'STAFF';

// Defining the attributes for each user type 
interface SubjectCoordData {
  myTemplates: number;
  activeTemplates: number;
  activeSubjects: number;
  subjects: Subject[];
  allSubjects: Subject[];
}

interface StudentData {
  enrolledSubjects: number;
  assignedTemplates: number;
  upcomingDeadlines: number;
  subjects: Subject[];
  allSubjects: Subject[];
}

interface SystemAdminData {
  myTemplates: number;
}

interface Template {
  name: string;
  status: string;
  assignedDate: string;
  dueDate: string;
}

interface Subject {
  name: string;
  code: string;
  students?: number;
  templates?: number;
  assignedTemplates?: Template[];
}

type HomePageData =
  | { role: 'COORDINATOR'; data: SubjectCoordData }
  | { role: 'STAFF'; data: SubjectCoordData }
  | { role: 'STUDENT'; data: StudentData }
  | { role: 'ADMIN'; data: SystemAdminData };


interface CoordinatorSubject {
  id: number;
  name: string;
  subjectCode: string;
}

interface BackendTemplateSummary {
  templateId: number;
  name: string;
  version: number;
  subjectCode: string;
  year: number;
  semester: number;
  ownerName: string;
  isPublishable: boolean;
  isTemplate: boolean;
}

/* Template summary */
interface SubjectTemplateLite {
  templateId: number;
  name: string;
  version: number;
  subjectCode: string;
  year: number;
  semester: number;
  isPublishable: boolean;
  isTemplate: boolean;
  ownerName: string;
}

/* Subject + its templates for the Coordinator box */
interface SubjectWithTemplates {
  subject: CoordinatorSubject;
  templates: SubjectTemplateLite[];
  templatesCount: number;
  students?: number;  
}

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// CSRF Cookie management
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}
async function ensureCsrf(): Promise<string | null> {
  let token = getCookie("csrftoken");
  if (!token) {
    const res = await fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" });
    try {
      const body = await res.json();
      token = body?.csrfToken || getCookie("csrftoken");
    } catch {;}
  }
  return token;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject>({
    name: '',
    code: '',
    students: 0,
    templates: 0,
    assignedTemplates: []
  });
  const [isSubjectDetailOpen, setIsSubjectDetailOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    students: 0,
    templates: 0,
    assignedTemplates: []
  });

  const router = useRouter();
  const { user, pageLoading, refresh, logout } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [role, setRole] = useState<string>("");

  // Reroute to log in page if user session invalid
  useEffect(() => {
    if (!pageLoading && !user) router.replace("/login");
  }, [pageLoading, user, router]);

  useEffect(() => { refresh(); }, []); 

  useEffect(() => {
    if (user?.username) setUsername(user.username);
    if (user?.role) setRole(user.role);
  }, [user]);

  // Fetch cookie for user session
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BACKEND_URL}/token/`, { credentials: "include" })
      .catch(() => {;});
  }, [user]);

  //API integration for displaying subjects and template summary for Coordinators
  const [coordinatorSubjects, setCoordinatorSubjects] = useState<SubjectWithTemplates[] | null>(null);
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordError, setCoordError] = useState<string>("");

  async function fetchTaughtSubjects(u: string): Promise<CoordinatorSubject[]> {
    const res = await fetch(`${API_BACKEND_URL}/info/taught_subjects/?username=${encodeURIComponent(u)}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load taught subjects");
    const body = await res.json();
    return (body?.taught_subjects || []) as CoordinatorSubject[];
  }

  async function fetchMyTemplateSummaries(u: string): Promise<SubjectTemplateLite[]> {
    const res = await fetch(`${API_BACKEND_URL}/template/summary/?username=${encodeURIComponent(u)}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load template summaries");
    const body = await res.json();
    const rows = (body?.templates || []) as BackendTemplateSummary[];
    return rows.map(r => ({
      templateId: r.templateId,
      name: r.name,
      version: r.version,
      subjectCode: r.subjectCode,
      year: r.year,
      semester: r.semester,
      isPublishable: r.isPublishable,
      isTemplate: r.isTemplate,
      ownerName: r.ownerName,
    }));
  }

  useEffect(() => {
    if (!user?.username || !(role === 'COORDINATOR' || role === 'STAFF')) return;
    let cancelled = false;

    (async () => {
      try {
        setCoordError("");
        setCoordLoading(true);

        const [subjects, templates] = await Promise.all([
          fetchTaughtSubjects(user.username),
          fetchMyTemplateSummaries(user.username),
        ]);

        // group templates by subjectCode
        const byCode = new Map<string, SubjectTemplateLite[]>();
        for (const t of templates) {
          if (!t.subjectCode) continue;
          if (!byCode.has(t.subjectCode)) byCode.set(t.subjectCode, []);
          byCode.get(t.subjectCode)!.push(t);
        }

        // join and include only those with >=1 template
        const joined: SubjectWithTemplates[] = subjects
          .map((s) => {
            const tpls = (byCode.get(s.subjectCode) || []).sort(
              (a, b) => b.year - a.year || b.semester - a.semester || b.version - a.version
            );
            return {
              subject: s,
              templates: tpls,
              templatesCount: tpls.length,
            };
          })
          .filter(row => row.templatesCount > 0);

        if (!cancelled) setCoordinatorSubjects(joined);
      } catch (e: any) {
        if (!cancelled) setCoordError(e?.message || "Failed to load Coordinator data");
      } finally {
        if (!cancelled) setCoordLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.username, role]);
  /** ---------------------------------------------------------- */

  /* Mock subjects data (kept for Student/Admin UI) */
  const [subjectsData, setSubjectsData] = useState({
    subjectCoord: {
      allSubjects: [
        { name: 'Foundations of Computing', code: 'COMP10001', students: 28, templates: 3, 
          assignedTemplates: [
            { name: 'Assignment 1', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
            { name: 'Assignment 2', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
          ]
        },
        { name: 'Models of Computation', code: 'COMP30026', students: 45, templates: 2,
          assignedTemplates: [
            { name: 'Assignment 1', status: 'inactive', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
            { name: 'Assignment 2', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
          ]
        },
        { name: 'Competition and Strategy', code: 'ECON20005', students: 32, templates: 3, assignedTemplates: [
            { name: 'Assignment 1', status: 'inactive', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
          ]},
      ]
    },
    student: {
      allSubjects: [
        { name: 'Elements of Data Processing', code: 'COMP20008', templates: 2, 
          assignedTemplates: [
            { name: 'Assignment 1', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
            { name: 'Assignment 2', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
          ]
        },
        { name: 'Linear Algebra', code: 'MAST10007', templates: 1,
          assignedTemplates: [
            { name: 'Assignment 1', status: 'inactive', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
            { name: 'Assignment 2', status: 'active', assignedDate: '2025-12-31', dueDate: '2025-12-31' },
          ]
        },
      ]
    },

    systemAdmin: {
      allSubjects: [
        { name: 'Foundations of Computing', code: 'COMP10001', students: 28, templates: 3},
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

  /* Assign role-based data (kept for Student/Admin UI) */
  let data: HomePageData = { role: "STUDENT", data: mockData.student };

  switch (role) {
    case 'COORDINATOR':
      data = { role: 'COORDINATOR', data: mockData.subjectCoord };
      break;
    case 'STUDENT':
      data = { role: 'STUDENT', data: mockData.student };
      break;
    case 'ADMIN':
      data = { role: 'ADMIN', data: mockData.systemAdmin };
      break;
    case 'STAFF':
      data = { role: 'COORDINATOR', data: mockData.subjectCoord };
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
        ...prev.subjectCoord,
        allSubjects: [...prev.subjectCoord.allSubjects, newSubjectData]
      }
    }));

    setNewSubject({
      name: '',
      code: '',
      students: 0,
      templates: 0,
      assignedTemplates: []
    });

    setIsAddSubjectDialogOpen(false);
  };

  const handleViewSubjectDetails = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsSubjectDetailOpen(true);
  };

  if (role === "") {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <SideBar />
        {/* Main column */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <TopBar pageName="Homepage" subtitle=""/>
          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-7xl mx-auto p-6">
              {/* Homepage welcome Section */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Welcome back 👋
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {(role === 'COORDINATOR' || role === 'STAFF')
                      ? 'Manage your AI guidelines and help students understand appropriate AI use.'
                      : 'View AI guidelines for your assessments.'}
                  </p>
                </div>
              </div>

              {/*Subject COORDINATORs: Quick Actions and Community Templates */}
              {(role === 'COORDINATOR' || role === 'STAFF') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                  {/* Quick actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        className="w-full justify-start h-12 bg-blue-600 text-primary-foreground hover:bg-blue-700"
                        onClick={() => router.push('/templatebuilder')}
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
                        onClick={() => router.push('/communityTemplates')}
                      >
                        <BookOpen className="h-4 w-4 mr-3" />
                        Browse All Templates
                      </Button>
                      <Button className="w-full justify-start h-11" variant="outline">
                        <Users className="h-4 w-4 mr-3" />
                        Manage Subjects
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Community templates */}
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
                          onClick={() => router.push('/communityTemplates')}
                        >
                          View All
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Mock community templates */}
                      <div className="space-y-3">
                        {[
                          { title: 'Research Paper Template', author: 'Dr. Johnson', tag: 'Science' },
                          { title: 'STEM Lab Template', author: 'Mr. Smith', tag: 'Science' },
                          { title: 'Creative Writing Template', author: 'Dr. Han', tag: 'Arts' },
                          { title: 'Programming Assignment Template', author: 'Prof. Wang', tag: 'IT' },
                        ].map((tpl: { title: string; author: string; tag: string}, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{tpl.title}</h4>
                              <p className="text-xs text-muted-foreground">{tpl.author}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {tpl.tag}
                                </Badge>
                                <span className="text-xs text-muted-foreground">100 downloads</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Admin view: Quick Actions + System Overview */}
              {role === 'ADMIN' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Quick actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Admin Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        className="w-full justify-start h-12 bg-blue-600 text-primary-foreground hover:bg-blue-700"
                        onClick={() => router.push('/admin/users')}
                      >
                        <Users className="h-4 w-4 mr-3" />
                        Manage Users
                      </Button>
                      <Button
                        className="w-full justify-start h-11"
                        variant="outline"
                        onClick={() => router.push('/admin/subjects')}
                      >
                        <BookOpen className="h-4 w-4 mr-3" />
                        Manage Subjects
                      </Button>
                      <Button
                        className="w-full justify-start h-11"
                        variant="outline"
                        onClick={() => router.push('/allTemplates')}
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        Browse All Templates
                      </Button>
                      <Button
                        className="w-full justify-start h-11"
                        variant="outline"
                        onClick={() => router.push('/admin/settings')}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Platform Settings
                      </Button>
                    </CardContent>
                  </Card>

                  {/* System Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        System Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Total Users</p>
                          <p className="text-2xl font-semibold">—</p>
                        </div>
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Subjects</p>
                          <p className="text-2xl font-semibold">—</p>
                        </div>
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Templates</p>
                          <p className="text-2xl font-semibold">{mockData.systemAdmin.myTemplates}</p>
                        </div>
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-1">Active Coordinators</p>
                          <p className="text-2xl font-semibold">—</p>
                        </div>
                      </div>

                      {/* Recent activity (placeholder list) */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                        <div className="space-y-2">
                          {[
                            { kind: 'User added', detail: 'coordinator alice.han', when: '2h ago' },
                            { kind: 'Template published', detail: 'COMP30026 A1 v3', when: '1d ago' },
                            { kind: 'Subject created', detail: 'COMP20008', when: '3d ago' },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{row.kind}</p>
                                <p className="text-xs text-muted-foreground">{row.detail}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">{row.when}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}


              {/*Students: AI Guidelines grouped by subject*/}
              {role === 'STUDENT' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      My AI Guidelines Templates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      View all AI use guidelines assigned to you, organized by subject
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.role === 'STUDENT'             
                        ? data.data.allSubjects.map((subject: Subject, subjectIndex: number) => (
                        <Card key={subjectIndex} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{subject.name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {subject.code}
                                </p>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            {subject.assignedTemplates && subject.assignedTemplates.filter(t => t.status === 'active').length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium">AI Guidelines</span>
                                  <Badge variant="outline" className="text-xs">
                                    {subject.assignedTemplates.filter(t => t.status === 'active').length} active
                                  </Badge>
                                </div>

                                <div className="space-y-2">
                                  {subject.assignedTemplates
                                    .filter(template => template.status === 'active')
                                    .map((template: Template, templateIndex: number) => (
                                      <div key={templateIndex} className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                          <h6 className="text-sm font-medium">{template.name}</h6>
                                          <p className="text-xs text-muted-foreground">
                                            Due: {new Date(template.dueDate).toLocaleDateString()}
                                          </p>
                                        </div>
                                        <Button size="sm" variant="outline" className="text-xs h-8">
                                          View
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                                <Button size="sm" variant="outline" className="w-full mt-3">
                                  View All Templates
                                  <ArrowRight className="h-3 w-3 ml-2" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No active guidelines for this subject</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )) : null}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subjects overview */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {(role === 'COORDINATOR' || role === 'STAFF') ? 'My Subjects' : 'Enrolled Subjects'}
                    </CardTitle>

                    {/*View all subjects */}
                    <Dialog open={isSubjectsDialogOpen} onOpenChange={setIsSubjectsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View All
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <DialogTitle>
                                {(role === 'COORDINATOR' || role === 'STAFF')
                                  ? 'All My Subjects'
                                  : 'All Enrolled Subjects'}
                              </DialogTitle>
                              <DialogDescription>
                                {(role === 'COORDINATOR' || role === 'STAFF')
                                  ? 'View and manage all subjects you are currently teaching.'
                                  : 'View all subjects you are currently enrolled in.'}
                              </DialogDescription>
                            </div>

                            {/* Add subject as subject COORDINATOR*/}
                            {(role === 'COORDINATOR' || role === 'STAFF') && (
                              <Dialog
                                open={isAddSubjectDialogOpen}
                                onOpenChange={setIsAddSubjectDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Subject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Add New Subject</DialogTitle>
                                    <DialogDescription>
                                      Create a new subject that you'll be teaching.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="subject-name">Subject Name</Label>
                                      <Input
                                        id="subject-name"
                                        placeholder="e.g., Foundations of Computing"
                                        value={newSubject.name}
                                        onChange={(e) =>
                                          setNewSubject((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="subject-code">Subject Code</Label>
                                      <Input
                                        id="subject-code"
                                        placeholder="e.g., COMP10001"
                                        value={newSubject.code}
                                        onChange={(e) =>
                                          setNewSubject((prev) => ({
                                            ...prev,
                                            code: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={() => setIsAddSubjectDialogOpen(false)}
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleAddSubject}
                                        className="flex-1"
                                        disabled={!newSubject.name || !newSubject.code}
                                      >
                                        Add Subject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </DialogHeader>

                        {/* Scrollable subject List */}
                        <ScrollArea className="h-[60vh] pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(role === 'COORDINATOR' || role === 'STAFF') ? (
                              coordLoading ? (
                                <div className="p-3 text-sm text-muted-foreground">Loading subjects…</div>
                              ) : coordError ? (
                                <div className="p-3 text-sm text-red-600">Error: {coordError}</div>
                              ) : (coordinatorSubjects?.length ?? 0) === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground">No subjects with templates yet.</div>
                              ) : (
                                coordinatorSubjects!.map(({ subject, templates }, index) => (
                                  <Card
                                    key={subject.id ?? index}
                                    className="hover:shadow-md transition-shadow"
                                  >
                                    <CardContent className="p-4">
                                      <div className="space-y-3">
                                        <div>
                                          <h4 className="font-medium">{subject.name}</h4>
                                          <p className="text-sm text-muted-foreground">{subject.subjectCode}</p>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                          <Badge variant="secondary">
                                            {templates.length} templates
                                          </Badge>
                                        </div>

                                        <div className="space-y-2">
                                          {templates.slice(0, 3).map((t) => (
                                            <div key={t.templateId} className="text-sm text-muted-foreground">
                                              {t.name} • {t.year} S{t.semester} • v{t.version}
                                            </div>
                                          ))}
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                              handleViewSubjectDetails({
                                                name: subject.name,
                                                code: subject.subjectCode,
                                                students: undefined,
                                                templates: templates.length,
                                                assignedTemplates: templates.map(t => ({
                                                  name: t.name,
                                                  status: "active",
                                                  assignedDate: `${t.year}-01-01`,
                                                  dueDate: `${t.year}-12-31`,
                                                })),
                                              })
                                            }
                                          >
                                            View Details
                                          </Button>
                                          <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push('/myTemplates')}>
                                            Manage Templates
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )
                            ) : (
                              // Student branch unchanged
                              data.role === 'STUDENT'
                                ? data.data.allSubjects.map((subject: Subject, index: number) => (
                                    <Card key={index} className="hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          <div>
                                            <h4 className="font-medium">{subject.name}</h4>
                                            <p className="text-sm text-muted-foreground">{subject.code}</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                : null
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>

                {/*Subject grid */}
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(role === 'COORDINATOR' || role === 'STAFF') ? (
                      coordLoading ? (
                        <div className="p-3 text-sm text-muted-foreground">Loading subjects…</div>
                      ) : coordError ? (
                        <div className="p-3 text-sm text-red-600">Error: {coordError}</div>
                      ) : (coordinatorSubjects?.length ?? 0) === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground">No subjects with templates yet.</div>
                      ) : (
                        coordinatorSubjects!.map(({ subject, templates }) => (
                          <Card
                            key={subject.id}
                            className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group border-l-4 border-l-primary/20 hover:border-l-primary"
                          >
                            <CardContent className="p-5">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                                    {subject.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground font-medium">
                                    {subject.subjectCode}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20"
                                  >
                                    {templates.length} templates
                                  </Badge>
                                </div>

                                <div className="pt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                                    onClick={() =>
                                      handleViewSubjectDetails({
                                        name: subject.name,
                                        code: subject.subjectCode,
                                        students: undefined,
                                        templates: templates.length,
                                        assignedTemplates: templates.map(t => ({
                                          name: t.name,
                                          status: "active",
                                          assignedDate: `${t.year}-01-01`,
                                          dueDate: `${t.year}-12-31`,
                                        })),
                                      })
                                    }
                                  >
                                    View Details
                                    <ArrowRight className="h-3 w-3 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )
                    ) : (
                      // Student branch unchanged
                      data.role === 'STUDENT'
                        ? data.data.subjects.map((subject: Subject, index: number) => (
                            <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group border-l-4 border-l-primary/20 hover:border-l-primary">
                              <CardContent className="p-5">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                                      {subject.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {subject.code}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        : null
                    )}
                  </div>
                </CardContent>
              </Card>

              {/*Subject details */}
              <Dialog open={isSubjectDetailOpen} onOpenChange={setIsSubjectDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6">
                      {/* Subject info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Subject Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Subject Code</p>
                            <p className="font-medium">{selectedSubject.code}</p>
                          </div>

                          {(role === 'COORDINATOR' || role === 'STAFF') && (
                            <div>
                              <p className="text-sm text-muted-foreground">Templates</p>
                              <p className="font-medium">{selectedSubject.templates ?? 0}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Assigned templates */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Assigned AI Guidelines Templates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const assigned = selectedSubject.assignedTemplates ?? [];
                            const activeTemplates = assigned.filter(t => t.status === 'active');
                            const inactiveTemplates = assigned.filter(t => t.status === 'inactive');

                            if (assigned.length === 0) return null;

                            return (
                              <div className="space-y-4">
                                {/* Active templates */}
                                {activeTemplates.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Active Templates ({activeTemplates.length})
                                    </h4>
                                    <div className="grid gap-3">
                                      {activeTemplates.map((template, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <h5 className="font-medium text-green-900">{template.name}</h5>
                                            <p className="text-sm text-green-700">
                                              Assigned: {new Date(template.assignedDate).toLocaleDateString()} •
                                              Due: {new Date(template.dueDate).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <Badge className="bg-green-100 text-green-800 border-green-300">
                                            Active
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Inactive templates */}
                                {inactiveTemplates.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      Inactive Templates ({inactiveTemplates.length})
                                    </h4>
                                    <div className="grid gap-3">
                                      {inactiveTemplates.map((template, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <h5 className="font-medium text-gray-700">{template.name}</h5>
                                            <p className="text-sm text-gray-600">
                                              Assigned: {new Date(template.assignedDate).toLocaleDateString()} •
                                              Due: {new Date(template.dueDate).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                            Inactive
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {assigned.length === 0 && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No AI guidelines templates assigned to this subject yet.</p>
                                    {(role === 'COORDINATOR' || role === 'STAFF') && (
                                      <Button className="mt-3" variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Assign Template
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {(role === 'COORDINATOR' || role === 'STAFF') && (
                        <div className="flex gap-2">
                          <Button className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Assign New Template
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Subject
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
