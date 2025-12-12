import React from "react";
import { Recycle, Map, Users, ShieldCheck } from "lucide-react";
import { Head } from "@inertiajs/react"; 
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
    <Head title="About" />

      {/* Header */}
      <Header/>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-700 to-green-500 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            About <span className="text-green-100">MENRO Opol</span>
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-green-50">
            Serving the people of <strong>Poblacion, Opol</strong> with
            sustainable waste management and environmental protection
            initiatives.
          </p>
        </div>
      </section>

      {/* MENRO Details */}
      <section className="py-16 px-6 flex-1">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
<img
  src="/images/menro.jpg"
  alt="MENRO Poblacion Opol"
  className="w-full h-64 object-cover rounded-2xl shadow-md"
/>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              MENRO – Poblacion, Opol
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              The <strong>Municipal Environment and Natural Resources Office
              (MENRO)</strong> of Opol, based in <strong>Poblacion</strong>, is
              committed to ensuring a clean, green, and safe environment. It
              oversees proper solid waste management, environmental compliance,
              and community programs that promote sustainability and
              accountability.
            </p>
            <p className="text-gray-600 leading-relaxed">
              MENRO Opol works hand-in-hand with barangays, waste carriers, and
              local residents to build an eco-friendly community that values
              both people and nature.
            </p>
          </div>
        </div>
      </section>

      {/* Why This App Exists */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">
            Why This App Was Built
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            The <strong>Waste Carrier Monitoring App</strong> was created to
            support MENRO Opol’s mission by providing real-time tracking of
            garbage trucks, monitoring collection routes, and ensuring timely
            services. It addresses common problems such as missed collections,
            untracked delays, and lack of accountability.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition">
              <Recycle className="mx-auto text-green-600" size={40} />
              <h3 className="text-xl font-semibold mt-4">Environmental Care</h3>
              <p className="text-gray-600 mt-2">
                Keeps Opol cleaner and greener with a modern waste management
                approach.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition">
              <Map className="mx-auto text-green-600" size={40} />
              <h3 className="text-xl font-semibold mt-4">Route Monitoring</h3>
              <p className="text-gray-600 mt-2">
                Tracks garbage trucks live, ensuring routes are followed and
                completed.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition">
              <Users className="mx-auto text-green-600" size={40} />
              <h3 className="text-xl font-semibold mt-4">Community Service</h3>
              <p className="text-gray-600 mt-2">
                Built to serve Opol residents with efficient and reliable waste
                collection.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl shadow hover:shadow-lg transition">
              <ShieldCheck className="mx-auto text-green-600" size={40} />
              <h3 className="text-xl font-semibold mt-4">Transparency</h3>
              <p className="text-gray-600 mt-2">
                Builds accountability between MENRO, waste carriers, and the
                people.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-100 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get in Touch with MENRO
          </h2>
          <p className="text-gray-600 mb-8">
            For questions, feedback, or program details, reach out to MENRO
            Poblacion, Opol.
          </p>
          <a
            href="https://www.facebook.com/menro.opol"
            className="inline-block px-6 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-600 hover:text-white transition"
          >
            Contact MENRO
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
