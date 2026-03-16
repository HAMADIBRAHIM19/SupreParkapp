import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  bank_name: string | null;
  iban: string | null;
  holder_name: string | null;
  created_at: string;
  user_id: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      
      if (data && data.length > 0) {
        setIsAdmin(true);
      } else {
        navigate("/dashboard");
      }
      setChecking(false);
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRequests();
  }, [isAdmin]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setRequests(data);
      // Fetch profile names for unique user_ids
      const userIds = [...new Set(data.map(r => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach(p => { map[p.user_id] = p.full_name; });
          setProfilesMap(map);
        }
      }
    }
    setLoadingRequests(false);
  };

  const handleAction = async (id: string, newStatus: "approved" | "rejected") => {
    setProcessing(id);
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "approved" ? "تمت الموافقة" : "تم الرفض" });
      fetchRequests();
    }
    setProcessing(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-yellow-600 border-yellow-400">قيد الانتظار</Badge>;
      case "approved": return <Badge className="bg-green-600">تمت الموافقة</Badge>;
      case "rejected": return <Badge variant="destructive">مرفوض</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">لوحة تحكم المسؤول</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طلبات السحب</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد طلبات سحب</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العضو</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>البنك</TableHead>
                      <TableHead>الآيبان</TableHead>
                      <TableHead>اسم صاحب الحساب</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{profilesMap[req.user_id] || "—"}</TableCell>
                        <TableCell>{req.amount} ر.س</TableCell>
                        <TableCell>{req.bank_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{req.iban || "—"}</TableCell>
                        <TableCell>{req.holder_name || "—"}</TableCell>
                        <TableCell className="text-xs">{new Date(req.created_at).toLocaleDateString("ar-SA")}</TableCell>
                        <TableCell>{statusBadge(req.status)}</TableCell>
                        <TableCell>
                          {req.status === "pending" ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1"
                                disabled={processing === req.id}
                                onClick={() => handleAction(req.id, "approved")}
                              >
                                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                قبول
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                disabled={processing === req.id}
                                onClick={() => handleAction(req.id, "rejected")}
                              >
                                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                رفض
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
