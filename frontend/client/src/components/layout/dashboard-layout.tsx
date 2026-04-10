import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Stethoscope, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  Menu,
  Clock,
  CheckCircle2,
  UserPlus,
  AlertCircle,
  ShieldCheck,
  ArrowRightLeft
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Patient, Referral, User } from "@shared/schema";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("mediportal_user");
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  // Live clock — updates every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: allReferrals = [] } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const { data: allDoctors = [] } = useQuery<User[]>({
    queryKey: ["/api/doctors"],
  });

  const myDoctorId = useMemo(() => {
    if (!user) return null;
    const match = allDoctors.find(
      (d) => d.firstName === user.firstName && d.lastName === user.lastName
    );
    return match ? match.id : user.id;
  }, [user, allDoctors]);

  const incomingReferralNotifications = useMemo(() => {
    if (!myDoctorId) return [];
    return allReferrals.filter(
      (r) => r.referredDoctorId === myDoctorId && r.status === "pending"
    );
  }, [allReferrals, myDoctorId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPatients
      .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, allPatients]);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const handleSignOut = () => {
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: user?.username }),
    }).catch(() => undefined);
    localStorage.removeItem("mediportal_user");
    navigate("/login");
  };

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Patients", icon: Users, href: "/dashboard/patients" },
    { label: "Medical Records", icon: FileText, href: "/dashboard/records" },
    { label: "Referrals", icon: Stethoscope, href: "/dashboard/referrals" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">MediPortal</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10 border border-slate-700">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "DR"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user ? `Dr. ${user.lastName}` : "Doctor"}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.specialty?.replace("-", " ") || "General"}</p>
          </div>
        </div>
        {/* Sign Out button now opens confirmation dialog instead of navigating directly */}
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-2"
          onClick={() => setLogoutDialogOpen(true)}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-slate-800 bg-slate-900">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-slate-500"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>
            
            <div className="relative hidden sm:block w-96" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                data-testid="input-global-search"
                placeholder="Search patients..."
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {searchFocused && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No patients found</div>
                  ) : (
                    searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        data-testid={`search-result-patient-${patient.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchFocused(false);
                          navigate("/dashboard/patients");
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{patient.firstName} {patient.lastName}</p>
                          {patient.email && <p className="text-xs text-slate-400">{patient.email}</p>}
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs font-medium">Patient</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="tabular-nums">{formattedTime}</span>
            </div>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-blue-600 hover:bg-blue-50" data-testid="button-notifications">
                  <Bell className="w-5 h-5" />
                  {incomingReferralNotifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                      {incomingReferralNotifications.length}
                    </span>
                  )}
                  {incomingReferralNotifications.length === 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0" data-testid="dropdown-notifications">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {incomingReferralNotifications.map((ref) => {
                    const patient = allPatients.find((p) => p.id === ref.patientId);
                    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${ref.patientId}`;
                    return (
                      <div key={`ref-${ref.id}`} className="p-3 hover:bg-blue-50 border-b border-slate-50 flex gap-3 cursor-pointer" onClick={() => navigate("/dashboard/referrals")}>
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">New referral for <span className="font-medium">{patientName}</span></p>
                          <p className="text-xs text-slate-400 mt-0.5">Pending your review</p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">Welcome to <span className="font-medium">MediPortal</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">Just now</p>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 border-b border-slate-50 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">System is <span className="font-medium">fully operational</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">2 min ago</p>
                    </div>
                  </div>
                  <div className="p-3 hover:bg-slate-50 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">No critical alerts at this time</p>
                      <p className="text-xs text-slate-400 mt-0.5">1 hour ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100 text-center">
                  <p
                    className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                    data-testid="link-view-all-notifications"
                    onClick={() => setNotificationsOpen(true)}
                  >
                    View all notifications
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* All Notifications Dialog */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-all-notifications">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">All Notifications</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-1">
            {incomingReferralNotifications.map((ref) => {
              const patient = allPatients.find((p) => p.id === ref.patientId);
              const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${ref.patientId}`;
              return (
                <div key={`ref-dialog-${ref.id}`} className="p-3 rounded-lg hover:bg-orange-50 flex gap-3 border border-orange-200 bg-orange-50/50 cursor-pointer" onClick={() => { setNotificationsOpen(false); navigate("/dashboard/referrals"); }}>
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">New referral for <span className="font-medium">{patientName}</span></p>
                    <p className="text-xs text-orange-500 mt-0.5 font-medium">Action required - pending your review</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs self-center">New</Badge>
                </div>
              );
            })}
            <div className="p-3 rounded-lg hover:bg-slate-50 flex gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">Welcome to <span className="font-medium">MediPortal</span></p>
                <p className="text-xs text-slate-400 mt-0.5">Just now</p>
              </div>
            </div>
            <div className="p-3 rounded-lg hover:bg-slate-50 flex gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">System is <span className="font-medium">fully operational</span></p>
                <p className="text-xs text-slate-400 mt-0.5">2 min ago</p>
              </div>
            </div>
            <div className="p-3 rounded-lg hover:bg-slate-50 flex gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">No critical alerts at this time</p>
                <p className="text-xs text-slate-400 mt-0.5">1 hour ago</p>
              </div>
            </div>
            <div className="p-3 rounded-lg hover:bg-slate-50 flex gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700">Your account security is <span className="font-medium">up to date</span></p>
                <p className="text-xs text-slate-400 mt-0.5">3 hours ago</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500" />
              Sign Out
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log back in to access MediPortal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSignOut}
            >
              Yes, Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
