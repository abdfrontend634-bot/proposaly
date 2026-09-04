import jsPDF from "jspdf";

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "proposal"
  );
}

/** Renders a proposal as a paginated PDF and triggers a download. */
export function exportProposalPdf(title: string, content: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(title, width) as string[], margin, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  (doc.splitTextToSize(content, width) as string[]).forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 16;
  });

  doc.save(`${slug(title)}.pdf`);
}

/** Downloads the proposal as a plain-text file. */
export function exportProposalTxt(title: string, content: string) {
  const blob = new Blob([`${title}\n\n${content}\n`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(title)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
