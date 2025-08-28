import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function Report() {
  const reports = [
    { title: "Weekly Speech Accuracy", value: "85%", date: "Aug 25, 2025" },
    { title: "Session Completion Rate", value: "92%", date: "Aug 24, 2025" },
    { title: "Pronunciation Improvement", value: "78%", date: "Aug 22, 2025" },
  ];

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Speech Therapy Reports", 14, 20);

    const tableData = reports.map((r) => [r.title, r.value, r.date]);

    doc.autoTable({
      head: [["Report Title", "Value", "Date"]],
      body: tableData,
      startY: 30,
      styles: { fontSize: 12 },
      headStyles: { fillColor: [0, 122, 204] },
    });

    doc.save("Speech_Therapy_Reports.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Reports</h1>
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <div
              key={index}
              className="bg-blue-100 p-6 rounded-2xl shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{report.title}</h3>
              <p className="text-2xl font-bold text-blue-700">{report.value}</p>
              <p className="text-gray-600 mt-2">Updated: {report.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
