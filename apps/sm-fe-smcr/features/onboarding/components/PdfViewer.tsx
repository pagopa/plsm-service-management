"use client";
import { Button } from "@repo/ui";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PdfViewer({ files }: { files: (File & { preview: string })[] }) {
  const [numPages, setNumPages] = useState<number | undefined>(undefined);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }
  return (
    <div>
      <Document file={files[0]} onLoadSuccess={onDocumentLoadSuccess} noData="">
        <Page pageNumber={pageNumber} />
      </Document>
      <div className="flex gap-4 justify-end items-center pt-8 ">
        {pageNumber > 1 && (
          <Button
            variant="secondary"
            onClick={() => {
              setPageNumber(pageNumber - 1);
            }}
          >
            Previous Page
          </Button>
        )}
        {files[0] && numPages && numPages > 1 && pageNumber < numPages && (
          <Button
            variant="secondary"
            onClick={() => {
              setPageNumber(pageNumber + 1);
            }}
          >
            Next Page
          </Button>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
