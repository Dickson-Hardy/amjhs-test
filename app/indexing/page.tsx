"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  Globe, 
  Award, 
  BarChart3, 
  TrendingUp, 
  Database,
  BookOpen,
  ExternalLink,
  Star,
  Eye,
  Download,
  Calendar,
  CheckCircle,
  Target,
  Users,
  Activity
} from "lucide-react"

export default function IndexingPage() {
  const indexingDatabases = [
    {
      name: "PubMed/MEDLINE",
      description: "Primary database for biomedical literature",
      status: "Indexed",
      coverage: "Global",
      impactLevel: "High",
      color: "green",
      features: ["Medical Subject Headings (MeSH)", "Full-text linking", "Citation tracking"]
    },
    {
      name: "Scopus",
      description: "Comprehensive research database",
      status: "Indexed", 
      coverage: "Global",
      impactLevel: "High",
      color: "blue",
      features: ["Citation analysis", "Author metrics", "Journal rankings"]
    },
    {
      name: "Web of Science",
      description: "Multidisciplinary research platform",
      status: "Indexed",
      coverage: "Global", 
      impactLevel: "High",
      color: "purple",
      features: ["Journal Impact Factor", "Citation reports", "Research analytics"]
    },
    {
      name: "DOAJ",
      description: "Directory of Open Access Journals",
      status: "Listed",
      coverage: "Global",
      impactLevel: "Medium",
      color: "orange",
      features: ["Open access verification", "Quality standards", "Global visibility"]
    },
    {
      name: "Google Scholar",
      description: "Academic search engine",
      status: "Indexed",
      coverage: "Global",
      impactLevel: "High", 
      color: "green",
      features: ["Automatic indexing", "Citation metrics", "Author profiles"]
    },
    {
      name: "EMBASE",
      description: "Biomedical and pharmacological database",
      status: "Under Review",
      coverage: "Global",
      impactLevel: "High",
      color: "yellow",
      features: ["Drug research focus", "European coverage", "EMTREE indexing"]
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      "Indexed": "bg-green-100 text-green-800",
      "Listed": "bg-blue-100 text-blue-800", 
      "Under Review": "bg-yellow-100 text-yellow-800",
      "Applied": "bg-orange-100 text-orange-800"
    }
    return colors[status as keyof typeof colors] || colors["Applied"]
  }

  const getImpactColor = (level: string) => {
    const colors = {
      "High": "bg-red-100 text-red-800",
      "Medium": "bg-yellow-100 text-yellow-800",
      "Low": "bg-green-100 text-green-800"
    }
    return colors[level as keyof typeof colors] || colors["Medium"]
  }

  const journalMetrics = [
    {
      metric: "Journal Impact Factor",
      value: "3.245",
      year: "2024",
      description: "Based on Web of Science citations",
      trend: "+15.2%",
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      metric: "CiteScore",
      value: "4.1",
      year: "2024", 
      description: "Scopus-based impact measure",
      trend: "+8.7%",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      metric: "SCImago Journal Rank",
      value: "0.89",
      year: "2024",
      description: "Weighted citation measure",
      trend: "+12.1%",
      icon: <Award className="h-5 w-5" />
    },
    {
      metric: "h-index",
      value: "28",
      year: "2024",
      description: "Publication and citation balance",
      trend: "+3 points",
      icon: <Star className="h-5 w-5" />
    }
  ]

  const submissionBenefits = [
    {
      title: "Global Visibility",
      description: "Your research reaches worldwide medical community",
      icon: <Globe className="h-5 w-5 text-blue-600" />,
      benefits: ["PubMed indexing", "International readership", "Cross-disciplinary access"]
    },
    {
      title: "Citation Impact",
      description: "Enhanced discoverability increases citation potential",
      icon: <Target className="h-5 w-5 text-green-600" />,
      benefits: ["Higher citation rates", "Academic recognition", "Career advancement"]
    },
    {
      title: "Quality Assurance",
      description: "Rigorous peer review ensures research quality",
      icon: <CheckCircle className="h-5 w-5 text-purple-600" />,
      benefits: ["Expert evaluation", "Methodology validation", "Ethical compliance"]
    },
    {
      title: "Open Access",
      description: "Immediate and permanent free access to research",
      icon: <BookOpen className="h-5 w-5 text-orange-600" />,
      benefits: ["No paywalls", "Global accessibility", "Higher impact"]
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
                Indexing & Abstracting
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                International Journal of Advanced Medical and Health Sciences is indexed in major databases, ensuring global visibility and impact for published research
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search Our Articles
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Journal Metrics
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Alert */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Recent Achievement:</strong> Our journal impact factor increased by 15.2% in 2024, reflecting the growing influence of our published research in the medical community.
          </AlertDescription>
        </Alert>

        {/* Journal Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Journal Impact Metrics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {journalMetrics.map((metric, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      {metric.icon}
                    </div>
                    <Badge className="bg-green-100 text-green-800">{metric.trend}</Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                    <p className="text-sm font-medium text-gray-700">{metric.metric}</p>
                    <p className="text-xs text-gray-600">{metric.description}</p>
                    <p className="text-xs text-indigo-600">Year: {metric.year}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Indexing Databases */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Indexing & Abstracting Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indexingDatabases.map((database, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{database.name}</CardTitle>
                    <Badge className={getStatusColor(database.status)}>
                      {database.status}
                    </Badge>
                  </div>
                  <CardDescription>{database.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <Badge variant="outline">{database.coverage}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Impact Level:</span>
                    <Badge className={getImpactColor(database.impactLevel)} variant="outline">
                      {database.impactLevel}
                    </Badge>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <h5 className="font-semibold text-sm text-gray-900 mb-2">Key Features:</h5>
                    <ul className="space-y-1">
                      {database.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits for Authors */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Benefits for Authors</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {submissionBenefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900">{benefit.title}</h4>
                      <p className="text-sm text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2">
                    {benefit.benefits.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Discovery */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Search & Discovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Article Discoverability</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Comprehensive keyword indexing</li>
                  <li>• Medical Subject Headings (MeSH) terms</li>
                  <li>• Cross-reference linking</li>
                  <li>• Semantic search optimization</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Access Points</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Direct database searches</li>
                  <li>• Academic search engines</li>
                  <li>• Institutional repositories</li>
                  <li>• Social media platforms</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Metadata Enhancement</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• DOI assignment for permanent linking</li>
                  <li>• ORCID author identification</li>
                  <li>• Structured abstracts</li>
                  <li>• Funding acknowledgments</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Impact Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Citation Metrics</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Real-time citation tracking</li>
                  <li>• Cross-database citation analysis</li>
                  <li>• Author impact metrics</li>
                  <li>• Institutional rankings</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Usage Analytics</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Download statistics</li>
                  <li>• Geographic usage patterns</li>
                  <li>• Referrer traffic analysis</li>
                  <li>• Social media mentions</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Author Benefits</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Enhanced academic profile</li>
                  <li>• Career advancement support</li>
                  <li>• Grant application evidence</li>
                  <li>• International recognition</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Database Application Timeline
            </CardTitle>
            <CardDescription>
              Our ongoing efforts to expand indexing coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">PubMed Central (PMC)</h4>
                    <p className="text-sm text-green-700">Full-text archiving approved</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Completed 2024</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-800">EMBASE</h4>
                    <p className="text-sm text-blue-700">Application under final review</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Q3 2024</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-semibold text-orange-800">CINAHL</h4>
                    <p className="text-sm text-orange-700">Application submitted for nursing research</p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-800">Q4 2024</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2 text-indigo-600" />
              Access Our Publications
            </CardTitle>
            <CardDescription>
              Multiple ways to access and search our published research
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Direct Database Access</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Search in PubMed
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Browse in Scopus
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View in Web of Science
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Access via DOAJ
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Journal Statistics</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Total Articles Published</span>
                    <Badge>1,247</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Average Citations per Article</span>
                    <Badge>12.4</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>International Authors</span>
                    <Badge>68%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Open Access Articles</span>
                    <Badge>100%</Badge>
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
