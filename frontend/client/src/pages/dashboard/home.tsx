import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Patient, Referral } from "@shared/schema";

export default function DashboardHome() {
  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: referrals = [], isLoading: loadingReferrals } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  const isLoading = loadingPatients || loadingReferrals;
  const pendingReferrals = referrals.filter((r) => r.status === "pending");

  const stats = [
    {
      title: "Total Patients",
      value: patients.length.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Pending Referrals",
      value: pendingReferrals.length.toString(),
      change: `${pendingReferrals.length}`,
      trend: pendingReferrals.length > 0 ? ("up" as const) : ("down" as const),
      icon: Activity,
      color: "bg-amber-500",
    },
  ];

  const recentPatients = patients.slice(0, 4);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-2">Overview of your practice performance and daily activities.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <Card key={i} data-testid={`stat-card-${i}`} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6 flex items-center justify-between">
                {isLoading ? (
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-slate-500" data-testid={`stat-title-${i}`}>{stat.title}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <h3 className="text-2xl font-bold text-slate-900" data-testid={`stat-value-${i}`}>{stat.value}</h3>
                        {"change" in stat && "trend" in stat && (
                          <span className={`text-xs font-medium flex items-center ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                            {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                      <stat.icon className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm col-span-1" data-testid="card-recent-patients">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Patients</CardTitle>
              <Link href="/dashboard/patients">
                <Button variant="ghost" size="sm" className="text-blue-600" data-testid="link-view-all-patients">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))
                ) : recentPatients.length === 0 ? (
                  <div className="text-center py-8" data-testid="text-no-recent-patients">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No patients added yet.</p>
                  </div>
                ) : (
                  recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between group" data-testid={`recent-patient-row-${patient.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
                        <div>
                          <p className="font-medium text-slate-900" data-testid={`text-patient-name-${patient.id}`}>{patient.firstName} {patient.lastName}</p>
                          <p className="text-sm text-slate-500" data-testid={`text-patient-gender-${patient.id}`}>{patient.gender || "-"}</p>
                        </div>
                      </div>
                      <p className="font-medium text-slate-900" data-testid={`text-patient-phone-${patient.id}`}>{patient.phone || "-"}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 pb-6 border-l-2 border-slate-100 pl-4 last:pb-0 relative">
                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="space-y-1 w-full">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))
                ) : referrals.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4" data-testid="text-no-activity">No recent activity.</p>
                ) : (
                  referrals.slice(0, 3).map((referral) => {
                    const patient = patients.find((p) => p.id === referral.patientId);
                    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${referral.patientId}`;
                    return (
                      <div key={referral.id} className="flex gap-4 pb-6 border-l-2 border-slate-100 pl-4 last:pb-0 relative" data-testid={`activity-row-${referral.id}`}>
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                        <div>
                          <p className="text-sm text-slate-500 mb-1">
                            {referral.dateTime ? new Date(referral.dateTime).toLocaleDateString() : "Recently"}
                          </p>
                          <p className="font-medium text-slate-900">
                            Referral {referral.status} for <span className="text-blue-600">{patientName}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
