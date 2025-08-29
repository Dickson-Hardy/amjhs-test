"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Heart, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Mail,
  Globe,
  Award,
  Clock,
  Eye,
  UserX,
  Scale,
  Lock
} from "lucide-react"

export default function EthicsPage() {
  const ethicalPrinciples = [
    {
      title: "Patient Safety & Welfare",
      description: "Prioritizing patient wellbeing in all medical research",
      icon: <Heart className="h-6 w-6" />,
      color: "red",
      guidelines: [
        "Informed consent required for all participants",
        "Risk-benefit analysis must favor participants",
        "Right to withdraw at any time",
        "Ongoing safety monitoring"
      ]
    },
    {
      title: "Research Integrity",
      description: "Ensuring honesty and accuracy in scientific reporting",
      icon: <FileText className="h-6 w-6" />,
      color: "blue",
      guidelines: [
        "Accurate reporting of methods and results",
        "No fabrication or falsification of data",
        "Proper statistical analysis and interpretation",
        "Transparent reporting of limitations"
      ]
    },
    {
      title: "Privacy & Confidentiality",
      description: "Protecting participant and patient information",
      icon: <Lock className="h-6 w-6" />,
      color: "green",
      guidelines: [
        "Anonymization of participant data",
        "Secure data storage and transmission",
        "Limited access to identifying information",
        "HIPAA and GDPR compliance"
      ]
    },
    {
      title: "Authorship & Attribution",
      description: "Fair recognition of contributions to research",
      icon: <Users className="h-6 w-6" />,
      color: "purple",
      guidelines: [
        "ICMJE authorship criteria adherence",
        "Proper acknowledgment of contributors",
        "No gift or ghost authorship",
        "Clear contribution statements"
      ]
    }
  ]

  const getColorClass = (color: string) => {
    const colors = {
      red: "border-red-200 bg-red-50",
      blue: "border-blue-200 bg-blue-50",
      green: "border-green-200 bg-green-50",
      purple: "border-purple-200 bg-purple-50"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIconColor = (color: string) => {
    const colors = {
      red: "text-red-600",
      blue: "text-blue-600", 
      green: "text-green-600",
      purple: "text-purple-600"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const ethicsChecklist = [
    {
      category: "Study Design",
      items: [
        "Scientific validity and clinical relevance",
        "Appropriate methodology for research question",
        "Adequate sample size calculation",
        "Clear primary and secondary endpoints"
      ]
    },
    {
      category: "Participant Protection",
      items: [
        "IRB/Ethics committee approval obtained",
        "Informed consent process documented",
        "Vulnerable populations properly protected",
        "Data and safety monitoring plan in place"
      ]
    },
    {
      category: "Data Management",
      items: [
        "Data collection and storage protocols defined",
        "Quality assurance procedures established",
        "Data sharing and retention policies clear",
        "Statistical analysis plan pre-specified"
      ]
    },
    {
      category: "Publication Ethics",
      items: [
        "All authors meet authorship criteria",
        "Conflicts of interest disclosed",
        "Funding sources acknowledged",
        "Previous publications referenced appropriately"
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
                Medical Research Ethics
              </h1>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-6">
                Upholding the highest ethical standards in medical research and healthcare publication
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Shield className="h-4 w-4 mr-2" />
                  View Ethics Guidelines
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Ethics Approval Forms
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ethics Alert */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> All medical research submissions must demonstrate ethical approval and compliance with international guidelines including the Declaration of Helsinki and Good Clinical Practice (GCP) standards.
          </AlertDescription>
        </Alert>

        {/* Core Principles */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Core Ethical Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {ethicalPrinciples.map((principle, index) => (
              <Card key={index} className={`${getColorClass(principle.color)} border-l-4`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-white rounded-lg ${getIconColor(principle.color)}`}>
                      {principle.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{principle.title}</CardTitle>
                      <CardDescription>{principle.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {principle.guidelines.map((guideline, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {guideline}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ethics Requirements */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="h-5 w-5 mr-2 text-blue-600" />
                Regulatory Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">International Standards</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Declaration of Helsinki (2013)</li>
                  <li>• ICH Good Clinical Practice (E6)</li>
                  <li>• CIOMS International Ethical Guidelines</li>
                  <li>• Council for International Organizations of Medical Sciences</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Regional Regulations</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• FDA regulations (21 CFR Parts 50, 56, 312, 812)</li>
                  <li>• EMA Clinical Trial Regulation (EU 536/2014)</li>
                  <li>• Health Canada guidelines</li>
                  <li>• Local institutional requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Data Protection</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• HIPAA compliance (US healthcare data)</li>
                  <li>• GDPR compliance (EU data protection)</li>
                  <li>• Local data protection laws</li>
                  <li>• Institutional data policies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Ethics Committee Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Required Approvals</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Institutional Review Board (IRB) approval</li>
                  <li>• Research Ethics Committee (REC) approval</li>
                  <li>• Local ethics committee approval</li>
                  <li>• Multi-site approvals if applicable</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Documentation Required</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Ethics approval letter</li>
                  <li>• Study protocol and amendments</li>
                  <li>• Informed consent forms</li>
                  <li>• Annual progress reports</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ongoing Obligations</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Safety reporting to ethics committee</li>
                  <li>• Protocol deviation reporting</li>
                  <li>• Annual renewal applications</li>
                  <li>• Study completion reporting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ethics Checklist */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Pre-Submission Ethics Checklist
            </CardTitle>
            <CardDescription>
              Ensure all ethical requirements are met before submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {ethicsChecklist.map((section, index) => (
                <div key={index}>
                  <h4 className="font-semibold mb-3 text-gray-900">{section.category}</h4>
                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Special Considerations */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserX className="h-5 w-5 mr-2 text-orange-600" />
                Vulnerable Populations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-3">
                Special protection measures required for research involving vulnerable populations.
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Protected Groups</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Children and adolescents under 18</li>
                  <li>• Pregnant women and fetuses</li>
                  <li>• Prisoners and institutionalized persons</li>
                  <li>• Cognitively impaired individuals</li>
                  <li>• Economically disadvantaged populations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Additional Safeguards</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Enhanced informed consent procedures</li>
                  <li>• Independent advocate involvement</li>
                  <li>• Additional ethics review requirements</li>
                  <li>• Ongoing capacity assessment</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                International Research
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-3">
                Additional considerations for multi-national and developing country research.
              </p>

              <div>
                <h4 className="font-semibold mb-2">Multi-Country Studies</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Local ethics approval in each country</li>
                  <li>• Cultural sensitivity assessments</li>
                  <li>• Local standard of care considerations</li>
                  <li>• Community engagement requirements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Resource-Limited Settings</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Post-study access to interventions</li>
                  <li>• Capacity building obligations</li>
                  <li>• Fair benefit sharing</li>
                  <li>• Local research infrastructure development</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Publication Ethics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-600" />
              Publication Ethics Guidelines
            </CardTitle>
            <CardDescription>
              Ensuring ethical practices in medical research publication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Authorship Ethics</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    ICMJE authorship criteria
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Contribution transparency
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    No honorary authorship
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Corresponding author responsibility
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Data Integrity</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Original data reporting
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Statistical honesty
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Image authenticity
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Data availability statements
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Conflict Management</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Financial interest disclosure
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Industry relationship transparency
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Institutional affiliations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Personal relationship disclosure
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support and Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Ethics Support & Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Editorial Support</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Our editorial team is available to help with ethics-related questions.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Ethics Hotline:</strong> ethics@amhsj.org</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p><strong>Available:</strong> 24/7 for urgent matters</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Additional Resources</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    COPE Guidelines
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Declaration of Helsinki
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    ICMJE Recommendations
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ethics Forms & Templates
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
