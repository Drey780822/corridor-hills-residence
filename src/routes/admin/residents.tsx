import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { getUnits, saveUnits } from "@/lib/operations-service";
import { recordAuditEvent } from "@/lib/audit-service";
import type {
  UnitStructure,
  StudentImportRecord,
  ImportValidationResult,
  Block,
  Room,
} from "@/types/operations";
import {
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  AlertCircle,
  FileText,
  Save,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin/residents")({
  component: AdminResidentsPage,
});

export function AdminResidentsPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [activeTab, setActiveTab] = useState<"directory" | "import">("directory");
  const [units, setUnits] = useState<UnitStructure[]>([]);
  const [search, setSearch] = useState("");

  // Importer state
  const [csvText, setCsvText] = useState("");
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    setUnits(getUnits());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  // Flatten residents from all units
  const allResidents = units.flatMap((u) =>
    u.students.map((s) => ({
      ...s,
      block: u.block,
      unitNumber: u.unitNumber,
      floor: u.floor,
      unitId: u.id,
    })),
  );

  const filteredResidents = allResidents.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.studentNumber.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.surname.toLowerCase().includes(q) ||
      r.unitNumber.toLowerCase().includes(q) ||
      r.block.toLowerCase().includes(q)
    );
  });

  const sampleCsv = `StudentNumber,Name,Surname,Block,Floor,Unit,Room
221894032,Thandiwe,Mahlangu,Block A,1,101,A
220394812,Kabelo,Nkosi,Block B,2,204,B
223847291,Siphiwe,Mokoena,Block C,3,302,C
221009843,Lerato,Dlamini,Block F,3,301,D`;

  const handleValidateCsv = () => {
    setImportSuccess(null);
    if (!csvText.trim()) return;

    const lines = csvText.trim().split("\n");
    const validRecords: StudentImportRecord[] = [];
    const errors: Array<{ row: number; studentNumber?: string; message: string }> = [];
    const duplicates: Array<{ row: number; studentNumber: string }> = [];
    const seenStudentNumbers = new Set<string>();

    const existingStudentNumbers = new Set(allResidents.map((r) => r.studentNumber));

    // Determine if first row is header
    const startIndex = lines[0].toLowerCase().includes("studentnumber") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const rowNum = i + 1;
      const cols = line.split(",").map((c) => c.trim());

      if (cols.length < 7) {
        errors.push({
          row: rowNum,
          message: `Incomplete columns (expected 7, received ${cols.length})`,
        });
        continue;
      }

      const [studentNumber, name, surname, rawBlock, rawFloor, unit, rawRoom] = cols;

      // Validate student number
      if (!/^\d{8,10}$/.test(studentNumber)) {
        errors.push({
          row: rowNum,
          studentNumber,
          message: `Invalid Student Number format: "${studentNumber}" (expected 8-10 digits)`,
        });
        continue;
      }

      // Check duplicates in import file
      if (seenStudentNumbers.has(studentNumber)) {
        duplicates.push({
          row: rowNum,
          studentNumber,
        });
        continue;
      }
      seenStudentNumbers.add(studentNumber);

      // Check duplicate with existing roster
      if (existingStudentNumbers.has(studentNumber)) {
        duplicates.push({
          row: rowNum,
          studentNumber,
        });
        continue;
      }

      // Validate Block
      const blockStr = rawBlock.includes("Block") ? rawBlock : `Block ${rawBlock}`;
      const validBlocks: Block[] = [
        "Block A",
        "Block B",
        "Block C",
        "Block D",
        "Block E",
        "Block F",
      ];
      if (!validBlocks.includes(blockStr as Block)) {
        errors.push({
          row: rowNum,
          studentNumber,
          message: `Invalid Residence Block: "${rawBlock}"`,
        });
        continue;
      }

      // Validate Floor
      const floor = parseInt(rawFloor, 10);
      if (isNaN(floor) || floor < 1 || floor > 4) {
        errors.push({
          row: rowNum,
          studentNumber,
          message: `Invalid Floor "${rawFloor}" (must be 1–4)`,
        });
        continue;
      }

      // Validate Room
      const room = rawRoom.toUpperCase() as Room;
      if (!["A", "B", "C", "D"].includes(room)) {
        errors.push({
          row: rowNum,
          studentNumber,
          message: `Invalid Room "${rawRoom}" (must be A, B, C, or D)`,
        });
        continue;
      }

      validRecords.push({
        studentNumber,
        name,
        surname,
        block: blockStr as Block,
        floor,
        unit,
        room,
      });
    }

    setValidationResult({
      validRecords,
      errors,
      duplicates,
      summary: {
        totalRows: lines.length - startIndex,
        validCount: validRecords.length,
        errorCount: errors.length,
        duplicateCount: duplicates.length,
      },
    });
  };

  const handleCommitImport = () => {
    if (!validationResult || validationResult.validRecords.length === 0) return;

    // Apply valid records to units in state
    const currentUnits = [...units];
    let addedCount = 0;

    validationResult.validRecords.forEach((rec) => {
      // Find matching unit or assign to first unit matching block
      const targetUnit = currentUnits.find(
        (u) => u.block === rec.block && u.unitNumber === rec.unit,
      );

      if (targetUnit) {
        // Replace or add student to room
        const existingStudentIndex = targetUnit.students.findIndex((s) => s.room === rec.room);
        const newStudentEntry = {
          studentNumber: rec.studentNumber,
          name: rec.name,
          surname: rec.surname,
          room: rec.room,
          residenceStatus: "Active" as const,
        };

        if (existingStudentIndex >= 0) {
          targetUnit.students[existingStudentIndex] = newStudentEntry;
        } else {
          targetUnit.students.push(newStudentEntry);
        }
        targetUnit.occupancy = targetUnit.students.length;
        addedCount++;
      }
    });

    saveUnits(currentUnits);
    setUnits(currentUnits);

    recordAuditEvent({
      actorId: admin.id,
      actorName: `${admin.name} ${admin.surname}`,
      actorRole: "ADMIN",
      action: "STUDENT_BULK_IMPORT",
      targetType: "resident",
      targetId: `batch-${Date.now()}`,
      newValue: `${addedCount} student records committed`,
      reason: `Bulk student spreadsheet import verified by ${admin.name}`,
    });

    setImportSuccess(
      `Successfully processed and committed ${addedCount} student residence placement records!`,
    );
    setValidationResult(null);
    setCsvText("");
    loadData();
  };

  return (
    <AdminLayout activeNav="residents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Resident Directory & Student Importer
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student room placements, contacts, and execute bulk admissions spreadsheet
              imports.
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === "directory"
                  ? "bg-white text-[#0A1F3D] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Directory ({allResidents.length})
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "import"
                  ? "bg-white text-[#0050A0] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV Importer</span>
            </button>
          </div>
        </div>

        {importSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Tab 1: Directory */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search student number, name, or unit..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                />
              </div>

              <span className="text-xs text-slate-500 font-semibold">
                {filteredResidents.length} Students Listed
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Student Number</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Residence Placement</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResidents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No residents match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredResidents.map((student) => (
                        <tr
                          key={student.studentNumber}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {student.studentNumber}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {student.name} {student.surname}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {student.block} · Unit {student.unitNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="w-6 h-6 rounded-md bg-[#0050A0]/10 text-[#0050A0] font-bold text-xs flex items-center justify-center border border-[#0050A0]/20">
                              {student.room}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                              {student.residenceStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Student CSV Importer */}
        {activeTab === "import" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0050A0]" />
                  <h2 className="text-base font-bold text-[#0A1F3D]">
                    Bulk Student Allocation Importer
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCsvText(sampleCsv)}
                  className="text-xs font-bold text-[#0050A0] hover:underline cursor-pointer"
                >
                  Load Sample Data
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Paste student placement records below in CSV format with columns: <br />
                <span className="font-mono text-slate-700 font-semibold">
                  StudentNumber, Name, Surname, Block, Floor, Unit, Room
                </span>
              </p>

              <div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="221894032,Thandiwe,Mahlangu,Block A,1,101,A&#10;220394812,Kabelo,Nkosi,Block B,2,204,B..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-slate-400">
                  Pre-import validation verifies formats, unit bounds, and duplicates.
                </span>
                <button
                  type="button"
                  onClick={handleValidateCsv}
                  disabled={!csvText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#0050A0] hover:bg-[#0A1F3D] text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Validate Spreadsheet</span>
                </button>
              </div>
            </div>

            {/* Validation Results Card */}
            {validationResult && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Validation Diagnostics Summary
                  </h3>
                  {validationResult.validRecords.length > 0 && (
                    <button
                      onClick={handleCommitImport}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Commit {validationResult.validRecords.length} Valid Records</span>
                    </button>
                  )}
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block">Total Rows</span>
                    <span className="text-xl font-bold text-slate-800 mt-0.5 block">
                      {validationResult.summary.totalRows}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <span className="font-semibold block">Ready to Import</span>
                    <span className="text-xl font-bold mt-0.5 block">
                      {validationResult.summary.validCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <span className="font-semibold block">Format Errors</span>
                    <span className="text-xl font-bold mt-0.5 block">
                      {validationResult.summary.errorCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                    <span className="font-semibold block">Duplicate Records</span>
                    <span className="text-xl font-bold mt-0.5 block">
                      {validationResult.summary.duplicateCount}
                    </span>
                  </div>
                </div>

                {/* Error details if any */}
                {(validationResult.errors.length > 0 || validationResult.duplicates.length > 0) && (
                  <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                    <span className="font-bold text-rose-900 block">Flagged Import Issues:</span>
                    {validationResult.errors.map((err, idx) => (
                      <p key={idx} className="text-rose-800 text-[11px]">
                        • Row {err.row}: {err.message}
                      </p>
                    ))}
                    {validationResult.duplicates.map((dup, idx) => (
                      <p key={idx} className="text-amber-800 text-[11px]">
                        • Row {dup.row}: Student #{dup.studentNumber} already exists in residence
                        directory.
                      </p>
                    ))}
                  </div>
                )}

                {/* Preview of Valid Records */}
                {validationResult.validRecords.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Verified Records Preview ({validationResult.validRecords.length}):
                    </span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Student Number</th>
                            <th className="py-2 px-3">Full Name</th>
                            <th className="py-2 px-3">Block / Unit</th>
                            <th className="py-2 px-3">Room</th>
                            <th className="py-2 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {validationResult.validRecords.map((rec) => (
                            <tr key={rec.studentNumber} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {rec.studentNumber}
                              </td>
                              <td className="py-2 px-3 text-slate-800">
                                {rec.name} {rec.surname}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {rec.block} · Unit {rec.unit}
                              </td>
                              <td className="py-2 px-3 font-bold text-[#0050A0]">{rec.room}</td>
                              <td className="py-2 px-3 text-right">
                                <span className="inline-flex items-center text-emerald-600 text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  <span>Verified</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
