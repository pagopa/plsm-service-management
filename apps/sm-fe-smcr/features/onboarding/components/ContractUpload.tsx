import { useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import PdfViewer from "./PdfViewer";

const baseStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle: React.CSSProperties = {
  borderColor: "#2196f3",
};

const acceptStyle: React.CSSProperties = {
  borderColor: "#00e676",
};

const rejectStyle: React.CSSProperties = {
  borderColor: "#ff1744",
};
export default function ContractUpload({
  files,
  onFilesChange,
}: {
  files: (File & { preview: string })[];
  onFilesChange: (files: (File & { preview: string })[]) => void;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesChange(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        ),
      );
    },
    [onFilesChange],
  );
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isFocused,
    isDragReject,
    isDragAccept,
    acceptedFiles,
    fileRejections,
  } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/pkcs7-mime": [".p7m"],
    },
  });

  const style: React.CSSProperties = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject],
  );

  const acceptedFileItems = acceptedFiles.map((file) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
      <ul>
        {errors.map((e) => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  useEffect(() => {
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Lascia il file qui</p>
        ) : (
          <p>Trascina il file qui o fai click per selezionarlo</p>
        )}
      </div>
      {acceptedFileItems.length > 0 && (
        <aside className="mt-4 mb-8">
          <ul>{acceptedFileItems}</ul>
        </aside>
      )}
      {fileRejectionItems.length > 0 && (
        <aside className="mt-4 mb-8">
          <ul>{fileRejectionItems}</ul>
        </aside>
      )}
      {files.some((file) => file.name.endsWith(".pdf")) && (
        <PdfViewer files={files} />
      )}
    </>
  );
}
