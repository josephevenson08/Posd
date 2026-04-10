import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Clock, CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
import type { Referral, Patient, User } from "@shared/schema";

export default function ReferralsPage() {
  const searchString = useSearch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "sent" | "received">("all");
  const [form, setForm] = useState({
    patientId: "",
    referringDoctorId: "",
    referredDoctorId: "",
    dateTime: "",
    notes: "",
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("mediportal_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    // Keep account context in sync when switching users during a running session.
    const syncCurrentUser = () => {
      try {
        const raw = localStorage.getItem("mediportal_user");
        setCurrentUser(raw ? JSON.parse(raw) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    syncCurrentUser();
    window.addEventListener("focus", syncCurrentUser);
    window.addEventListener("storage", syncCurrentUser);
    return () => {
      window.removeEventListener("focus", syncCurrentUser);
      window.removeEventListener("storage", syncCurrentUser);
    };
  }, []);

  const { data: referrals = [], isLoading: loadingReferrals } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Doctors are now users
  const { data: doctors = [] } = useQuery<User[]>({
    queryKey: ["/api/doctors"],
  });

  const myDoctorId = currentUser?.id ?? null;

  const [lastPrefillSearch, setLastPrefillSearch] = useState("");

  useEffect(() => {
    if (!currentUser || !searchString || searchString === lastPrefillSearch) return;
    const params = new URLSearchParams(searchString);
    const patientId = params.get("patientId");
    const notes = params.get("notes");
    if (patientId) {
      const now = new Date().toISOString().slice(0, 16);
      setForm({
        patientId,
        referringDoctorId: currentUser.id.toString(),
        referredDoctorId: "",
        dateTime: now,
        notes: notes || "",
      });
      setDialogOpen(true);
      setLastPrefillSearch(searchString);
      window.history.replaceState({}, "", "/dashboard/referrals");
    }
  }, [searchString, currentUser, lastPrefillSearch, myDoctorId]);

  const createReferral = useMutation({
    mutationFn: (data: any) => {
      return apiRequest("POST", "/api/referrals", {
        ...data,
        patientId: parseInt(data.patientId),
        referringDoctorId: myDoctorId || parseInt(data.referringDoctorId),
        referredDoctorId: parseInt(data.referredDoctorId),
        dateTime: new Date(data.dateTime).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals"] });
      setDialogOpen(false);
      setForm({ patientId: "", referringDoctorId: "", referredDoctorId: "", dateTime: "", notes: "" });
    },
  });

  const acceptReferral = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/referrals/${id}`, { status: "accepted" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/referrals"] }); },
  });

  const completeReferral = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/referrals/${id}`, { status: "completed" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/referrals"] }); },
  });

  const getPatientName = (patientId: number) => {
    const p = patients.find((pat) => pat.id === patientId);
    return p ? `${p.firstName} ${p.lastName}` : `Patient #${patientId}`;
  };

  const getDoctorLabel = (doctorId: number) => {
    const d = doctors.find((doc) => doc.id === doctorId);
    return d ? `Dr. ${d.firstName} ${d.lastName}${d.specialty ? ` (${d.specialty})` : ""}` : `Doctor #${doctorId}`;
  };

  const isMyReferral = (r: Referral) => {
    if (!myDoctorId) return true;
    return r.referringDoctorId === myDoctorId || r.referredDoctorId === myDoctorId;
  };

  const filteredReferrals = useMemo(() => {
    let list = referrals.filter(isMyReferral);
    if (filterTab === "sent") list = list.filter((r) => myDoctorId && r.referringDoctorId === myDoctorId);
    else if (filterTab === "received") list = list.filter((r) => myDoctorId && r.referredDoctorId === myDoctorId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const patientName = getPatientName(r.patientId).toLowerCase();
        const fromDoc = getDoctorLabel(r.referringDoctorId).toLowerCase();
        const toDoc = getDoctorLabel(r.referredDoctorId).toLowerCase();
        return patientName.includes(q) || fromDoc.includes(q) || toDoc.includes(q) || (r.notes?.toLowerCase().includes(q));
      });
    }
    return list;
  }, [referrals, filterTab, search, patients, doctors]);

  const availableReferralDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (!currentUser) return true;
      // Compare as strings to avoid number/string id mismatches.
      return String(d.id) !== String(currentUser.id);
    });
  }, [doctors, currentUser]);

  const getReferralDirection = (r: Referral) => {
    if (!myDoctorId) return "unknown";
    if (r.referringDoctorId === myDoctorId) return "sent";
    if (r.referredDoctorId === myDoctorId) return "received";
    return "unknown";
  };

  const getStatusBadge = (status: string | null) => {
    const s = status || "pending";
    switch (s) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "accepted":
        return <Badge className="bg-blue-600 hover:bg-blue-700"><CheckCircle2 className="w-3 h-3 mr-1" />Accepted</Badge>;
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const openCreateDialog = () => {
    const now = new Date().toISOString().slice(0, 16);
    setForm({
      patientId: "",
      referringDoctorId: currentUser ? currentUser.id.toString() : "",
      referredDoctorId: "",
      dateTime: now,
      notes: "",
    });
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Referrals</h1>
            <p className="text-slate-500 mt-2">Manage patient referrals to other specialists.</p>
          </div>
          <Button
            data-testid="button-create-referral"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Referral
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant={filterTab === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterTab("all")} className={filterTab === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}>All</Button>
          <Button variant={filterTab === "sent" ? "default" : "outline"} size="sm" onClick={() => setFilterTab("sent")} className={filterTab === "sent" ? "bg-blue-600 hover:bg-blue-700" : ""}>
            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />Sent
          </Button>
          <Button variant={filterTab === "received" ? "default" : "outline"} size="sm" onClick={() => setFilterTab("received")} className={filterTab === "received" ? "bg-blue-600 hover:bg-blue-700" : ""}>
            <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" />Received
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search referrals..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {loadingReferrals ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white">
                    <div className="flex gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredReferrals.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No referrals found.</p>
              ) : (
                filteredReferrals.map((referral) => {
                  const direction = getReferralDirection(referral);
                  const isIncoming = direction === "received";
                  return (
                    <div key={referral.id} className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        isIncoming ? "bg-orange-100 text-orange-600" :
                        referral.status === "pending" ? "bg-amber-100 text-amber-600" :
                        referral.status === "accepted" ? "bg-blue-100 text-blue-600" :
                        "bg-green-100 text-green-600"
                      }`}>
                        {isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{getPatientName(referral.patientId)}</h3>
                            <Badge variant="outline" className={isIncoming ? "text-orange-600 border-orange-200 bg-orange-50 text-xs" : "text-blue-600 border-blue-200 bg-blue-50 text-xs"}>
                              {isIncoming ? "Incoming" : "Sent"}
                            </Badge>
                          </div>
                          {getStatusBadge(referral.status)}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-500 mt-2">
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">From</span>
                            <span className="text-slate-700">{getDoctorLabel(referral.referringDoctorId)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">To</span>
                            <span className="text-slate-700">{getDoctorLabel(referral.referredDoctorId)}</span>
                          </div>
                        </div>

                        {referral.notes && (
                          <div className="pt-3 mt-3 border-t border-slate-50">
                            <p className="text-sm text-slate-600"><span className="font-medium text-slate-900">Note:</span> {referral.notes}</p>
                          </div>
                        )}

                        {referral.dateTime && (
                          <p className="text-xs text-slate-400 mt-1">Date: {new Date(referral.dateTime).toLocaleDateString()}</p>
                        )}
                      </div>

                      <div className="flex sm:flex-col justify-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                        {isIncoming && referral.status === "pending" && (
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => acceptReferral.mutate(referral.id)} disabled={acceptReferral.isPending}>Accept</Button>
                        )}
                        {isIncoming && referral.status === "accepted" && (
                          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => completeReferral.mutate(referral.id)} disabled={completeReferral.isPending}>Complete</Button>
                        )}
                        {!isIncoming && referral.status === "pending" && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">Awaiting Response</Badge>
                        )}
                        {!isIncoming && referral.status === "accepted" && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">Accepted</Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Referral</DialogTitle>
            <DialogDescription>Create a new patient referral to a specialist.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.patientId || !form.referredDoctorId || !form.dateTime || !currentUser) return;
              createReferral.mutate(form);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Patient <span className="text-red-500">*</span></Label>
              <Select value={form.patientId} onValueChange={(v) => setForm({ ...form, patientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Referring Doctor</Label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                {currentUser ? `Dr. ${currentUser.firstName} ${currentUser.lastName}${currentUser.specialty ? ` (${currentUser.specialty})` : ""}` : "Loading..."}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Refer To <span className="text-red-500">*</span></Label>
                <Select value={form.referredDoctorId} onValueChange={(v) => setForm({ ...form, referredDoctorId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select specialist to refer to" /></SelectTrigger>
                  <SelectContent>
                  {availableReferralDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        Dr. {d.firstName} {d.lastName}{d.specialty ? ` (${d.specialty})` : ""}
                      </SelectItem>
                    ))}
                  {availableReferralDoctors.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-slate-500">No other doctors available</div>
                  )}
                  </SelectContent>
                </Select>
              </div>

            <div className="space-y-2">
              <Label>Date & Time <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" required value={form.dateTime} onChange={(e) => setForm({ ...form, dateTime: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Reason for referral..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createReferral.isPending || !form.patientId || !form.referredDoctorId || !form.dateTime || !currentUser}>
                {createReferral.isPending ? "Creating..." : "Create Referral"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
