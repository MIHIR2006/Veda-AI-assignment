"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, Users, ArrowRight, UserPlus } from "lucide-react";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[];
  ownerId: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: createName, description: createDesc })
      });
      if (res.ok) {
        setCreateOpen(false);
        setCreateName("");
        setCreateDesc("");
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async () => {
    try {
      const session = await getSession();
      const token = (session as any)?.user?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/groups/join`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inviteCode: joinCode })
      });
      if (res.ok) {
        setJoinOpen(false);
        setJoinCode("");
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout title="My Groups">
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 
              className="text-[28px] md:text-[32px] font-[800] tracking-tight text-foreground/90 mb-1" 
              style={{ fontFamily: 'var(--font-bricolage)' }}
            >
              My Groups
            </h1>
            <p className="text-sm font-semibold text-muted-foreground/70">
              Create or join groups to collaborate and share assignments.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full shadow-sm hover:bg-neutral-100 font-bold border-neutral-200 gap-2 h-11 px-6 text-sm">
                  <UserPlus className="h-4 w-4" />
                  Join Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[24px]">
                <DialogHeader>
                  <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-bricolage)' }}>Join a Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input 
                    placeholder="Enter Invite Code (e.g., A8F9C3)" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value)} 
                    className="h-12 bg-neutral-50 rounded-xl"
                  />
                  <Button onClick={handleJoin} variant="dark" className="w-full h-11 rounded-full text-base font-bold">
                    Join Now
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="dark" className="rounded-full shadow-md font-bold gap-2 h-11 px-6 text-sm">
                  <Plus className="h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[24px]">
                <DialogHeader>
                  <DialogTitle className="text-xl" style={{ fontFamily: 'var(--font-bricolage)' }}>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input 
                    placeholder="Group Name" 
                    value={createName} 
                    onChange={e => setCreateName(e.target.value)} 
                    className="h-12 bg-neutral-50 rounded-xl"
                  />
                  <Input 
                    placeholder="Brief description (optional)" 
                    value={createDesc} 
                    onChange={e => setCreateDesc(e.target.value)} 
                    className="h-12 bg-neutral-50 rounded-xl"
                  />
                  <Button onClick={handleCreate} variant="dark" className="w-full h-11 rounded-full text-base font-bold">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-[24px] bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-neutral-100 shadow-sm mt-8">
            <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-[20px] font-[800] tracking-tight mb-2" style={{ fontFamily: 'var(--font-bricolage)' }}>No Groups Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              You aren't a part of any groups. Join one using an invite code or create a new group to get started.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <Link key={group._id} href={`/groups/${group._id}`}>
                <div className="group bg-white rounded-[24px] p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-8 bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center translate-x-2 group-hover:translate-x-0 transition-transform">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-[#E97441] text-white flex items-center justify-center text-lg font-black uppercase">
                      {group.name.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-[800] tracking-tight text-[18px] leading-tight line-clamp-1 pr-6" style={{ fontFamily: 'var(--font-bricolage)' }}>{group.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {group.members.length} {group.members.length === 1 ? 'Member' : 'Members'}
                      </p>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted-foreground/80 font-medium line-clamp-2 leading-relaxed mb-1 flex-1">
                      {group.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
