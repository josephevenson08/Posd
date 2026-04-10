import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Patient } from "@shared/schema";

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const formatName = (value: string) => value.replace(/[^a-zA-Z\s\-']/g, "");
const formatEmail = (value: string) => value.replace(/[^a-zA-Z0-9@._\-+]/g, "");
const formatCity = (value: string) => value.replace(/[^a-zA-Z\s]/g, "");
const formatState = (value: string) => value.replace(/[^a-zA-Z]/g, "");
const formatZip = (value: string) => value.replace(/[^0-9]/g, "");

const emptyForm = {
  firstName: "", lastName: "", dob: "", gender: "",
  email: "", phone: "",
  street: "", city: "", state: "", zip: "",
  emergencyName: "", emergencyPhone: "",
};

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createPatient = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/patients", {
      ...data,
      dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setDialogOpen(false);
      setForm({ ...emptyForm });
    },
  });

  const updatePatient = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/patients/${id}`, {
      ...data,
      dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setEditPatient(null);
    },
  });

  const deletePatient = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
    },
  });

  const filteredPatients = patients.filter((p) => {
    if (genderFilter !== "All" && p.gender !== genderFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    return name.includes(q) || (p.email?.toLowerCase().includes(q)) || (p.phone?.includes(q));
  });

  const openEditDialog = (patient: Patient) => {
    setEditForm({
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dob: patient.dob ? String(patient.dob).split("T")[0] : "",
      gender: patient.gender || "",
      email: patient.email || "",
      phone: patient.phone || "",
      street: patient.street || "",
      city: patient.city || "",
      state: patient.state || "",
      zip: patient.zip || "",
      emergencyName: patient.emergencyName || "",
      emergencyPhone: patient.emergencyPhone || "",
    });
    setEditPatient(patient);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patients</h1>
            <p className="text-slate-500 mt-2">Manage patient records and information.</p>
          </div>
          <Button
            data-testid="button-add-patient"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Patient
          </Button>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  data-testid="input-search-patients"
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-slate-600" data-testid="button-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter{genderFilter !== "All" ? `: ${genderFilter}` : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 px-2 py-1">Gender</p>
                    {["All", "Male", "Female", "Other"].map((option) => (
                      <button
                        key={option}
                        data-testid={`filter-gender-${option.toLowerCase()}`}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                          genderFilter === option ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                        }`}
                        onClick={() => { setGenderFilter(option); setFilterOpen(false); }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-100 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="font-semibold text-slate-600">DOB</TableHead>
                    <TableHead className="font-semibold text-slate-600">Gender</TableHead>
                    <TableHead className="font-semibold text-slate-600">Contact</TableHead>
                    <TableHead className="font-semibold text-slate-600">Email</TableHead>
                    <TableHead className="text-right font-semibold text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500" data-testid="text-no-patients">
                        No patients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-slate-50/50 transition-colors" data-testid={`row-patient-${patient.id}`}>
                        <TableCell className="font-medium text-slate-900">
                          {patient.firstName} {patient.lastName}
                        </TableCell>
                        <TableCell>{patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            patient.gender === "Female" ? "bg-pink-50 text-pink-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {patient.gender || "—"}
                          </span>
                        </TableCell>
                        <TableCell><span className="text-sm">{patient.phone || "—"}</span></TableCell>
                        <TableCell><span className="text-sm text-slate-600">{patient.email || "—"}</span></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600" data-testid={`button-actions-${patient.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem data-testid={`button-view-${patient.id}`} onClick={() => setViewPatient(patient)}>
                                <Eye className="w-4 h-4 mr-2 text-slate-500" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`button-edit-${patient.id}`} onClick={() => openEditDialog(patient)}>
                                <Edit className="w-4 h-4 mr-2 text-slate-500" /> Edit Record
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 focus:text-red-600" data-testid={`button-delete-${patient.id}`} onClick={() => deletePatient.mutate(patient.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Fill in patient details below.</DialogDescription>
          </DialogHeader>
          <form
            data-testid="form-add-patient"
            onSubmit={(e) => { e.preventDefault(); createPatient.mutate(form); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input id="firstName" required maxLength={50} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: formatName(e.target.value) })} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input id="lastName" required maxLength={50} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: formatName(e.target.value) })} placeholder="Doe" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth <span className="text-red-500">*</span></Label>
                <Input id="dob" type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" maxLength={100} value={form.email} onChange={(e) => setForm({ ...form, email: formatEmail(e.target.value) })} placeholder="patient@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input id="phone" type="tel" required maxLength={14} value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })} placeholder="(555) 555-5555" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input id="street" maxLength={100} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" maxLength={64} value={form.city} onChange={(e) => setForm({ ...form, city: formatCity(e.target.value) })} placeholder="Springfield" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: formatState(e.target.value).toUpperCase() })} placeholder="IL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input id="zip" maxLength={5} value={form.zip} onChange={(e) => setForm({ ...form, zip: formatZip(e.target.value) })} placeholder="62701" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Emergency Contact</Label>
                <Input id="emergencyName" maxLength={100} value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: formatName(e.target.value) })} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                <Input id="emergencyPhone" type="tel" maxLength={14} value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: formatPhoneNumber(e.target.value) })} placeholder="(555) 555-5555" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createPatient.isPending}>
                {createPatient.isPending ? "Adding..." : "Add Patient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={!!viewPatient} onOpenChange={(open) => { if (!open) setViewPatient(null); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-view-patient">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>Read-only view of patient information.</DialogDescription>
          </DialogHeader>
          {viewPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">First Name</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.firstName}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Name</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Date of Birth</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.dob ? new Date(viewPatient.dob).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Gender</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.gender || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.email || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Phone</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.phone || "—"}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Street Address</Label>
                <p className="text-sm font-medium text-slate-900">{viewPatient.street || "—"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">City</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.city || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">State</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.state || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Zip Code</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.zip || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Emergency Contact</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.emergencyName || "—"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Emergency Phone</Label>
                  <p className="text-sm font-medium text-slate-900">{viewPatient.emergencyPhone || "—"}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewPatient(null)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={!!editPatient} onOpenChange={(open) => { if (!open) setEditPatient(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-patient">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Update patient information below.</DialogDescription>
          </DialogHeader>
          {editPatient && (
            <form
              data-testid="form-edit-patient"
              onSubmit={(e) => { e.preventDefault(); updatePatient.mutate({ id: editPatient.id, data: editForm }); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input id="edit-firstName" required maxLength={50} value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: formatName(e.target.value) })} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input id="edit-lastName" required maxLength={50} value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: formatName(e.target.value) })} placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dob">Date of Birth <span className="text-red-500">*</span></Label>
                  <Input id="edit-dob" type="date" required value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender <span className="text-red-500">*</span></Label>
                  <Select value={editForm.gender} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" maxLength={100} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: formatEmail(e.target.value) })} placeholder="patient@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone <span className="text-red-500">*</span></Label>
                  <Input id="edit-phone" type="tel" required maxLength={14} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: formatPhoneNumber(e.target.value) })} placeholder="(555) 555-5555" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-street">Street Address</Label>
                <Input id="edit-street" maxLength={100} value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" maxLength={64} value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: formatCity(e.target.value) })} placeholder="Springfield" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" maxLength={2} value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: formatState(e.target.value).toUpperCase() })} placeholder="IL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zip">Zip Code</Label>
                  <Input id="edit-zip" maxLength={5} value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: formatZip(e.target.value) })} placeholder="62701" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyName">Emergency Contact</Label>
                  <Input id="edit-emergencyName" maxLength={100} value={editForm.emergencyName} onChange={(e) => setEditForm({ ...editForm, emergencyName: formatName(e.target.value) })} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyPhone">Emergency Phone</Label>
                  <Input id="edit-emergencyPhone" type="tel" maxLength={14} value={editForm.emergencyPhone} onChange={(e) => setEditForm({ ...editForm, emergencyPhone: formatPhoneNumber(e.target.value) })} placeholder="(555) 555-5555" />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditPatient(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updatePatient.isPending}>
                  {updatePatient.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}