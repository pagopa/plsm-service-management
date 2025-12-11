"use client";
import { FileIcon } from "lucide-react";

export function FileBrowser({ file }: { file: { name: string } }) {
  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <h2 className="font-semibold mb-2">File Browser</h2>
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <FileIcon className="size-4 text-blue-500" />
          <span>{file.name}</span>
        </li>
      </ul>
    </div>
  );
}
