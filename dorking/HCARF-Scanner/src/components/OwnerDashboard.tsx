import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, LogOut, KeyRound, FileText, Settings, Eye, Shield, Edit3, Zap, Trash2 } from "lucide-react";

export default function OwnerDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [tab, setTab] = useState<'users'|'logs'|'scanHistory'|'settings'|'password'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<string>("");
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Fetch users, logs, scan history (mocked for now)
  const fetchUsers = async () => {
    setLoading(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setUsers([
        { email: "user1@example.com", role: "user", created: "2025-07-01", active: true },
        { email: "user2@example.com", role: "user", created: "2025-07-05", active: false },
      ]);
      setLoading(false);
    }, 600);
  };
  const fetchLogs = async () => {
    setLoading(true);
    setTimeout(() => {
      setLogs("[2025-07-10] user1@example.com scanned example.com\n[2025-07-10] user2@example.com failed login");
      setLoading(false);
    }, 600);
  };
  const fetchScanHistory = async () => {
    setLoading(true);
    setTimeout(() => {
      setScanHistory([
        { user: "user1@example.com", domain: "example.com", date: "2025-07-10", result: "2 critical, 1 high" },
        { user: "user2@example.com", domain: "test.com", date: "2025-07-09", result: "No issues" },
      ]);
      setLoading(false);
    }, 600);
  };

  // Password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess(""); setPwError("");
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/owner/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPwSuccess("Password updated successfully.");
      setNewPassword("");
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tab content
  let content = null;
  if (tab === 'users') {
    content = (
      <Card className="bg-slate-800/60 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-400" /> User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchUsers} variant="outline" className="mb-4">Refresh List</Button>
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.email} className="flex items-center justify-between bg-slate-700/60 p-3 rounded">
                  <div>
                    <span className="text-white font-medium">{u.email}</span>
                    <Badge className="ml-2 bg-cyan-600">{u.role}</Badge>
                    <span className="ml-2 text-xs text-gray-400">{u.created}</span>
                    {!u.active && <Badge className="ml-2 bg-red-600">Blocked</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-green-400 text-green-300" title="Unblock"><Shield /></Button>
                    <Button size="sm" variant="outline" className="border-red-400 text-red-300" title="Block"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } else if (tab === 'logs') {
    content = (
      <Card className="bg-slate-800/60 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-yellow-400" /> System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchLogs} variant="outline" className="mb-4">Refresh Logs</Button>
          {loading ? <Loader2 className="animate-spin" /> : (
            <pre className="bg-slate-900/80 text-gray-200 p-3 rounded max-h-64 overflow-y-auto">{logs}</pre>
          )}
        </CardContent>
      </Card>
    );
  } else if (tab === 'scanHistory') {
    content = (
      <Card className="bg-slate-800/60 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-pink-400" /> Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchScanHistory} variant="outline" className="mb-4">Refresh History</Button>
          {loading ? <Loader2 className="animate-spin" /> : (
            <div className="space-y-2">
              {scanHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-700/60 p-3 rounded">
                  <div>
                    <span className="text-white font-medium">{h.user}</span>
                    <span className="ml-2 text-cyan-300">{h.domain}</span>
                    <span className="ml-2 text-xs text-gray-400">{h.date}</span>
                  </div>
                  <span className="text-pink-400 text-sm">{h.result}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } else if (tab === 'settings') {
    content = (
      <Card className="bg-slate-800/60 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-purple-400" /> System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-300">Advanced system settings and AI config coming soon.</div>
        </CardContent>
      </Card>
    );
  } else if (tab === 'password') {
    content = (
      <Card className="bg-slate-800/60 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-green-400" /> Change Owner Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
            <Input
              type="password"
              placeholder="New Password (min 8 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
            {pwSuccess && <Alert className="border-green-500/50 bg-green-900/20"><AlertTitle className="text-green-400">Success</AlertTitle><AlertDescription>{pwSuccess}</AlertDescription></Alert>}
            {pwError && <Alert className="border-red-500/50 bg-red-900/20"><AlertTitle className="text-red-400">Error</AlertTitle><AlertDescription>{pwError}</AlertDescription></Alert>}
            <Button type="submit" className="bg-gradient-to-r from-green-500 to-cyan-500 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin inline-block mr-2" /> : <KeyRound className="inline-block mr-2" />} Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-2">
          <Button variant={tab==='users'?"default":"outline"} onClick={()=>setTab('users')}><Users className="h-4 w-4 mr-1"/>Users</Button>
          <Button variant={tab==='logs'?"default":"outline"} onClick={()=>setTab('logs')}><FileText className="h-4 w-4 mr-1"/>Logs</Button>
          <Button variant={tab==='scanHistory'?"default":"outline"} onClick={()=>setTab('scanHistory')}><Eye className="h-4 w-4 mr-1"/>Scan History</Button>
          <Button variant={tab==='settings'?"default":"outline"} onClick={()=>setTab('settings')}><Settings className="h-4 w-4 mr-1"/>Settings</Button>
          <Button variant={tab==='password'?"default":"outline"} onClick={()=>setTab('password')}><KeyRound className="h-4 w-4 mr-1"/>Password</Button>
        </div>
        <Button variant="outline" className="border-pink-400 text-pink-300" onClick={onLogout}><LogOut className="h-4 w-4 mr-1"/>Logout</Button>
      </div>
      <div className="max-w-3xl mx-auto">{content}</div>
    </div>
  );
}
