"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Cpu,
  Wifi,
  Zap,
  Shield,
  Brain,
  Heart,
  FileText,
  TrendingUp,
  Users,
  Globe,
  Award,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Star,
  Activity,
  Smartphone,
  MonitorSpeaker
} from "lucide-react";

export default function EdgeComputingPage() {
  const innovationAreas = [
    {
      title: "Edge AI in Healthcare",
      description: "Real-time AI processing at the point of care",
      icon: <Brain className="h-6 w-6" />,
      color: "blue",
      applications: [
        "Real-time diagnostic imaging analysis",
        "Bedside patient monitoring algorithms",
        "Surgical guidance and navigation systems",
        "Emergency response decision support"
      ],
      recentCount: 31
    },
    {
      title: "IoT Medical Devices",
      description: "Connected devices transforming patient monitoring",
      icon: <Wifi className="h-6 w-6" />,
      color: "green",
      applications: [
        "Continuous glucose monitoring systems",
        "Smart pacemakers and cardiac devices",
        "Remote vital sign monitoring",
        "Medication adherence tracking"
      ],
      recentCount: 45
    },
    {
      title: "5G Healthcare Networks",
      description: "Ultra-fast connectivity enabling new medical possibilities",
      icon: <Zap className="h-6 w-6" />,
      color: "orange",
      applications: [
        "Remote surgery and telemedicine",
        "AR/VR medical training platforms",
        "Real-time collaboration systems",
        "Emergency response coordination"
      ],
      recentCount: 19
    },
    {
      title: "Secure Health Data",
      description: "Privacy-preserving technologies for medical data",
      icon: <Shield className="h-6 w-6" />,
      color: "purple",
      applications: [
        "Federated learning for medical AI",
        "Homomorphic encryption systems",
        "Blockchain-based health records",
        "Zero-trust security architectures"
      ],
      recentCount: 27
    }
  ]

  const getColorClass = (color: string) => {
    const colors = {
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50",
      orange: "border-orange-200 bg-orange-50",
      purple: "border-purple-200 bg-purple-50"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      orange: "text-orange-600",
      purple: "text-purple-600"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const featuredResearch = [
    {
      title: "Edge Computing Framework for Real-Time ECG Analysis in Ambulances",
      authors: ["Dr. Emily Zhang", "Prof. Robert Kumar", "Dr. Michael Torres"],
      institution: "MIT Computer Science & Artificial Intelligence Lab",
      category: "Edge AI",
      status: "Published",
      impact: "92% accuracy improvement in pre-hospital cardiac diagnosis",
      technology: "Lightweight CNN models, ARM-based edge processors",
      publishedDate: "2025-05-20"
    },
    {
      title: "5G-Enabled Remote Surgery: Latency Analysis and Clinical Validation",
      authors: ["Dr. Sarah Johnson", "Prof. David Kim", "Dr. Lisa Chen"],
      institution: "Stanford Medical Center",
      category: "5G Healthcare",
      status: "Peer Review",
      impact: "Sub-1ms latency achieved for surgical robot control",
      technology: "5G networks, haptic feedback systems, edge computing",
      publishedDate: "2025-06-15"
    },
    {
      title: "Federated Learning for Privacy-Preserving Medical Image Classification",
      authors: ["Dr. Alex Petrov", "Dr. Maria Rodriguez", "Prof. James Wilson"],
      institution: "Google Health Research",
      category: "Privacy Tech",
      status: "Published",
      impact: "95% diagnostic accuracy while preserving patient privacy",
      technology: "Federated learning, differential privacy, edge inference",
      publishedDate: "2025-04-12"
    }
  ]

  const technologyTrends = [
    {
      trend: "Edge AI Processors",
      growth: "+156%",
      description: "Specialized chips for medical AI at the edge",
      applications: ["Diagnostic imaging", "Patient monitoring", "Drug discovery"]
    },
    {
      trend: "5G Medical Applications",
      growth: "+234%",
      description: "Ultra-low latency healthcare solutions",
      applications: ["Remote surgery", "AR medical training", "Emergency response"]
    },
    {
      trend: "Federated Healthcare AI",
      growth: "+189%",
      description: "Collaborative AI without data sharing",
      applications: ["Multi-hospital studies", "Rare disease research", "Population health"]
    },
    {
      trend: "Smart Medical Devices",
      growth: "+127%",
      description: "Intelligent IoT devices for healthcare",
      applications: ["Wearable monitors", "Smart implants", "Connected therapeutics"]
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
                Healthcare Innovation & Edge Computing
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Exploring cutting-edge technologies that bring computation closer to patients and healthcare providers
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Innovation Research
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Explore Technologies
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">89</div>
              <div className="text-sm text-blue-700">Innovation Papers</div>
              <div className="text-xs text-blue-600 mt-1">+34 this year</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">67%</div>
              <div className="text-sm text-green-700">Faster Diagnosis</div>
              <div className="text-xs text-green-600 mt-1">Average improvement</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">156</div>
              <div className="text-sm text-purple-700">Industry Partners</div>
              <div className="text-xs text-purple-600 mt-1">Global collaboration</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">$2.4B</div>
              <div className="text-sm text-orange-700">Research Funding</div>
              <div className="text-xs text-orange-600 mt-1">Annual investment</div>
            </CardContent>
          </Card>
        </div>

        {/* Innovation Alert */}
        <Alert className="mb-8 border-cyan-200 bg-cyan-50">
          <Cpu className="h-4 w-4 text-cyan-600" />
          <AlertDescription className="text-cyan-800">
            <strong>Technology Focus 2025:</strong> Special call for papers on "Edge AI in Critical Care Medicine" - showcase your breakthrough innovations in real-time healthcare decision making.
          </AlertDescription>
        </Alert>

        {/* Innovation Areas */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Healthcare Innovation Focus Areas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {innovationAreas.map((area, index) => (
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
                    <Badge className="bg-white text-gray-700">{area.recentCount} papers</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {area.applications.map((application, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {application}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Trends */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Emerging Technology Trends</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologyTrends.map((trend, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{trend.trend}</h4>
                    <Badge className="bg-green-100 text-green-800">{trend.growth}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{trend.description}</p>
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Key Applications:</h5>
                    <ul className="space-y-1">
                      {trend.applications.map((app, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          {app}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Research */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Innovation Research</h2>
          <div className="space-y-6">
            {featuredResearch.map((research, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{research.title}</h3>
                        <Badge 
                          className={
                            research.status === "Published" ? "bg-green-100 text-green-800" :
                            research.status === "Peer Review" ? "bg-blue-100 text-blue-800" :
                            "bg-orange-100 text-orange-800"
                          }
                        >
                          {research.status}
                        </Badge>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {research.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {research.authors.join(", ")}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <strong>Institution:</strong> {research.institution}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <span className="font-medium text-green-800">Impact: </span>
                          <span className="text-green-700">{research.impact}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="font-medium text-blue-800">Technology: </span>
                          <span className="text-blue-700">{research.technology}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Published: {new Date(research.publishedDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" variant="outline" className="hover:bg-indigo-50">
                        <Eye className="h-4 w-4 mr-1" />
                        View Research
                      </Button>
                      <Button size="sm" variant="outline" className="hover:bg-green-50">
                        <Download className="h-4 w-4 mr-1" />
                        Download Code
                      </Button>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <FileText className="h-4 w-4 mr-1" />
                        Read Paper
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="h-5 w-5 mr-2 text-blue-600" />
                Technical Innovation Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">System Performance</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Real-time processing capabilities (&lt; 100ms latency)</li>
                  <li>• Scalability across different hardware platforms</li>
                  <li>• Energy efficiency and battery life optimization</li>
                  <li>• Fault tolerance and reliability metrics</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Security & Privacy</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• End-to-end encryption implementation</li>
                  <li>• HIPAA and GDPR compliance</li>
                  <li>• Secure boot and trusted execution</li>
                  <li>• Privacy-preserving computation methods</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Interoperability</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• HL7 FHIR standard compliance</li>
                  <li>• API design and documentation</li>
                  <li>• Cross-platform compatibility</li>
                  <li>• Legacy system integration</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-600" />
                Clinical Validation Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Clinical Evidence</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Prospective clinical study design</li>
                  <li>• Comparison with standard of care</li>
                  <li>• Multi-site validation studies</li>
                  <li>• Long-term safety monitoring</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Regulatory Compliance</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• FDA 510(k) or De Novo pathway</li>
                  <li>• CE marking for European markets</li>
                  <li>• ISO 13485 quality management</li>
                  <li>• Clinical risk management (ISO 14971)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">User Experience</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Human factors engineering studies</li>
                  <li>• Usability testing with clinicians</li>
                  <li>• Workflow integration assessment</li>
                  <li>• Training and adoption metrics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Innovation Ecosystem */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-600" />
              Global Innovation Ecosystem
            </CardTitle>
            <CardDescription>
              Connecting researchers, industry, and healthcare providers worldwide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-blue-600" />
                  Research Centers
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    MIT CSAIL Healthcare Innovation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Stanford HAI Medical AI Lab
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Johns Hopkins mHealth Lab
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Oxford Digital Health Network
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2 text-purple-600" />
                  Industry Partners
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Google Health & DeepMind
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    NVIDIA Clara Healthcare
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Intel Health & Life Sciences
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Qualcomm Healthcare
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center">
                  <MonitorSpeaker className="h-4 w-4 mr-2 text-orange-600" />
                  Healthcare Systems
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Mayo Clinic Innovation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Cleveland Clinic Digital
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    NHS Digital Transformation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Singapore Health Tech
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Call to Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Submit Your Healthcare Innovation
            </CardTitle>
            <CardDescription>
              Share your breakthrough technologies with the global medical community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">For Innovators</h4>
                <div className="space-y-3">
                  <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Innovation Paper
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Cpu className="h-4 w-4 mr-2" />
                    Share Technology Demo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Join Innovation Network
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Publication Benefits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Fast-Track Review</span>
                    <Badge>14 days</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Industry Visibility</span>
                    <Badge>High Impact</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Technical Support</span>
                    <Badge>Expert Review</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Open Access</span>
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
