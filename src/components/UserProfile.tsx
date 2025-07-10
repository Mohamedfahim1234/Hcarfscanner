import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  token: string;
  displayName: string;
  onLogout: () => void;
}

export default function UserProfile({ token, displayName: initialName, onLogout }: Props) {
  const [displayName, setDisplayName] = useState(initialName);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setDisplayName(initialName); }, [initialName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayName, oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage("Profile updated");
      setOldPassword(""); setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-16 bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-2xl">User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          {message && <div className="text-green-400 text-sm">{message}</div>}
          <div className="flex gap-2">
            <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" className="border-red-400 text-red-300" onClick={onLogout}>
              Log Out
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
