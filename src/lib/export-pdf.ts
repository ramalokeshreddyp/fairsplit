import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Group } from './types';
import { calculateGroupAnalytics } from './fairness-engine';

export function exportGroupToPDF(group: Group) {
  const analytics = calculateGroupAnalytics(group);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FairSplit Report', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(group.name, pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated on ${new Date().toLocaleDateString()} • Mode: ${group.mode}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 12;

  // Summary Stats
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Expenses', `₹${analytics.totalExpenses.toFixed(2)}`],
      ['Average Per Person', `₹${analytics.averagePerPerson.toFixed(2)}`],
      ['Group Fairness Score', `${analytics.groupFairnessScore}/100`],
      ['Members', `${group.members.length}`],
      ['Total Expenses Count', `${group.expenses.length}`],
      ['Top Payer', `${analytics.topPayer.name} (₹${analytics.topPayer.amount.toFixed(2)})`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 201, 167] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Fairness Scores
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fairness Scores', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Member', 'Paid', 'Benefited', 'Net Balance', 'Fairness Score']],
    body: analytics.fairnessScores.map(f => [
      f.memberName,
      `₹${f.totalPaid.toFixed(2)}`,
      `₹${f.totalBenefited.toFixed(2)}`,
      `${f.netBalance >= 0 ? '+' : ''}₹${f.netBalance.toFixed(2)}`,
      `${f.fairnessScore}/100`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 201, 167] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need a new page
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Settlements
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Settlements', 14, y);
  y += 2;

  if (analytics.settlements.length === 0) {
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('All settled up! No payments needed.', 14, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['From', 'To', 'Amount']],
      body: analytics.settlements.map(s => [
        s.fromName,
        s.toName,
        `₹${s.amount.toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 201, 167] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Category Breakdown
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount', '% of Total']],
    body: analytics.categoryBreakdown.map(c => [
      c.category,
      `₹${c.amount.toFixed(2)}`,
      `${((c.amount / analytics.totalExpenses) * 100).toFixed(1)}%`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 201, 167] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // Expenses List
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('All Expenses', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Amount', 'Paid By', 'Category', 'Split']],
    body: group.expenses.map(exp => {
      const payer = group.members.find(m => m.id === exp.paidById);
      return [
        new Date(exp.date).toLocaleDateString(),
        exp.description,
        `₹${exp.amount.toFixed(2)}`,
        payer?.name ?? '-',
        exp.category,
        exp.splitType,
      ];
    }),
    theme: 'striped',
    headStyles: { fillColor: [0, 201, 167] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `FairSplit Report — ${group.name} — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`FairSplit_${group.name.replace(/\s+/g, '_')}_Report.pdf`);
}
