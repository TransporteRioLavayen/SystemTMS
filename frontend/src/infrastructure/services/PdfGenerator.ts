import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Planilla } from '../../domain/models/Planilla';

export const generatePlanillaPDF = (planilla: Planilla) => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Indigo-600
  doc.text('Resumen de Planilla de Viaje', 14, 22);
  
  // Información General
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`ID Planilla: ${planilla.id}`, 14, 32);
  doc.text(`Sucursal: ${planilla.sucursal || 'N/A'}`, 14, 38);
  doc.text(`Estado: ${planilla.estado.toUpperCase()}`, 14, 44);
  
  // Fechas y Vehículo
  doc.text(`Fecha Salida Est.: ${planilla.fechaSalida || 'N/A'}`, 100, 32);
  doc.text(`Fecha Llegada Est.: ${planilla.fechaLlegada || 'N/A'}`, 100, 38);
  doc.text(`Camión: ${planilla.camion || 'N/A'}`, 100, 44);
  doc.text(`Chofer: ${planilla.chofer || 'N/A'}`, 100, 50);
  
  // Detalles de Salida
  if (planilla.kmSalida) {
    doc.text(`Kilometraje de Salida: ${planilla.kmSalida}`, 14, 50);
  }
  if (planilla.comentarios) {
    doc.text(`Comentarios: ${planilla.comentarios}`, 14, 56);
  }

  // Tabla de Remitos
  const tableColumn = ["Seguimiento", "Nº Remito", "Remitente", "Destinatario", "Bultos", "Valor ($)"];
  const tableRows = planilla.remitos.map(r => [
    r.seguimiento || 'N/A',
    r.numeroRemito,
    r.remitente,
    r.destinatario,
    r.bultos.toString(),
    r.valorDeclarado.toFixed(2)
  ]);

  (doc as any).autoTable({
    startY: 65,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
  });

  // Totales
  const totalBultos = planilla.remitos.reduce((sum, r) => sum + r.bultos, 0);
  const totalValor = planilla.remitos.reduce((sum, r) => sum + r.valorDeclarado, 0);
  
  const finalY = (doc as any).lastAutoTable.finalY || 65;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Remitos: ${planilla.remitos.length}`, 14, finalY + 10);
  doc.text(`Total Bultos: ${totalBultos}`, 14, finalY + 16);
  doc.text(`Valor Total Declarado: $${totalValor.toFixed(2)}`, 14, finalY + 22);

  // Guardar PDF
  doc.save(`Planilla_${planilla.id}.pdf`);
};
