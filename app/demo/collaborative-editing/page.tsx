"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Users, 
  MessageSquare, 
  GitBranch,
  Play,
  Settings,
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import EnhancedDocumentViewer from '@/components/enhanced-document-viewer'
import RealTimeCollaborationEditor from '@/components/real-time-collaboration-editor'
import { toast } from '@/components/ui/use-toast'

// Sample manuscript data
const SAMPLE_MANUSCRIPT = {
  id: "manuscript_001",
  title: "Advanced Machine Learning Techniques in Healthcare Diagnostics",
  content: `Abstract

Healthcare diagnostics have been revolutionized by the application of machine learning techniques. This study presents a comprehensive analysis of advanced machine learning algorithms and their practical applications in medical diagnosis.

Introduction

The integration of artificial intelligence in healthcare has opened new possibilities for accurate and efficient diagnostic procedures. Machine learning algorithms can process vast amounts of medical data to identify patterns that might be overlooked by traditional diagnostic methods.

Methodology

Our research methodology involves the following key components:

1. Data Collection and Preprocessing
We collected medical imaging data from multiple healthcare institutions, ensuring patient privacy and data security. The dataset includes over 10,000 medical images across various diagnostic categories.

2. Algorithm Development
We developed and refined several machine learning models, including:
- Convolutional Neural Networks (CNNs) for image analysis
- Support Vector Machines (SVMs) for classification tasks
- Random Forest algorithms for decision tree analysis

3. Model Training and Validation
Each model was trained using cross-validation techniques to ensure robustness and prevent overfitting. We used a 80-20 split for training and testing data.

Results

Our preliminary results show significant improvements in diagnostic accuracy:
- 95.2% accuracy in detecting pneumonia from chest X-rays
- 87.8% accuracy in identifying diabetic retinopathy from fundus images
- 92.1% accuracy in detecting skin cancer from dermatological images

Discussion

The results demonstrate the potential of machine learning in enhancing healthcare diagnostics. However, several challenges remain, including data privacy concerns, algorithm interpretability, and integration with existing healthcare systems.

Future work will focus on addressing these challenges and expanding the scope of our research to include more medical conditions and imaging modalities.

Conclusion

Machine learning techniques show great promise in revolutionizing healthcare diagnostics. With continued research and development, these technologies can significantly improve patient outcomes and healthcare efficiency.

References

[1] Smith, J. et al. (2023). "AI in Medical Imaging: A Comprehensive Review"
[2] Johnson, M. et al. (2022). "Deep Learning for Healthcare Diagnostics"
[3] Williams, R. et al. (2023). "Ethical Considerations in AI-Powered Medicine"`,
  doi: "10.1000/journal.example.2024.001",
  version: 2,
  previewUrl: "/sample-manuscript.pdf"
}

export default function CollaborativeEditingDemo() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("phase1")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'reviewer' | 'author'>('reviewer')

  // Initialize demo data
  useEffect(() => {
    if (session?.user) {
      // Set user role based on session data or default to reviewer
      const role = (session.user as unknown)?.role || 'reviewer'
      setUserRole(role)
    }
  }, [session])

  const handleSessionCreated = (newSession: unknown) => {
    setSessionId(newSession.id)
    toast({
      title: "Collaboration Session Created",
      description: "Real-time collaboration is now active."
    })
  }

  const getUserPermissions = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          canComment: true,
          canEdit: true,
          canDownload: true,
          canShare: true
        }
      case 'editor':
        return {
          canComment: true,
          canEdit: true,
          canDownload: true,
          canShare: true
        }
      case 'reviewer':
        return {
          canComment: true,
          canEdit: false,
          canDownload: true,
          canShare: false
        }
      case 'author':
        return {
          canComment: true,
          canEdit: true,
          canDownload: true,
          canShare: false
        }
      default:
        return {
          canComment: false,
          canEdit: false,
          canDownload: false,
          canShare: false
        }
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access the collaborative editing system.
            </p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Collaborative Document Editing System
                  </h1>
                  <p className="text-sm text-gray-600">
                    Phase 1 & 2 Implementation Demo
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <Users className="h-3 w-3 mr-1" />
                User: {session.user?.name}
              </Badge>
              <Badge className={`text-sm ${
                userRole === 'admin' ? 'bg-red-100 text-red-800' :
                userRole === 'editor' ? 'bg-blue-100 text-blue-800' :
                userRole === 'reviewer' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Phase 1: Document Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Interactive document viewing</li>
                <li>• Text selection and highlighting</li>
                <li>• Inline commenting system</li>
                <li>• Comment threads and replies</li>
                <li>• User mentions (@username)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Phase 2: Real-time Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Live collaborative editing</li>
                <li>• Real-time cursor tracking</li>
                <li>• Operational transformation</li>
                <li>• Version control system</li>
                <li>• WebSocket integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                Status & Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Comment System Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Real-time Updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Role-based Permissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Demo Interface */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-600" />
                Live Demo Interface
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Sample Manuscript
                </Badge>
                {sessionId && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <Users className="h-3 w-3 mr-1" />
                    Session Active
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phase1" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Phase 1: Document Viewer + Comments
                </TabsTrigger>
                <TabsTrigger value="phase2" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Phase 2: Real-time Collaboration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phase1" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 mb-1">
                        Phase 1: Enhanced Document Viewer
                      </h3>
                      <p className="text-sm text-blue-700 mb-2">
                        This demonstrates the Google Docs-style commenting system. Select any text in the document below to add comments.
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>• Select text to highlight and comment</li>
                        <li>• Use @username to mention other users</li>
                        <li>• Reply to comments to create discussion threads</li>
                        <li>• Mark comments as resolved when addressed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <EnhancedDocumentViewer
                  manuscriptId={SAMPLE_MANUSCRIPT.id}
                  documentTitle={SAMPLE_MANUSCRIPT.title}
                  documentContent={SAMPLE_MANUSCRIPT.content}
                  previewUrl={SAMPLE_MANUSCRIPT.previewUrl}
                  doi={SAMPLE_MANUSCRIPT.doi}
                  version={SAMPLE_MANUSCRIPT.version}
                  userRole={userRole}
                  permissions={getUserPermissions(userRole)}
                  className="bg-white"
                />
              </TabsContent>

              <TabsContent value="phase2" className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-900 mb-1">
                        Phase 2: Real-time Collaborative Editing
                      </h3>
                      <p className="text-sm text-green-700 mb-2">
                        This demonstrates live collaborative editing with real-time updates, cursor tracking, and version control.
                      </p>
                      <ul className="text-xs text-green-600 space-y-1">
                        <li>• Type in the editor to see real-time collaboration</li>
                        <li>• Multiple users can edit simultaneously</li>
                        <li>• Comments are synced across all participants</li>
                        <li>• Version snapshots can be created</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <RealTimeCollaborationEditor
                  manuscriptId={SAMPLE_MANUSCRIPT.id}
                  sessionId={sessionId}
                  onSessionCreated={handleSessionCreated}
                  className="bg-white"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Implementation Notes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Implementation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  Phase 1 Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Enhanced Document Viewer component</li>
                  <li>✅ Text selection and highlighting</li>
                  <li>✅ Inline commenting system</li>
                  <li>✅ Comment threads with replies</li>
                  <li>✅ User mentions and notifications</li>
                  <li>✅ Comment resolution workflow</li>
                  <li>✅ Role-based permissions</li>
                  <li>✅ RESTful API endpoints</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  Phase 2 Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Real-time collaborative editor</li>
                  <li>✅ WebSocket integration (simulated)</li>
                  <li>✅ Live cursor tracking</li>
                  <li>✅ Operational transformation</li>
                  <li>✅ Version control system</li>
                  <li>✅ Conflict resolution</li>
                  <li>✅ Session management</li>
                  <li>✅ Multi-user synchronization</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                This demo showcases a complete Google Docs-style collaborative editing system 
                integrated into the academic journal management platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
