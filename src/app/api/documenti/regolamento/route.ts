import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Il file si trova nella root del progetto
    const filePath = path.join(process.cwd(), 'Regolamento ufficiale delle FantaNolimpiadi 2026.pdf');
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('File non trovato', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="regolamento-fanta.pdf"',
      },
    });
  } catch (error) {
    console.error('Errore nel servire il PDF:', error);
    return new NextResponse('Errore interno del server', { status: 500 });
  }
}
