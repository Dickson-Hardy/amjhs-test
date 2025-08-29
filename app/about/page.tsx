import React from "react"

export const metadata = {
  title: "About the Journal | AMHSJ",
  description: "About Advances in Medicine and Health Sciences Research (AMHSJ)"
}

export default function AboutJournalPage() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-blue-900 mb-4">About the Journal</h1>
          <div className="w-16 h-1 bg-blue-800 mx-auto"></div>
        </header>
        
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r">
            <p className="text-base font-medium text-blue-900 mb-2">
              Advances in Medicine and Health Sciences Research (AMHSJ) is an international, peer-reviewed, open-access journal committed to the advancement and dissemination of scholarly knowledge across the expansive field of medicine and health sciences.
            </p>
            <p className="text-sm text-blue-700">
              The journal serves as a dynamic platform for the exchange of high-quality scientific findings that shape clinical practice, influence health policy, and drive innovation in health systems worldwide.
            </p>
          </div>

          <section>
            <p className="text-base">
              Our mission is to foster evidence-based practice, encourage interdisciplinary research, and enhance public health outcomes by publishing robust, impactful studies. AMHSJ is devoted to promoting scientific dialogue among researchers, academicians, healthcare providers, policymakers, and students through the publication of original research articles, systematic reviews, clinical case reports, brief communications, editorials, book reviews, and commentaries.
            </p>
            <p className="text-base">
              The journal actively supports the development of global healthcare by covering topics relevant to emerging health issues, technological innovations, and the social determinants of health. Through rigorous peer review and open-access publishing, AMHSJ contributes to improving healthcare delivery, education, and practice both in resource-limited and developed settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Scope of the Journal
            </h2>
            <p className="text-base mb-6">
              AMHSJ welcomes submissions that span the entire spectrum of medicine and health sciences. Topics of interest include, but are not limited to:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Medicine and Clinical Sciences</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• General and Internal Medicine</li>
                  <li>• Surgery and Surgical Specialties</li>
                  <li>• Family and Community Medicine</li>
                  <li>• Pediatrics and Adolescent Health</li>
                  <li>• Obstetrics and Gynecology</li>
                  <li>• Psychiatry, Mental Health, and Behavioral Sciences</li>
                  <li>• Dermatology, Ophthalmology, and Otorhinolaryngology (ENT)</li>
                  <li>• Emergency and Critical Care Medicine</li>
                  <li>• Anesthesiology and Pain Management</li>
                  <li>• Radiology, Nuclear Medicine, and Radiation Oncology</li>
                  <li>• Chronic Diseases and Non-Communicable Conditions</li>
                  <li>• Infectious Diseases and Vaccinology</li>
                  <li>• Maternal, Child, and Reproductive Health</li>
                  <li>• Geriatric and Palliative Care Medicine</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Public Health and Allied Health Sciences</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Public and Community Health</li>
                  <li>• Epidemiology and Biostatistics</li>
                  <li>• Environmental Health and Toxicology</li>
                  <li>• Health Promotion and Disease Prevention</li>
                  <li>• Health Education and Communication</li>
                  <li>• Global Health, Health Systems, and Policy Research</li>
                  <li>• Disaster Medicine and Emergency Preparedness</li>
                  <li>• Social Determinants of Health</li>
                  <li>• Occupational and Industrial Health</li>
                  <li>• Strategic Management in Healthcare</li>
                  <li>• Hospital Administration and Healthcare Management</li>
                  <li>• Health Economics and Policy</li>
                  <li>• Health Information Management and Digital Health</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Nursing, Pharmacy, and Rehabilitation Sciences</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Nursing Science and Midwifery</li>
                  <li>• Clinical Pharmacy, Pharmacology, and Toxicology</li>
                  <li>• Physiotherapy and Rehabilitation Sciences</li>
                  <li>• Complementary and Alternative Medicine</li>
                  <li>• Drug Development and Therapeutics</li>
                  <li>• Biomedical Engineering and Assistive Technology</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Biomedical and Life Sciences</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Anatomy, Physiology, and Pathophysiology</li>
                  <li>• Biochemistry and Molecular Biology</li>
                  <li>• Microbiology, Virology, and Immunology</li>
                  <li>• Genetics, Genomics, and Birth Defects</li>
                  <li>• Reproductive and Developmental Biology</li>
                  <li>• Cancer Biology and Oncology Research</li>
                  <li>• Neurosciences and Cognitive Science</li>
                  <li>• Biotechnology and Molecular Diagnostics</li>
                  <li>• Medical Laboratory Science and Diagnostics</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Nutrition, Dietetics, and Food Science</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Human Nutrition and Dietetics</li>
                  <li>• Public Health Nutrition</li>
                  <li>• Food Safety and Nutritional Epidemiology</li>
                  <li>• Agriculture, Food Security, and Veterinary Public Health</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Natural and Applied Sciences in Health</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Chemistry (Organic, Inorganic, Physical, Analytical)</li>
                  <li>• Physics and Medical Physics</li>
                  <li>• Biology, Zoology, and Botany</li>
                  <li>• Environmental Sciences and Ecosystem Health</li>
                  <li>• Computer Science and Artificial Intelligence in Medicine</li>
                  <li>• Telemedicine, Health Informatics, and Digital Health</li>
                  <li>• Mathematics, Data Science, and Biostatistics</li>
                  <li>• Biomedical Engineering and Health Technology Innovations</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg mt-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Interdisciplinary and Emerging Fields</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Scientific Ethics and Research Integrity</li>
                  <li>• Media and Technology in Health Education</li>
                  <li>• Climate Change and Human Health</li>
                  <li>• Population Health and Demographic Transitions</li>
                </ul>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Innovations in Health Policy and Practice</li>
                  <li>• Personalized and Precision Medicine</li>
                  <li>• Translational and Interdisciplinary Research</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Journal Details
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div><span className="font-semibold text-blue-800">Title:</span> Advances in Medicine and Health Sciences Research (AMHSJ)</div>
                  <div><span className="font-semibold text-blue-800">ISSN:</span> XXXX-XXXX</div>
                  <div><span className="font-semibold text-blue-800">Language:</span> English</div>
                  <div><span className="font-semibold text-blue-800">Publication Frequency:</span> Quarterly (4 issues per year)</div>
                  <div><span className="font-semibold text-blue-800">Peer Review Process:</span> Double-blind peer review</div>
                </div>
                <div className="space-y-2">
                  <div><span className="font-semibold text-blue-800">Review Timeline:</span> Typically within 4 weeks; expedited review upon request</div>
                  <div><span className="font-semibold text-blue-800">Article Types:</span> Original research, reviews, case reports, short communications, commentaries, editorials, etc</div>
                  <div><span className="font-semibold text-blue-800">Open Access Policy:</span> All published content is freely accessible to the public without subscription fees</div>
                  <div><span className="font-semibold text-blue-800">Licensing:</span> Creative Commons Attribution-NonCommercial-NoDerivs License (CC BY-NC-ND)</div>
                  <div><span className="font-semibold text-blue-800">Ethics Compliance:</span> Follows COPE guidelines for transparency and integrity</div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Open Access Policy
            </h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r">
              <p className="text-base mb-4">
                Advances in Medicine and Health Sciences Research (AMHSJ) operates under a fully open-access publishing model, ensuring that all published articles are immediately and permanently available online without any subscription or access fees. This policy aligns with our mission to democratize scientific knowledge and facilitate unrestricted global access to current research in medicine and health sciences.
              </p>
              <p className="text-sm text-gray-700">
                Under the terms of the Creative Commons Attribution-NonCommercial-NoDerivs 3.0 License (CC BY-NC-ND 3.0), readers may read, download, copy, distribute, print, search, and link to the full text, provided proper credit is given, the work is not altered, and it is not used commercially.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Submission and Publication Process
            </h2>
            <div className="space-y-4">
              <p className="text-base">
                Manuscripts may be submitted via the online submission portal available on the AMHSJ website. Submissions should be in clear, grammatically accurate English, adhere to the journal's author guidelines, and be formatted according to the prescribed submission template.
              </p>
              <p className="text-base">
                All submitted manuscripts undergo an initial editorial screening followed by a rigorous double-blind peer review process. Submissions are evaluated on the basis of originality, scientific rigor, relevance, clarity, and ethical compliance. Accepted articles are published without any Article Processing Charges (APCs), making AMHSJ a cost-free publication platform for authors.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Ethical Standards and Publication Policies
            </h2>
            <div className="bg-amber-50 p-6 rounded-lg">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">•</span>
                  <span>All manuscripts must contain original, unpublished content and demonstrate at least 80% text uniqueness, especially in the Results and Conclusion sections. Furthermore single source similarity should not be greater than 3%.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">•</span>
                  <span>Plagiarized content or manuscripts with substantial overlap (&gt;20 and &lt;30% similarity) from previously published work will be returned for revision. A manuscript with more than 30% similarity will be rejected outright.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">•</span>
                  <span>The journal ensures the confidentiality and objectivity of the peer review process. Reviewers are selected based on their subject-matter expertise and must declare any potential conflicts of interest before reviewing submissions.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2 font-bold">•</span>
                  <span>Authors are expected to disclose any conflicts of interest, funding sources, and ethical approval for studies involving human or animal subjects.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Benefits to Authors
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Rapid and fair peer review leading to timely publication</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Free access and publication (Free APC), ensuring no financial burden on authors</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Global visibility through open-access indexing and digital dissemination</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Enhanced reach and citation potential via social media promotion</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> PDF and/or hard copies of published articles provided free of charge</li>
                  <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Opportunities for scholarly recognition and collaboration</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Contact and Further Information
            </h2>
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <div className="space-y-2 text-sm text-gray-700">
                <div>Visit our official website: <span className="font-mono bg-gray-200 px-2 py-1 rounded">[XXXXXXXXXXXXXXXX]</span></div>
                <div>Email the editorial office: <span className="font-mono bg-gray-200 px-2 py-1 rounded">[XXXXXXXXXXXXXXXX]</span></div>
                <div>Follow our social media handles for updates and announcements</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              Editorial & Advisory Leadership
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r">
              <p className="text-base mb-4">
                The journal is guided by an international editorial and advisory structure including specialist and
                international advisors who support methodological rigor and global relevance. A growing advisory network
                includes infectious diseases, public health, epidemiology, and implementation science experts.
              </p>
              <div className="bg-white p-4 rounded border">
                <p className="text-sm">
                  <span className="font-semibold text-blue-800">Featured International Advisory Member:</span> <strong>Dr. Edmund L. C. Ong</strong>, Honorary Professor of Medicine & Consultant in Infectious Diseases (Newcastle University Medicine Malaysia) – global advisor with extensive HIV, TB and dengue research leadership across Africa and Asia. See full profiles on our <a href="/editorial-board" className="text-blue-600 hover:text-blue-800 underline">Editorial & Advisory Board</a> page.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-blue-900 mb-4 mt-8 border-b-2 border-blue-200 pb-2">
              COPE Compliance
            </h2>
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-base mb-2">
                AMHSJ adheres strictly to the COPE Code of Conduct and Best Practice Guidelines to ensure transparency, accountability, and integrity throughout the editorial and publication processes.
              </p>
              <p className="text-sm text-gray-700">
                For more information, visit: <span className="font-mono bg-gray-200 px-2 py-1 rounded">[COPE Resources – XXXXXXX]</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}