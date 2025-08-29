import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink } from "lucide-react"

export default function MastheadPage() {
  const journalInfo = {
    title: "Advances in Medicine and Health Sciences Journal (AMHSJ)",
    subtitle: "Advancing Modern Hardware & Software Journal",
    issn: "2789-4567 (Online)",
    publisher: "AMHSJ Publishing",
    frequency: "Monthly",
    language: "English",
    founded: "2010",
    impactFactor: "5.2",
    indexing: ["PubMed", "Scopus", "Web of Science", "DOAJ", "Google Scholar"],
  }

  const editorialTeam = {
    editorInChief: {
      name: "Prof Tubonye C Harry",
      title: "Editor-in-Chief",
      affiliation: "",
      email: "editor@amhsj.org",
      orcid: "",
    },
    deputyEditorInChief: {
      name: "Dr Sylvester Izah",
      title: "Deputy-Editor-in-Chief",
      affiliation: "",
      email: "deputy-editor@amhsj.org",
    },
    editors: [
      {
        name: "Prof Aloysius E Ligha",
        title: "Editor",
        affiliation: "",
      },
      {
        name: "Prof Phillip D Eyimina",
        title: "Editor",
        affiliation: "",
      },
      {
        name: "Prof Stephen Olali",
        title: "Editor",
        affiliation: "",
      },
      {
        name: "Dr Mrs Gift Timighe",
        title: "Editor",
        affiliation: "",
      },
      {
        name: "Dr Godwin Angaye",
        title: "Editor",
        affiliation: "",
      },
      {
        name: "Dr Chinma Daokoru-Olukole",
        title: "Editor",
        affiliation: "",
      },
    ],
  }

  const editorialBoard = [
    { name: "Prof Dimie Ogoina", affiliation: "Yenagoa", country: "Nigeria" },
    { name: "Prof Tarila Tebepah", affiliation: "Yenagoa", country: "Nigeria" },
    { name: "Prof Samuel Dagogo-Jack", affiliation: "Tennessee", country: "USA" },
    { name: "Prof Usiakimi Igbaseimokumo", affiliation: "Texas", country: "USA" },
    { name: "Prof Bams Abila", affiliation: "London", country: "UK" },
    { name: "Prof Ebitimitula Etebu", affiliation: "Yenagoa", country: "Nigeria" },
    { name: "Prof Iheanyi Okpala", affiliation: "Enugu", country: "Nigeria" },
    { name: "Prof Edmund L C Ong", affiliation: "Newcastle-upon-Tyne", country: "UK" },
    { name: "Dr Matthew Ogwu", affiliation: "Boone", country: "USA" },
    { name: "Prof Raul Delgado Wise", affiliation: "Zacatecas", country: "Mexico" },
    { name: "Dr Milan Hait", affiliation: "Chhattisgarh", country: "India" },
    { name: "Dr Muhammad Akram", affiliation: "Islamabad", country: "Pakistan" },
    { name: "Dr Noble Kurian", affiliation: "Chennai", country: "India" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Journal Masthead</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete information about AMHSJ's editorial structure, publication details, and leadership team.
          </p>
        </div>

        {/* Journal Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">{journalInfo.title}</CardTitle>
            <CardDescription className="text-center text-lg">{journalInfo.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">ISSN</h3>
                <p className="text-gray-600">{journalInfo.issn}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Publisher</h3>
                <p className="text-gray-600">{journalInfo.publisher}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Frequency</h3>
                <p className="text-gray-600">{journalInfo.frequency}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Language</h3>
                <p className="text-gray-600">{journalInfo.language}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Founded</h3>
                <p className="text-gray-600">{journalInfo.founded}</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Impact Factor</h3>
                <p className="text-gray-600 font-bold text-lg">{journalInfo.impactFactor}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-center">Indexed In</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {journalInfo.indexing.map((index, idx) => (
                  <Badge key={idx} variant="secondary">
                    {index}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor-in-Chief */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Editor-in-Chief</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{editorialTeam.editorInChief.name}</h3>
                {editorialTeam.editorInChief.affiliation && (
                  <p className="text-gray-600 mb-1">{editorialTeam.editorInChief.affiliation}</p>
                )}
                {editorialTeam.editorInChief.orcid && (
                  <p className="text-sm text-gray-500 mb-3">ORCID: {editorialTeam.editorInChief.orcid}</p>
                )}
                <div className="flex gap-3">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  {editorialTeam.editorInChief.orcid && (
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      ORCID
                    </Button>
                  )}
                </div>
              </div>
              <Badge className="bg-indigo-100 text-indigo-800">Editor-in-Chief</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Deputy Editor-in-Chief */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Deputy Editor-in-Chief</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{editorialTeam.deputyEditorInChief.name}</h3>
                {editorialTeam.deputyEditorInChief.affiliation && (
                  <p className="text-gray-600 mb-1">{editorialTeam.deputyEditorInChief.affiliation}</p>
                )}
                <div className="flex gap-3 mt-3">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Deputy Editor-in-Chief</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Editors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editorialTeam.editors.map((editor, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800">{editor.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{editor.title}</p>
                  {editor.affiliation && (
                    <p className="text-sm text-gray-500">{editor.affiliation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* International Editorial Advisory Board */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">International Editorial Advisory Board</CardTitle>
            <CardDescription>International experts contributing to our peer review process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editorialBoard.map((member, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.affiliation}</p>
                  <p className="text-xs text-gray-500 mt-1">{member.country}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Editorial Office Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Mailing Address</h3>
                <p className="text-gray-600">
                  AMHSJ Editorial Office
                  <br />
                  123 Research Drive
                  <br />
                  Innovation City, IC 12345
                  <br />
                  United States
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Contact Details</h3>
                <p className="text-gray-600 mb-2">
                  <strong>Email:</strong> editor@amhsj.org
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
                <p className="text-gray-600">
                  <strong>Website:</strong> www.amhsj.org
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
