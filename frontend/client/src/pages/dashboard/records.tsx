import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Search,
  Plus,
  Clock,
  User,
  Stethoscope,
  Calendar as CalendarIcon,
  Activity,
  ArrowRightLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MedicalRecord, Patient, User as AppUser } from "@shared/schema";

export default function RecordsPage() {
  const [, navigate] = useLocation();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    visitType: "",
    diagnosis: "",
    treatmentPlan: "",
    allergies: "",
    vitals: "",
    labResults: "",
    notes: "",
  });

  const { data: records = [], isLoading: loadingRecords } = useQuery<MedicalRecord[]>({
    queryKey: ["/api/records"],
  });

  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: doctors = [] } = useQuery<AppUser[]>({
    queryKey: ["/api/doctors"],
  });

  const combinedDoctors = useMemo(() => {
    const list = [...doctors];
    try {
      const raw = localStorage.getItem("mediportal_user");
      if (raw) {
        const user = JSON.parse(raw);
        const alreadyExists = list.some((d) => d.id === user.id);
        if (!alreadyExists && user.firstName && user.lastName) {
          list.push({
            id: -1,
            firstName: user.firstName,
            lastName: user.lastName,
            specialty: user.specialty || "",
          } as AppUser);
        }
      }
    } catch {}
    return list;
  }, [doctors]);

  const createRecord = useMutation({
    mutationFn: (data: any) => {
      let doctorId = parseInt(data.doctorId);
      if (doctorId === -1) {
        try {
          const raw = localStorage.getItem("mediportal_user");
          if (raw) {
            const user = JSON.parse(raw);
            doctorId = user.id || 1;
          } else {
            doctorId = 1;
          }
        } catch {
          doctorId = 1;
        }
      }
      return apiRequest("POST", "/api/records", {
        ...data,
        patientId: parseInt(data.patientId),
        doctorId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/records"] });
      setDialogOpen(false);
      setForm({ patientId: "", doctorId: "", visitType: "", diagnosis: "", treatmentPlan: "", allergies: "", vitals: "", labResults: "", notes: "" });
    },
  });

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(patientSearch.toLowerCase());
  });

  const displayedRecords = selectedPatientId
    ? records.filter((r) => r.patientId === selectedPatientId)
    : records;

  const getPatientName = (patientId: number) => {
    const p = patients.find((pat) => pat.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : `Patient #${patientId}`;
  };

  const getDoctorName = (doctorId: number) => {
    const d = combinedDoctors.find((doc) => doc.id === doctorId) || doctors.find((doc) => doc.id === doctorId);
    return d ? `Dr. ${d.firstName} ${d.lastName}` : `Doctor #${doctorId}`;
  };

  const isLoading = loadingRecords || loadingPatients;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Medical Records</h1>
            <p className="text-slate-500 mt-2">View and manage patient clinical documentation.</p>
          </div>
          <Button
            data-testid="button-new-record"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Record
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filter - patient selection */}
          <Card className="w-full md:w-80 h-fit border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Patient Select</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="input-search-patient-sidebar"
                  placeholder="Find patient..."
                  className="pl-10"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                {loadingPatients ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))
                ) : (
                  <>
                    <div
                      data-testid="button-all-patients"
                      className={`p-3 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                        selectedPatientId === null
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                      onClick={() => setSelectedPatientId(null)}
                    >
                      All Patients
                      {selectedPatientId === null && (
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800 hover:bg-blue-200 ml-2">Selected</Badge>
                      )}
                    </div>
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        data-testid={`button-select-patient-${patient.id}`}
                        className={`p-3 rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center justify-between ${
                          selectedPatientId === patient.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        {patient.firstName} {patient.lastName}
                        {selectedPatientId === patient.id && (
                          <Badge variant="secondary" className="bg-blue-200 text-blue-800 hover:bg-blue-200">Selected</Badge>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
            {selectedPatientId !== null && (
              <div className="px-6 pb-6">
                <Button
                  data-testid="button-process-to-referral"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  onClick={() => {
                    const patient = patients.find((p) => p.id === selectedPatientId);
                    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "";
                    const params = new URLSearchParams();
                    params.set("patientId", selectedPatientId.toString());
                    params.set("notes", `Referral for ${patientName}`);
                    navigate(`/dashboard/referrals?${params.toString()}`);
                  }}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Process to Referral
                </Button>
              </div>
            )}
          </Card>

          {/* Records List */}
          <div className="flex-1 space-y-6">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-6 w-64" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : displayedRecords.length === 0 ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="py-12 text-center text-slate-500" data-testid="text-no-records">
                  No medical records found.
                </CardContent>
              </Card>
            ) : (
              displayedRecords.map((record) => (
                <Card key={record.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-record-${record.id}`}>
                  <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 hover:bg-blue-700">{record.visitType || "Visit"}</Badge>
                          <span className="text-sm text-slate-500 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" /> {record.creationDate ? new Date(record.creationDate).toLocaleDateString() : "—"}
                          </span>
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          {record.diagnosis || "No diagnosis"}
                        </CardTitle>
                        <p className="text-sm text-slate-500">Patient: {getPatientName(record.patientId)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        data-testid={`button-send-referral-${record.id}`}
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("patientId", record.patientId.toString());
                          params.set("notes", `Referral for ${record.diagnosis || "consultation"} - ${record.visitType || "Visit"}`);
                          navigate(`/dashboard/referrals?${params.toString()}`);
                        }}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                        Send Referral
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> Treatment Plan
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {record.treatmentPlan || "No treatment plan recorded."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Vitals
                        </h4>
                        <p className="text-sm font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                          {record.vitals || "No vitals recorded."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Notes</h4>
                        <p className="text-sm text-slate-600 italic">
                          "{record.notes || "No notes."}"
                        </p>
                      </div>
                      <div className="pt-4 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 mt-4">
                        <User className="w-3 h-3" />
                        Recorded by <span className="font-medium text-slate-600">{getDoctorName(record.doctorId)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Medical Record</DialogTitle>
            <DialogDescription>Create a new medical record entry.</DialogDescription>
          </DialogHeader>
          <form
            data-testid="form-new-record"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.patientId || !form.doctorId || !form.visitType || !form.diagnosis) return;
              createRecord.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rec-patientId">Patient <span className="text-red-500">*</span></Label>
                <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })} required>
                  <SelectTrigger data-testid="select-record-patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()} data-testid={`select-patient-option-${p.id}`}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-doctorId">Doctor <span className="text-red-500">*</span></Label>
                <Select value={form.doctorId} onValueChange={(v) => setForm({ ...form, doctorId: v })} required>
                  <SelectTrigger data-testid="select-record-doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {combinedDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()} data-testid={`select-doctor-option-${d.id}`}>
                        Dr. {d.firstName} {d.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rec-visitType">Visit Type <span className="text-red-500">*</span></Label>
                <Input data-testid="input-visitType" id="rec-visitType" value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })} placeholder="e.g. Check-up" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-diagnosis">Diagnosis <span className="text-red-500">*</span></Label>
                <Input data-testid="input-diagnosis" id="rec-diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-treatmentPlan">Treatment Plan</Label>
              <Textarea data-testid="input-treatmentPlan" id="rec-treatmentPlan" value={form.treatmentPlan} onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rec-vitals">Vitals</Label>
                <Input data-testid="input-vitals" id="rec-vitals" value={form.vitals} onChange={(e) => setForm({ ...form, vitals: e.target.value })} placeholder="BP: 120/80 | HR: 72" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-allergies">Allergies</Label>
                <Input data-testid="input-allergies" id="rec-allergies" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-notes">Notes</Label>
              <Textarea data-testid="input-notes" id="rec-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="button-submit-record" className="bg-blue-600 hover:bg-blue-700" disabled={createRecord.isPending}>
                {createRecord.isPending ? "Creating..." : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
