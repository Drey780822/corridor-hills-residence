import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { getUnits, getExtendedRequests } from "@/lib/operations-service";
import type { UnitStructure, ExtendedMaintenanceRequest, Block } from "@/types/operations";
import {
  Building2,
  AlertTriangle,
  Users,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Flame,
  Search,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/admin/units/")({
  component: AdminUnitsPage,
});

export function AdminUnitsPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [units, setUnits] = useState<UnitStructure[]>([]);
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block>("Block F");
  const [floorFilter, setFloorFilter] = useState<"ALL" | number>("ALL");
  const [onlyOpenIssues, setOnlyOpenIssues] = useState(false);
  const [searchUnit, setSearchUnit] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    setUnits(getUnits());
    setRequests(getExtendedRequests());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  const blocks: Block[] = ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F"];

  // Filter units
  const blockUnits = units.filter((u) => u.block === selectedBlock);

  // Compute block statistics
  const totalUnits = blockUnits.length;
  const totalCapacity = blockUnits.reduce((acc, u) => acc + u.maxOccupancy, 0);
  const totalOccupancy = blockUnits.reduce((acc, u) => acc + u.occupancy, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  // Active tickets in this block
  const blockRequests = requests.filter((r) => {
    const isResolved = r.status === "resolved" || r.status === "closed" || r.status === "verified";
    if (isResolved) return false;
    return (
      r.location.toUpperCase().includes(selectedBlock.toUpperCase()) ||
      r.location.includes(selectedBlock.replace("Block ", ""))
    );
  });

  const filteredUnits = blockUnits.filter((u) => {
    if (floorFilter !== "ALL" && u.floor !== floorFilter) return false;
    if (onlyOpenIssues && u.openIssuesCount === 0) return false;
    if (searchUnit.trim()) {
      const q = searchUnit.toLowerCase();
      return u.unitNumber.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout activeNav="units">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Digital Twin: Residence Hierarchy
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live architectural mapping of all residential blocks, floors, and student units across
              Corridor Hills.
            </p>
          </div>
        </div>

        {/* Block Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/80 rounded-2xl">
          {blocks.map((b) => {
            const isSelected = selectedBlock === b;
            const bTickets = requests.filter(
              (r) =>
                r.status !== "resolved" &&
                r.status !== "closed" &&
                r.status !== "verified" &&
                (r.location.toUpperCase().includes(b.toUpperCase()) ||
                  r.location.includes(b.replace("Block ", ""))),
            ).length;

            return (
              <button
                key={b}
                onClick={() => setSelectedBlock(b)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#0050A0] text-white shadow-md"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{b}</span>
                {bTickets > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {bTickets}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Block Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Units</span>
            <p className="text-2xl font-black text-[#0A1F3D] mt-1">{totalUnits} Units</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across 4 Residential Floors</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Student Occupancy
            </span>
            <p className="text-2xl font-black text-[#0050A0] mt-1">
              {totalOccupancy} / {totalCapacity}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">{occupancyRate}% Capacity filled</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Open Tickets</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{blockRequests.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pending active maintenance</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Maintenance Status
            </span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {blockRequests.length === 0 ? "Clear" : "Active"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Fleet dispatched</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="font-semibold text-slate-600">Filter Floor:</span>
            {[
              { id: "ALL", label: "All Floors" },
              { id: 1, label: "Floor 1" },
              { id: 2, label: "Floor 2" },
              { id: 3, label: "Floor 3" },
              { id: 4, label: "Floor 4" },
            ].map((f) => (
              <button
                key={String(f.id)}
                onClick={() => setFloorFilter(f.id as "ALL" | number)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  floorFilter === f.id
                    ? "bg-[#0050A0] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <label className="flex items-center space-x-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyOpenIssues}
                onChange={(e) => setOnlyOpenIssues(e.target.checked)}
                className="rounded border-slate-300 text-[#0050A0] focus:ring-[#0050A0]"
              />
              <span>Only Units with Open Issues</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchUnit}
                onChange={(e) => setSearchUnit(e.target.value)}
                placeholder="Search unit..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0050A0]"
              />
            </div>
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUnits.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
              No units in {selectedBlock} match the filter criteria.
            </div>
          ) : (
            filteredUnits.map((unit) => {
              const hasIssues = unit.openIssuesCount > 0;
              const hasRecurring = unit.recurringAlert;

              return (
                <Link
                  key={unit.id}
                  to="/admin/units/$unitId"
                  params={{ unitId: unit.id }}
                  className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md hover:border-[#0050A0] transition-all flex flex-col justify-between space-y-3 ${
                    hasRecurring
                      ? "border-amber-300 ring-2 ring-amber-500/20"
                      : hasIssues
                        ? "border-blue-300"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-[#0A1F3D]">
                          Unit {unit.unitNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Floor {unit.floor}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{unit.id}</p>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {hasRecurring && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> RECURRING
                        </span>
                      )}
                      {hasIssues ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {unit.openIssuesCount} Issue(s)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Healthy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rooms Occupancy Pills */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Residents:</span>
                    <div className="flex items-center space-x-1">
                      {unit.rooms.map((room) => {
                        const student = unit.students.find((s) => s.room === room);
                        return (
                          <span
                            key={room}
                            title={student ? `${student.name} ${student.surname}` : "Vacant"}
                            className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                              student
                                ? "bg-[#0050A0]/10 text-[#0050A0] border border-[#0050A0]/20"
                                : "bg-slate-100 text-slate-400 border border-dashed border-slate-300"
                            }`}
                          >
                            {room}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Occupancy: {unit.occupancy} / {unit.maxOccupancy}
                    </span>
                    <span className="text-[#0050A0] font-bold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
