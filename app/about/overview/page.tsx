import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Award, 
  Globe, 
  TrendingUp,
  Shield,
  Lightbulb,
  Target,
  Heart
} from "lucide-react"

export default function AboutOverviewPage() {
  const milestones = [
    {
      year: "2010",
      title: "Journal Founded",
      description: "AMHSJ was established to fill the gap in IoT and connected systems research publication."
    },
    {
      year: "2015",
      title: "First Impact Factor",
      description: "Achieved our first impact factor of 2.1, establishing credibility in the research community."
    },
    {
      year: "2018",
      title: "Open Access Transition",
      description: "Transitioned to full open access model to democratize research accessibility."
    },
    {
      year: "2020",
      title: "Digital Transformation",
      description: "Launched advanced digital platform with AI-assisted peer review system."
    },
    {
      year: "2022",
      title: "Global Recognition",
      description: "Ranked in top 10 IoT research journals worldwide by citation metrics."
    },
    {
      year: "2024",
      title: "Current Standing",
      description: "Achieved impact factor of 5.2 with over 2,800 active researchers globally."
    }
  ]

  const keyMetrics = [
    {
      icon: BookOpen,
      value: "1,247",
      label: "Published Articles",
      sublabel: "Since inception"
    },
    {
      icon: Users,
      value: "2,847",
      label: "Active Researchers",
      sublabel: "Global community"
    },
    {
      icon: Globe,
      value: "89",
      label: "Countries",
      sublabel: "Worldwide reach"
    },
    {
      icon: Award,
      value: "5.2",
      label: "Impact Factor",
      sublabel: "2024 JCR"
    },
    {
      icon: TrendingUp,
      value: "847K",
      label: "Annual Downloads",
      sublabel: "Growing readership"
    },
    {
      icon: Calendar,
      value: "24",
      label: "Issues Published",
      sublabel: "Per year"
    }
  ]

  const coreValues = [
    {
      icon: Shield,
      title: "Integrity",
      description: "Maintaining the highest standards of scientific rigor and ethical publishing practices."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Championing groundbreaking research that advances IoT and connected systems."
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Committed to publishing only the highest quality, peer-reviewed research."
    },
    {
      icon: Heart,
      title: "Community",
      description: "Building a global network of researchers, practitioners, and innovators."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Journal Overview
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive look at AMHSJ's mission, achievements, and impact on the global research community
          </p>
          <Badge className="mt-4 bg-blue-100 text-blue-800 text-lg px-6 py-2">
            Established 2010 • Impact Factor 5.2
          </Badge>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                To advance the field of medicine and health sciences through the publication of high-quality, 
                peer-reviewed research that bridges the gap between clinical practice and scientific innovation. 
                We are committed to fostering a collaborative global research community that drives improvements 
                in patient care and public health outcomes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-800">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                To be the premier platform for groundbreaking research in IoT-enabled healthcare and connected 
                medical systems, leading the transformation of healthcare delivery through innovative technology 
                solutions and evidence-based research that improves lives globally.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <metric.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <div className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</div>
                  <div className="text-sm font-medium text-gray-600 mb-1">{metric.label}</div>
                  <div className="text-xs text-gray-500">{metric.sublabel}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Our Journey</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Key Milestones</CardTitle>
              <CardDescription>
                Major achievements and developments in AMHSJ's history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{milestone.year}</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 mb-1">{milestone.title}</h3>
                      <p className="text-gray-600 text-sm">{milestone.description}</p>
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="flex-shrink-0 ml-6">
                        <div className="w-px h-16 bg-gray-200"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Focus */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Research Focus</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Primary Research Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>IoT in Healthcare & Medical Devices</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>Connected Health Systems</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>Telemedicine & Remote Monitoring</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>Clinical Decision Support Systems</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <span>Digital Health Analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Emerging Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    <span>AI/ML in Medical IoT</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    <span>Blockchain in Healthcare</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    <span>Edge Computing for Health</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    <span>Quantum Computing Applications</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    <span>Cybersecurity in Medical IoT</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Join Our Research Community</h2>
            <p className="text-xl mb-6 opacity-90">
              Be part of the future of healthcare technology and connected medical systems
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-white text-blue-600 px-6 py-2 text-lg">
                Submit Research
              </Badge>
              <Badge className="bg-white text-purple-600 px-6 py-2 text-lg">
                Become a Reviewer
              </Badge>
              <Badge className="bg-white text-indigo-600 px-6 py-2 text-lg">
                Join Editorial Board
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
