"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Heart, 
  FileText, 
  Award,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Globe,
  Star,
  Microscope,
  Stethoscope
} from "lucide-react"

export default function SmartSystemsPage() {
  const clinicalAreas = [
    {
      title: "Digital Health Technologies",
      description: "Innovative digital solutions transforming patient care",
      icon: <Activity className="h-6 w-6" />,
      color: "blue",
      topics: [
        "Telemedicine platforms and virtual consultations",
        "Mobile health (mHealth) applications",
        "Wearable device integration in clinical practice",
        "Electronic health record (EHR) optimization"
      ],
      recentCount: 23
    },
    {
      title: "Clinical Decision Support",
      description: "AI-powered systems enhancing medical decision-making",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "green",
      topics: [
        "Machine learning diagnostic algorithms",
        "Clinical prediction models",
        "Risk stratification systems",
        "Evidence-based treatment recommendations"
      ],
      recentCount: 18
    },
    {
      title: "Patient Monitoring Systems",
      description: "Advanced monitoring technologies for improved outcomes",
      icon: <Heart className="h-6 w-6" />,
      color: "red",
      topics: [
        "Remote patient monitoring solutions",
        "Real-time vital sign tracking",
        "ICU monitoring technologies",
        "Home-based care systems"
      ],
      recentCount: 31
    },
    {
      title: "Medical Imaging & Diagnostics",
      description: "Cutting-edge imaging technologies and analysis",
      icon: <Eye className="h-6 w-6" />,
      color: "purple",
      topics: [
        "AI-enhanced medical imaging",
        "Radiological automation systems",
        "Point-of-care diagnostic devices",
        "Image analysis and interpretation tools"
      ],
      recentCount: 27
    }
  ]

  const getColorClass = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50",
      red: "border-red-200 bg-red-50",
      purple: "border-purple-200 bg-purple-50"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      red: "text-red-600",
      purple: "text-purple-600"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const recentStudies = [
    {
      title: "AI-Powered Early Detection of Sepsis in Emergency Departments",
      authors: ["Dr. Sarah Kim", "Prof. Michael Chen", "Dr. Lisa Rodriguez"],
      institution: "Johns Hopkins Medical Center",
      type: "Clinical Trial",
      status: "Completed",
      participants: 2847,
      duration: "18 months",
      outcome: "35% reduction in sepsis-related mortality",
      publishedDate: "2025-05-15"
    },
    {
      title: "Remote Cardiac Monitoring Using Wearable IoT Devices",
      authors: ["Dr. James Wilson", "Dr. Anna Petrov", "Prof. David Lee"],
      institution: "Mayo Clinic Research Center",
      type: "Observational Study",
      status: "Ongoing",
      participants: 1523,
      duration: "24 months",
      outcome: "Interim results show 42% improvement in early detection",
      publishedDate: "2025-06-01"
    },
    {
      title: "Machine Learning-Based Diabetic Retinopathy Screening",
      authors: ["Dr. Maria Santos", "Prof. Robert Kim", "Dr. Alex Johnson"],
      institution: "Stanford Medical School",
      type: "Validation Study",
      status: "Published",
      participants: 5641,
      duration: "12 months",
      outcome: "96.8% accuracy in automated screening",
      publishedDate: "2025-04-22"
    }
  ]

  const submissionGuidelines = [
    {
      category: "Study Design Requirements",
      requirements: [
        "Clear clinical question or hypothesis",
        "Appropriate control groups or comparators",
        "Adequate sample size with power calculation",
        "Standardized outcome measures"
      ]
    },
    {
      category: "Technology Documentation",
      requirements: [
        "Detailed system specifications",
        "Validation methodology",
        "Performance metrics and benchmarks",
        "Safety and security protocols"
      ]
    },
    {
      category: "Clinical Implementation",
      requirements: [
        "Real-world deployment evidence",
        "Workflow integration assessment",
        "User acceptance and usability data",
        "Cost-effectiveness analysis"
      ]
    },
    {
      category: "Regulatory & Ethical",
      requirements: [
        "IRB/Ethics committee approval",
        "FDA or equivalent regulatory status",
        "Data privacy and security compliance",
        "Informed consent documentation"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Clinical Studies & Smart Systems
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Advancing healthcare through intelligent clinical trials and innovative medical technologies
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Clinical Study
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Browse Studies
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">127</div>
              <div className="text-sm text-blue-700">Published Studies</div>
              <div className="text-xs text-blue-600 mt-1">+23 this year</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">45,000+</div>
              <div className="text-sm text-green-700">Study Participants</div>
              <div className="text-xs text-green-600 mt-1">Across all trials</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">89%</div>
              <div className="text-sm text-purple-700">Success Rate</div>
              <div className="text-xs text-purple-600 mt-1">Clinical endpoints met</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">34</div>
              <div className="text-sm text-orange-700">Countries</div>
              <div className="text-xs text-orange-600 mt-1">Global research network</div>
            </CardContent>
          </Card>
        </div>

        {/* Research Focus Alert */}
        <Alert className="mb-8 border-indigo-200 bg-indigo-50">
          <Microscope className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="text-indigo-800">
            <strong>Special Issue 2025:</strong> We are currently accepting submissions for our special issue on "AI-Driven Clinical Decision Support Systems" - deadline September 30, 2025.
          </AlertDescription>
        </Alert>

        {/* Clinical Research Areas */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Clinical Research Areas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {clinicalAreas.map((area, index) => (
              <Card key={index} className={`${getColorClass(area.color)} border-l-4`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-white rounded-lg ${getIconColor(area.color)}`}>
                        {area.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{area.title}</CardTitle>
                        <CardDescription>{area.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-white text-gray-700">{area.recentCount} studies</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {area.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Studies */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Clinical Studies</h2>
          <div className="space-y-6">
            {recentStudies.map((study, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{study.title}</h3>
                        <Badge 
                          className={
                            study.status === "Completed" ? "bg-green-100 text-green-800" :
                            study.status === "Ongoing" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          }
                        >
                          {study.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {study.authors.join(", ")}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Institution:</strong> {study.institution}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-700">Study Type:</span>
                          <div className="text-gray-600">{study.type}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Participants:</span>
                          <div className="text-gray-600">{study.participants.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Duration:</span>
                          <div className="text-gray-600">{study.duration}</div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                        <span className="font-medium text-green-800">Key Outcome: </span>
                        <span className="text-green-700">{study.outcome}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Published: {new Date(study.publishedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="hover:bg-indigo-50">
                        <Eye className="h-4 w-4 mr-1" />
                        View Study
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-green-50">
                        <Download className="h-4 w-4 mr-1" />
                        Download Data
                      </Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <FileText className="h-4 w-4 mr-1" />
                        Read Full Paper
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Submission Guidelines */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-indigo-600" />
              Clinical Study Submission Guidelines
            </CardTitle>
            <CardDescription>
              Requirements for submitting clinical studies and smart systems research
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {submissionGuidelines.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-3 text-gray-900">{section.category}</h4>
                  <div className="space-y-2">
                    {section.requirements.map((requirement, idx) => (
                      <div key={idx} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technology Focus Areas */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Technology Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Smart Healthcare Systems</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Internet of Medical Things (IoMT)</li>
                  <li>• Interoperable health information systems</li>
                  <li>• Cloud-based clinical platforms</li>
                  <li>• Edge computing in healthcare</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Data Analytics & AI</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Machine learning diagnostic tools</li>
                  <li>• Predictive modeling for patient outcomes</li>
                  <li>• Natural language processing for clinical notes</li>
                  <li>• Computer vision for medical imaging</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Clinical Decision Support</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Evidence-based treatment recommendations</li>
                  <li>• Drug interaction and dosing systems</li>
                  <li>• Risk assessment algorithms</li>
                  <li>• Quality improvement analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Research Excellence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Quality Standards</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• GCP-compliant study design</li>
                  <li>• CONSORT reporting guidelines</li>
                  <li>• Peer review by clinical experts</li>
                  <li>• Reproducible research practices</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Innovation Recognition</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Annual innovation awards</li>
                  <li>• Best clinical study recognition</li>
                  <li>• Early career researcher support</li>
                  <li>• Industry collaboration opportunities</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Global Impact</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• International research collaborations</li>
                  <li>• Policy impact and implementation</li>
                  <li>• Healthcare system improvements</li>
                  <li>• Patient outcome enhancements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-600" />
              Join Our Research Community
            </CardTitle>
            <CardDescription>
              Connect with leading researchers and contribute to advancing clinical science
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">For Researchers</h4>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Your Clinical Study
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Join Reviewer Network
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Apply for Research Awards
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Research Support</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Average Review Time</span>
                    <Badge>21 days</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Acceptance Rate</span>
                    <Badge>72%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Editorial Support</span>
                    <Badge>24/7</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Publication Fee</span>
                    <Badge className="bg-green-100 text-green-800">Free</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
