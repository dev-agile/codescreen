import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Candidate {
  name: string;
  phone: string;
  email: string;
  rowNumber: number;
  error?: string;
}

interface BulkInviteProps {
  onSuccess?: () => void;
  testId: number;
}

export default function BulkInvite({ onSuccess, testId }: BulkInviteProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [invalidRows, setInvalidRows] = useState<Candidate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const bulkInviteMutation = useMutation({
    mutationFn: async (data: { candidates: Candidate[] }) => {
      const res = await apiRequest("POST", "/api/candidates/bulk-invite", {
        ...data,
        testId
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate the candidates query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/candidates`] });
      if (onSuccess) {
        onSuccess();
      }
      toast({
        title: "Candidates invited successfully",
        description: "Invitation links have been generated",
      });
    },
    onError: () => {
      toast({
        title: "Failed to invite candidates",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Find header row
      const headerRow = rows[0];
      const nameIdx = headerRow.findIndex((h: string) => h && h.trim().toLowerCase() === "candidate name");
      const phoneIdx = headerRow.findIndex((h: string) => h && h.trim().toLowerCase() === "phone number");
      const emailIdx = headerRow.findIndex((h: string) => h && h.trim().toLowerCase() === "email id");

      if (nameIdx === -1 || phoneIdx === -1 || emailIdx === -1) {
        alert("Missing required columns in the Excel file.");
        return;
      }

      const valid: Candidate[] = [];
      const invalid: Candidate[] = [];

      rows.slice(1).forEach((row, i) => {
        const name = row[nameIdx]?.toString().trim() || "";
        const phone = row[phoneIdx]?.toString().trim() || "";
        const email = row[emailIdx]?.toString().trim() || "";
        let error = "";

        if (!name || !phone || !email) {
          error = "Missing required field(s)";
        } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          error = "Invalid email format";
        } else if (!/^[0-9+\-\s()]{7,}$/.test(phone)) {
          error = "Invalid phone number";
        }

        const candidate: Candidate = { name, phone, email, rowNumber: i + 2, error };
        if (error) {
          invalid.push(candidate);
        } else {
          valid.push(candidate);
        }
      });

      setCandidates(valid);
      setInvalidRows(invalid);
    };
    reader.readAsBinaryString(file);
  };

  const handleSendInvites = async () => {
    bulkInviteMutation.mutate({ candidates });
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
      {fileName && <div>File: {fileName}</div>}

      {candidates.length > 0 && (
        <>
          <h3 className="mt-4 font-semibold">Valid Candidates</h3>
          <div className="overflow-auto max-h-96 border rounded">
            <table className="min-w-full border mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Phone</th>
                  <th className="border px-2 py-1">Email</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{c.name}</td>
                    <td className="border px-2 py-1">{c.phone}</td>
                    <td className="border px-2 py-1">{c.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button 
            onClick={handleSendInvites} 
            disabled={bulkInviteMutation.isPending}
          >
            {bulkInviteMutation.isPending ? "Sending..." : "Send Invites"}
          </Button>
        </>
      )}

      {invalidRows.length > 0 && (
        <>
          <h3 className="mt-6 font-semibold text-red-600">Invalid Rows</h3>
          <div className="overflow-auto max-h-96 border rounded">
            <table className="min-w-full border mb-4">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Row</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Phone</th>
                  <th className="border px-2 py-1">Email</th>
                  <th className="border px-2 py-1">Error</th>
                </tr>
              </thead>
              <tbody>
                {invalidRows.map((c, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{c.rowNumber}</td>
                    <td className="border px-2 py-1">{c.name}</td>
                    <td className="border px-2 py-1">{c.phone}</td>
                    <td className="border px-2 py-1">{c.email}</td>
                    <td className="border px-2 py-1 text-red-600">{c.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 